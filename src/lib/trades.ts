import { db } from "./db";
import { ensure } from "./validation";
import { LOCATIONS } from "./constants";
import { z } from "zod";
const proposal = z.object({
  targetId: z.string().min(1),
  offeredId: z.string().nullable().optional(),
  message: z.string().trim().min(10, "Escribe un mensaje de al menos 10 caracteres.").max(1500),
});
export async function propose(userId: string, input: unknown) {
  const data = proposal.parse(input);
  return db.$transaction(async (tx) => {
    const target = await tx.listing.findUnique({
      where: { id: data.targetId },
      include: { user: true },
    });
    ensure(
      target && target.status === "AVAILABLE" && !target.user.disabled,
      "Este material ya no está disponible.",
      409,
    );
    ensure(target.userId !== userId, "No puedes solicitar tu propio material.");
    let offeredId: string | null = null;
    if (target.kind === "TRADE") {
      ensure(data.offeredId, "Elige uno de tus materiales para ofrecerlo.");
      const offered = await tx.listing.findUnique({ where: { id: data.offeredId } });
      ensure(
        offered &&
          offered.userId === userId &&
          offered.status === "AVAILABLE" &&
          offered.kind === "TRADE",
        "El material ofrecido no está disponible para trueque.",
        409,
      );
      offeredId = offered.id;
    }
    const duplicate = await tx.trade.findFirst({
      where: { targetId: target.id, requesterId: userId, status: { in: ["PENDING", "ACCEPTED"] } },
    });
    ensure(!duplicate, "Ya tienes una solicitud activa para este material.", 409);
    return tx.trade.create({
      data: {
        requesterId: userId,
        receiverId: target.userId,
        targetId: target.id,
        offeredId,
        meetingPlace: target.location,
        messages: { create: { userId, body: data.message } },
      },
    });
  });
}
export async function actOnTrade(
  userId: string,
  id: string,
  action: string,
  input: Record<string, unknown> = {},
) {
  return db.$transaction(
    async (tx) => {
      const trade = await tx.trade.findUnique({ where: { id } });
      ensure(trade, "Solicitud no encontrada.", 404);
      const receiver = trade.receiverId === userId;
      ensure(receiver || trade.requesterId === userId, "No tienes acceso a esta solicitud.", 403);
      const ids = [trade.targetId, ...(trade.offeredId ? [trade.offeredId] : [])];
      if (action === "accept") {
        ensure(
          receiver && trade.status === "PENDING",
          "Solo quien recibe una propuesta pendiente puede aceptarla.",
          409,
        );
        // Reservar ambos materiales y cerrar propuestas incompatibles en la misma transacción.
        const reserved = await tx.listing.updateMany({
          where: { id: { in: ids }, status: "AVAILABLE", user: { disabled: false } },
          data: { status: "RESERVED" },
        });
        ensure(reserved.count === ids.length, "Uno de los materiales ya no está disponible.", 409);
        await tx.trade.updateMany({
          where: {
            id: { not: id },
            status: "PENDING",
            OR: [{ targetId: { in: ids } }, { offeredId: { in: ids } }],
          },
          data: { status: "REJECTED" },
        });
        return tx.trade.update({ where: { id }, data: { status: "ACCEPTED" } });
      }
      if (action === "reject") {
        ensure(
          receiver && trade.status === "PENDING",
          "La propuesta ya no se puede rechazar.",
          409,
        );
        return tx.trade.update({ where: { id }, data: { status: "REJECTED" } });
      }
      if (action === "cancel") {
        ensure(
          ["PENDING", "ACCEPTED"].includes(trade.status),
          "La solicitud ya está cerrada.",
          409,
        );
        ensure(
          !trade.receiverConfirmed && !trade.requesterConfirmed,
          "Ya existe una confirmación de entrega. Contacta al administrador.",
          409,
        );
        if (trade.status === "ACCEPTED")
          await tx.listing.updateMany({
            where: { id: { in: ids }, status: "RESERVED" },
            data: { status: "AVAILABLE" },
          });
        return tx.trade.update({ where: { id }, data: { status: "CANCELLED" } });
      }
      if (action === "meeting") {
        ensure(
          trade.status === "ACCEPTED" && !trade.receiverConfirmed && !trade.requesterConfirmed,
          "No se puede modificar este encuentro.",
          409,
        );
        const meeting = z
          .object({
            meetingPlace: z.enum(LOCATIONS),
            meetingAt: z.string().datetime({ offset: true }),
          })
          .parse(input);
        ensure(new Date(meeting.meetingAt) > new Date(), "Elige una fecha futura.");
        await tx.message.create({
          data: {
            tradeId: id,
            userId,
            body: `Encuentro propuesto: ${meeting.meetingPlace}, ${new Date(meeting.meetingAt).toLocaleString("es-PE", { timeZone: "America/Lima" })}. Confirmen los detalles por este chat.`,
          },
        });
        return tx.trade.update({
          where: { id },
          data: { meetingPlace: meeting.meetingPlace, meetingAt: new Date(meeting.meetingAt) },
        });
      }
      if (action === "confirm") {
        if (trade.status === "COMPLETED") return trade;
        ensure(trade.status === "ACCEPTED", "La propuesta debe estar aceptada.", 409);
        ensure(trade.meetingAt, "Acuerden un lugar y una fecha antes de confirmar.");
        const updated = await tx.trade.update({
          where: { id },
          data: receiver ? { receiverConfirmed: true } : { requesterConfirmed: true },
        });
        if (updated.receiverConfirmed && updated.requesterConfirmed) {
          await tx.listing.updateMany({
            where: { id: { in: ids }, status: "RESERVED" },
            data: { status: "EXCHANGED" },
          });
          return tx.trade.update({ where: { id }, data: { status: "COMPLETED" } });
        }
        return updated;
      }
      if (action === "message") {
        ensure(
          ["PENDING", "ACCEPTED"].includes(trade.status),
          "Esta conversación ya está cerrada.",
          409,
        );
        const body = z.string().trim().min(1).max(1500).parse(input.body);
        return tx.message.create({ data: { tradeId: id, userId, body } });
      }
      if (action === "review") {
        ensure(trade.status === "COMPLETED", "Solo puedes valorar intercambios completados.", 409);
        const data = z
          .object({
            rating: z.number().int().min(1).max(5),
            comment: z.string().trim().min(3).max(500),
          })
          .parse(input);
        return tx.review.create({
          data: {
            tradeId: id,
            authorId: userId,
            reviewedId: receiver ? trade.requesterId : trade.receiverId,
            ...data,
          },
        });
      }
      ensure(false, "Acción no válida.");
    },
    { maxWait: 10000, timeout: 15000 },
  );
}
