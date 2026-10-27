import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log("ADMIN_EMAIL y ADMIN_PASSWORD vacíos: no se crea administrador.");
    return;
  }
  if (!/^[^@\s]+@pucp\.edu\.pe$/.test(email) || password.length < 12 || password.length > 72)
    throw new Error("Usa un correo @pucp.edu.pe y una contraseña de 12 a 72 caracteres.");
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(
      "El usuario ya existe. No se cambian sus permisos ni su contraseña automáticamente.",
    );
    return;
  }
  await db.user.create({
    data: {
      email,
      passwordHash: await hash(password, 12),
      name: "Administración EcoMarket",
      faculty: "Otras facultades",
      role: "ADMIN",
    },
  });
  console.log("Administrador inicial creado.");
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
