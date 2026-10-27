import test, { after } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/lib/db";
import { propose, actOnTrade } from "../src/lib/trades";
after(() => db.$disconnect());
let index = 0;
async function setup(kind = "TRADE") {
  index++;
  const users = await Promise.all(
    ["owner", "alice", "bob"].map((name) =>
      db.user.create({
        data: {
          name,
          email: `${name}${index}@pucp.edu.pe`,
          passwordHash: "test-only",
          faculty: "EE.GG. Letras",
        },
      }),
    ),
  );
  const items = await Promise.all(
    users.map((u, i) =>
      db.listing.create({
        data: {
          userId: u.id,
          title: `Material ${i}`,
          description: "Descripción del material.",
          category: "Libros",
          faculty: u.faculty,
          condition: "Buen estado",
          kind: i === 0 ? kind : "TRADE",
          wanted: "Un libro",
          images: [],
        },
      }),
    ),
  );
  return { users, items };
}
test("Aceptar reserva los dos objetos y rechaza propuestas incompatibles", async () => {
  const { users: u, items: i } = await setup();
  const a = await propose(u[1].id, {
    targetId: i[0].id,
    offeredId: i[1].id,
    message: "Mi propuesta para este material.",
  });
  const b = await propose(u[2].id, {
    targetId: i[0].id,
    offeredId: i[2].id,
    message: "Otra propuesta para el mismo material.",
  });
  await assert.rejects(actOnTrade(u[1].id, a.id, "accept"));
  await actOnTrade(u[0].id, a.id, "accept");
  assert.equal((await db.listing.findUniqueOrThrow({ where: { id: i[0].id } })).status, "RESERVED");
  assert.equal((await db.listing.findUniqueOrThrow({ where: { id: i[1].id } })).status, "RESERVED");
  assert.equal((await db.trade.findUniqueOrThrow({ where: { id: b.id } })).status, "REJECTED");
  await assert.rejects(actOnTrade(u[0].id, b.id, "accept"));
  await assert.rejects(
    propose(u[2].id, {
      targetId: i[1].id,
      offeredId: i[2].id,
      message: "Intento con material reservado.",
    }),
  );
});
test("Solo dos confirmaciones completan el intercambio; confirmar otra vez es idempotente", async () => {
  const { users: u, items: i } = await setup();
  const t = await propose(u[1].id, {
    targetId: i[0].id,
    offeredId: i[1].id,
    message: "Quisiera intercambiar estos libros.",
  });
  await actOnTrade(u[0].id, t.id, "accept");
  await assert.rejects(actOnTrade(u[1].id, t.id, "confirm"));
  await actOnTrade(u[0].id, t.id, "meeting", {
    meetingPlace: "Biblioteca Central",
    meetingAt: new Date(Date.now() + 86400000).toISOString(),
  });
  await actOnTrade(u[1].id, t.id, "confirm");
  assert.equal((await db.trade.findUniqueOrThrow({ where: { id: t.id } })).status, "ACCEPTED");
  await assert.rejects(actOnTrade(u[0].id, t.id, "cancel"));
  await actOnTrade(u[0].id, t.id, "confirm");
  await actOnTrade(u[0].id, t.id, "confirm");
  assert.equal((await db.trade.findUniqueOrThrow({ where: { id: t.id } })).status, "COMPLETED");
  assert.equal(
    await db.listing.count({ where: { id: { in: [i[0].id, i[1].id] }, status: "EXCHANGED" } }),
    2,
  );
  await actOnTrade(u[1].id, t.id, "review", {
    rating: 5,
    comment: "Intercambio completado puntualmente.",
  });
  await assert.rejects(
    actOnTrade(u[1].id, t.id, "review", { rating: 4, comment: "Valoración duplicada." }),
  );
  await assert.rejects(
    actOnTrade(u[2].id, t.id, "review", { rating: 5, comment: "No participé." }),
  );
});
test("Cancelar libera reservas; no se puede actuar en solicitudes ajenas", async () => {
  const { users: u, items: i } = await setup();
  const t = await propose(u[1].id, {
    targetId: i[0].id,
    offeredId: i[1].id,
    message: "Propongo estos materiales.",
  });
  await actOnTrade(u[0].id, t.id, "accept");
  await assert.rejects(actOnTrade(u[2].id, t.id, "cancel"));
  await assert.rejects(actOnTrade(u[2].id, t.id, "message", { body: "Mensaje no autorizado" }));
  await actOnTrade(u[1].id, t.id, "cancel");
  assert.equal(
    await db.listing.count({ where: { id: { in: [i[0].id, i[1].id] }, status: "AVAILABLE" } }),
    2,
  );
});
test("Una donación no exige ni reserva el material ofrecido", async () => {
  const { users: u, items: i } = await setup("DONATION");
  const t = await propose(u[1].id, {
    targetId: i[0].id,
    offeredId: i[1].id,
    message: "Me serviría la donación, gracias.",
  });
  assert.equal(t.offeredId, null);
  await actOnTrade(u[0].id, t.id, "accept");
  assert.equal(
    (await db.listing.findUniqueOrThrow({ where: { id: i[1].id } })).status,
    "AVAILABLE",
  );
});
test("Se rechaza el propio material, el de terceros y las solicitudes duplicadas", async () => {
  const { users: u, items: i } = await setup();
  const message = "Propuesta inválida para comprobar permisos.";
  await assert.rejects(propose(u[0].id, { targetId: i[0].id, offeredId: i[1].id, message }));
  await assert.rejects(propose(u[1].id, { targetId: i[0].id, offeredId: i[2].id, message }));
  await propose(u[1].id, { targetId: i[0].id, offeredId: i[1].id, message });
  await assert.rejects(propose(u[1].id, { targetId: i[0].id, offeredId: i[1].id, message }));
});
test("Dos aceptaciones simultáneas no pueden reservar dos veces un material", async () => {
  const { users: u, items: i } = await setup();
  const a = await propose(u[1].id, {
    targetId: i[0].id,
    offeredId: i[1].id,
    message: "Primera propuesta concurrente.",
  });
  const b = await propose(u[2].id, {
    targetId: i[0].id,
    offeredId: i[2].id,
    message: "Segunda propuesta concurrente.",
  });
  const results = await Promise.allSettled([
    actOnTrade(u[0].id, a.id, "accept"),
    actOnTrade(u[0].id, b.id, "accept"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(await db.trade.count({ where: { targetId: i[0].id, status: "ACCEPTED" } }), 1);
});
