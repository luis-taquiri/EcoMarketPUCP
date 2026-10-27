import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "./validation";
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
  const allowed = new Set([request.nextUrl.origin]);
  if (process.env.APP_URL) allowed.add(new URL(process.env.APP_URL).origin);
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
const attempts = new Map<string, { count: number; until: number }>();
export function limitLogin(key: string) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const entry = attempts.get(key) ?? { count: 0, until: now + 10 * 60 * 1000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 15) throw new AppError("Demasiados intentos. Espera 10 minutos.", 429);
}
