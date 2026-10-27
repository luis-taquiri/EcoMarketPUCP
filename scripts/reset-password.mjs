import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
try {
  const email = (await rl.question("Correo del usuario: ")).trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error("No existe ese usuario.");
  process.stdout.write(
    "Nueva contraseña (mínimo 12 caracteres, máximo 72 bytes; no se mostrará): ",
  );
  muted = true;
  const password = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72)
    throw new Error(
      "Usa al menos 12 caracteres y máximo 72 bytes (tildes y emojis ocupan más de un byte).",
    );
  process.stdout.write("Repite la contraseña: ");
  muted = true;
  const confirmation = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  if (password !== confirmation) throw new Error("Las contraseñas no coinciden.");
  const passwordHash = await hash(password, 12);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash } }),
    db.session.deleteMany({ where: { userId: user.id } }),
  ]);
  console.log("Contraseña actualizada. Las sesiones anteriores se cerraron.");
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await db.$disconnect();
}
