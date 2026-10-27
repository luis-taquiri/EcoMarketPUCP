import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
// Abre SQLite antes del motor de migraciones, también en instalaciones nuevas de Windows.
db.$queryRawUnsafe("PRAGMA journal_mode=WAL")
  .then(() => console.log("SQLite preparado."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
