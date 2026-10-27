import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { AppError } from "./validation";
const COOKIE = "ecomarket_session";
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hash(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.disabled) return null;
  return session.user;
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError("Inicia sesión para continuar.", 401);
  return user;
}
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
export async function signIn(userId: string) {
  const jar = await cookies();
  const previous = jar.get(COOKIE)?.value;
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.$transaction(async (tx) => {
    const account = await tx.user.findUnique({ where: { id: userId }, select: { disabled: true } });
    if (!account || account.disabled) throw new AppError("Correo o contraseña incorrectos.", 401);
    await tx.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          ...(previous ? [{ tokenHash: hash(previous) }] : []),
        ],
      },
    });
    await tx.session.create({ data: { tokenHash: hash(token), userId, expiresAt: expires } });
  });
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true" || process.env.APP_URL?.startsWith("https://"),
    path: "/",
    expires,
  });
}
export async function signOut() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hash(token) } });
  jar.delete(COOKIE);
}
