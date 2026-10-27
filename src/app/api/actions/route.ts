import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser, signIn, signOut } from "@/lib/auth";
import { apiError, sameOrigin, limitLogin, readLimited } from "@/lib/http";
import {
  ensure,
  AppError,
  registerSchema,
  profileSchema,
  listingSchema,
  wantedSchema,
  emailSchema,
} from "@/lib/validation";
import { actOnTrade, propose } from "@/lib/trades";
import { photos } from "@/lib/constants";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const raw = (await readLimited(request, 32000)).toString("utf8");
    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new AppError("Formato de solicitud inválido.");
    }
    const { action, data } = z
      .object({ action: z.string(), data: z.record(z.string(), z.unknown()).default({}) })
      .parse(json);
    if (action === "register") {
      const parsed = registerSchema.parse(data);
      limitLogin(parsed.email);
      const { password, ...profile } = parsed;
      const user = await db.user.create({
        data: { ...profile, passwordHash: await hash(password, 12) },
      });
      await signIn(user.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "login") {
      const email = emailSchema.parse(data.email);
      const password = z.string().max(72).parse(data.password);
      limitLogin(email);
      const user = await db.user.findUnique({ where: { email } });
      ensure(
        user && !user.disabled && (await compare(password, user.passwordHash)),
        "Correo o contraseña incorrectos.",
        401,
      );
      await signIn(user.id);
      return NextResponse.json({ ok: true });
    }
    if (action === "logout") {
      await signOut();
      return NextResponse.json({ ok: true });
    }
    const user = await requireUser();
    const id = () => z.string().min(1).parse(data.id);
    if (action === "profile") {
      await db.user.update({ where: { id: user.id }, data: profileSchema.parse(data) });
    } else if (action === "listing.save") {
      const parsed = listingSchema.parse(data);
      const existing =
        typeof data.id === "string"
          ? await db.listing.findUnique({ where: { id: data.id } })
          : null;
      if (data.id)
        ensure(existing && existing.userId === user.id, "No puedes editar esta publicación.", 403);
      if (existing)
        ensure(
          ["AVAILABLE", "ARCHIVED"].includes(existing.status),
          "No puedes modificar un material reservado o entregado.",
          409,
        );
      const previous = photos(existing?.images);
      const uploads = await db.upload.findMany({
        where: { userId: user.id },
        select: { name: true },
      });
      const allowed = new Set([...uploads.map((u) => `/uploads/${u.name}`), ...previous]);
      ensure(
        parsed.images.every((p) => allowed.has(p)),
        "Una de las imágenes no pertenece a tu cuenta.",
      );
      const listing = await db.$transaction(async (tx) => {
        if (existing) {
          const current = await tx.listing.findUnique({ where: { id: existing.id } });
          ensure(
            current && ["AVAILABLE", "ARCHIVED"].includes(current.status),
            "El material acaba de ser reservado o entregado.",
            409,
          );
          await tx.trade.updateMany({
            where: {
              status: "PENDING",
              OR: [{ targetId: existing.id }, { offeredId: existing.id }],
            },
            data: { status: "REJECTED" },
          });
          return tx.listing.update({
            where: { id: existing.id },
            data: { ...parsed, wanted: parsed.kind === "TRADE" ? parsed.wanted : "" },
          });
        }
        return tx.listing.create({
          data: {
            ...parsed,
            userId: user.id,
            wanted: parsed.kind === "TRADE" ? parsed.wanted : "",
          },
        });
      });
      return NextResponse.json({ ok: true, id: listing.id });
    } else if (action === "listing.status") {
      const listing = await db.listing.findUnique({ where: { id: id() } });
      ensure(
        listing && (listing.userId === user.id || user.role === "ADMIN"),
        "No tienes permiso.",
        403,
      );
      ensure(
        ["AVAILABLE", "ARCHIVED"].includes(listing.status),
        "No puedes archivar un material reservado o entregado.",
        409,
      );
      const status = z.enum(["AVAILABLE", "ARCHIVED"]).parse(data.status);
      await db.$transaction(async (tx) => {
        const current = await tx.listing.findUnique({ where: { id: listing.id } });
        ensure(
          current && ["AVAILABLE", "ARCHIVED"].includes(current.status),
          "El material acaba de ser reservado o entregado.",
          409,
        );
        await tx.listing.update({ where: { id: listing.id }, data: { status } });
        if (status === "ARCHIVED")
          await tx.trade.updateMany({
            where: { status: "PENDING", OR: [{ targetId: listing.id }, { offeredId: listing.id }] },
            data: { status: "REJECTED" },
          });
      });
    } else if (action === "favorite") {
      const listing = await db.listing.findUnique({ where: { id: id() } });
      ensure(listing && listing.status !== "ARCHIVED", "Material no encontrado.", 404);
      const key = { userId: user.id, listingId: listing.id };
      if (data.saved === true)
        await db.favorite.upsert({ where: { userId_listingId: key }, create: key, update: {} });
      else await db.favorite.deleteMany({ where: key });
    } else if (action === "trade.propose") {
      const trade = await propose(user.id, data);
      return NextResponse.json({ ok: true, id: trade.id });
    } else if (action.startsWith("trade.")) {
      await actOnTrade(user.id, id(), action.slice(6), data);
    } else if (action === "wanted.create") {
      const wanted = await db.wanted.create({
        data: { ...wantedSchema.parse(data), userId: user.id },
      });
      return NextResponse.json({ ok: true, id: wanted.id });
    } else if (action === "wanted.close") {
      const wanted = await db.wanted.findUnique({ where: { id: id() } });
      ensure(wanted && wanted.userId === user.id, "No tienes permiso.", 403);
      await db.wanted.update({ where: { id: wanted.id }, data: { status: "CLOSED" } });
    } else if (action === "wanted.respond") {
      const parsed = z
        .object({
          id: z.string(),
          listingId: z.string(),
          message: z.string().trim().min(5).max(1000),
        })
        .parse(data);
      const wanted = await db.wanted.findUnique({ where: { id: parsed.id } });
      ensure(
        wanted && wanted.status === "OPEN" && wanted.userId !== user.id,
        "Este pedido ya no admite respuestas.",
        409,
      );
      const listing = await db.listing.findUnique({ where: { id: parsed.listingId } });
      ensure(
        listing && listing.userId === user.id && listing.status === "AVAILABLE",
        "Elige un material tuyo disponible.",
      );
      await db.wantedResponse.create({
        data: {
          wantedId: wanted.id,
          listingId: listing.id,
          userId: user.id,
          message: parsed.message,
        },
      });
    } else if (action === "report") {
      const parsed = z
        .object({
          id: z.string(),
          reason: z.enum([
            "Solicita dinero",
            "Contenido inapropiado",
            "Información engañosa",
            "Conducta inadecuada",
            "Otro motivo",
          ]),
          details: z.string().trim().min(10).max(1500),
        })
        .parse(data);
      ensure(
        await db.listing.findUnique({ where: { id: parsed.id } }),
        "Publicación no encontrada.",
        404,
      );
      const recent = await db.report.count({
        where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600000) } },
      });
      ensure(recent < 10, "Ya enviaste varios reportes. Espera antes de enviar otro.", 429);
      await db.report.create({
        data: {
          userId: user.id,
          listingId: parsed.id,
          reason: parsed.reason,
          details: parsed.details,
        },
      });
    } else if (action === "report.resolve") {
      ensure(user.role === "ADMIN", "No tienes permiso.", 403);
      await db.report.update({ where: { id: id() }, data: { status: "RESOLVED" } });
    } else ensure(false, "Acción desconocida.", 404);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
