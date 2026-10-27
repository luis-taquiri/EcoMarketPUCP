import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { db } from "../src/lib/db";

after(() => db.$disconnect());

function seed() {
  return spawnSync(process.execPath, ["--import", "tsx", "prisma/seed.ts"], {
    env: { ...process.env, DEMO_PASSWORD: "DemoTestsOnly2026!" },
    encoding: "utf8",
  });
}

test("La demo convive con usuarios existentes y no duplica ni restablece datos", async () => {
  const admin = await db.user.create({
    data: {
      name: "Administrador existente",
      email: "seed-admin@pucp.edu.pe",
      passwordHash: "existing-admin-hash",
      faculty: "Otras facultades",
      role: "ADMIN",
    },
  });
  const student = await db.user.create({
    data: {
      name: "Estudiante existente",
      email: "seed-student@pucp.edu.pe",
      passwordHash: "existing-student-hash",
      faculty: "Derecho",
    },
  });
  const first = seed();
  assert.equal(first.status, 0, first.stderr);
  const demoUsers = await db.user.findMany({ where: { email: { endsWith: ".demo@pucp.edu.pe" } } });
  assert.equal(demoUsers.length, 6);
  const ids = demoUsers.map((user) => user.id);
  assert.equal(await db.listing.count({ where: { userId: { in: ids } } }), 6);
  assert.equal(await db.wanted.count({ where: { userId: { in: ids } } }), 4);
  assert.equal(await db.trade.count({ where: { requesterId: { in: ids } } }), 1);
  assert.deepEqual(await db.user.findUnique({ where: { id: admin.id } }), admin);
  assert.deepEqual(await db.user.findUnique({ where: { id: student.id } }), student);

  const mariana = demoUsers.find((user) => user.email === "mariana.demo@pucp.edu.pe")!;
  await db.user.update({ where: { id: mariana.id }, data: { passwordHash: "changed-demo-hash" } });
  await db.listing.updateMany({ where: { userId: mariana.id }, data: { status: "ARCHIVED" } });
  const second = seed();
  assert.equal(second.status, 0, second.stderr);
  assert.equal(await db.user.count({ where: { id: { in: ids } } }), 6);
  assert.equal(await db.listing.count({ where: { userId: { in: ids } } }), 6);
  assert.equal(await db.wanted.count({ where: { userId: { in: ids } } }), 4);
  assert.equal(await db.trade.count({ where: { requesterId: { in: ids } } }), 1);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: mariana.id } })).passwordHash,
    "changed-demo-hash",
  );
  assert.equal(await db.listing.count({ where: { userId: mariana.id, status: "ARCHIVED" } }), 1);

  for (const user of demoUsers.filter((user) => user.id !== mariana.id))
    await db.user.update({
      where: { id: user.id },
      data: { email: `${user.id}.seed-renamed@pucp.edu.pe` },
    });
  const conflict = seed();
  assert.notEqual(conflict.status, 0);
  assert.match(conflict.stderr, /Ya existen algunos correos/);
  assert.equal(await db.user.count({ where: { email: { endsWith: ".demo@pucp.edu.pe" } } }), 1);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: mariana.id } })).passwordHash,
    "changed-demo-hash",
  );
  assert.deepEqual(await db.user.findUnique({ where: { id: admin.id } }), admin);
});
