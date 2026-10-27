import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "./validation";
import { isIP } from "node:net";
import { limitAttempts } from "./rate-limit";
export async function readLimited(request: Request, limit: number) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw new AppError("Solicitud demasiado grande.", 413);
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new AppError("Solicitud demasiado grande.", 413);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) throw new AppError("Falta el origen de la solicitud.", 403);
  if (!process.env.APP_URL && process.env.NODE_ENV === "production")
    throw new AppError("El servidor necesita configurar APP_URL.", 503);
  const site = new URL(process.env.APP_URL || request.nextUrl.origin);
  const allowed = new Set([site.origin]);
  if (["localhost", "127.0.0.1", "[::1]"].includes(site.hostname))
    for (const host of ["localhost", "127.0.0.1", "[::1]"])
      allowed.add(`${site.protocol}//${host}${site.port ? `:${site.port}` : ""}`);
  if (!allowed.has(origin)) throw new AppError("Origen no permitido.", 403);
}
export function apiError(error: unknown) {
  if (error instanceof AppError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues[0]?.message || "Revisa los datos." },
      { status: 400 },
    );
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    return NextResponse.json({ error: "Ya existe un registro con estos datos." }, { status: 409 });
  console.error(error);
  return NextResponse.json(
    { error: "No se pudo completar la operación. Inténtalo de nuevo." },
    { status: 500 },
  );
}
export function limitAuthentication(request: NextRequest, email: string) {
  // Apache añade la IP real al final. Solo se confía en ella detrás del proxy local configurado.
  const forwarded =
    process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
      : undefined;
  const network = forwarded && isIP(forwarded) ? forwarded : "direct";
  limitAttempts(`auth-network:${network}`, 60, 10 * 60 * 1000);
  limitAttempts(`auth-account:${email}`, 15, 10 * 60 * 1000);
}
