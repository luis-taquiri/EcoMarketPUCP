import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const dir = mkdtempSync(path.join(os.tmpdir(), "ecomarket-e2e-"));
const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((r) => probe.close(r));
const base = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  DATABASE_URL: `file:${path.join(dir, "test.db").replaceAll("\\", "/")}`,
  UPLOAD_DIR: path.join(dir, "uploads"),
  APP_URL: base,
  COOKIE_SECURE: "false",
  NODE_ENV: "production",
};
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });
let server;
let logs = "";
let checks = 0;
function ok(label) {
  checks++;
  console.log(`OK ${checks}: ${label}`);
}
function run(args) {
  const r = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  assert.equal(r.status, 0);
}
async function start() {
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (s) => (logs += s));
  server.stderr.on("data", (s) => (logs += s));
  for (let n = 0; n < 80; n++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`El servidor no arrancó. ${logs}`);
}
async function stop() {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, "exit");
  }
}
function client() {
  return {
    cookie: "",
    async action(action, data = {}, status = 200) {
      const r = await fetch(`${base}/api/actions`, {
        method: "POST",
        headers: { Origin: base, "Content-Type": "application/json", Cookie: this.cookie },
        body: JSON.stringify({ action, data }),
      });
      const body = await r.json();
      assert.equal(r.status, status, `${action}: ${JSON.stringify(body)}`);
      if (r.headers.get("set-cookie")) this.cookie = r.headers.get("set-cookie").split(";")[0];
      return body;
    },
    async get(url, status = 200) {
      const r = await fetch(base + url, { headers: { Cookie: this.cookie }, redirect: "manual" });
      assert.equal(r.status, status, `GET ${url}`);
      return r;
    },
    async upload(bytes, type = "image/jpeg", status = 200) {
      const form = new FormData();
      form.set("file", new Blob([bytes], { type }), "foto.jpg");
      const r = await fetch(`${base}/api/uploads`, {
        method: "POST",
        headers: { Origin: base, Cookie: this.cookie },
        body: form,
      });
      const body = await r.json();
      assert.equal(r.status, status, JSON.stringify(body));
      return body;
    },
  };
}
try {
  run(["--import", "tsx", "scripts/init-db.ts"]);
  run(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  await start();
  const anonymous = client(),
    a = client(),
    b = client(),
    c = client(),
    admin = client();
  await anonymous.get("/explorar", 307);
  await anonymous.action("profile", {}, 401);
  ok("Rutas y mutaciones protegidas sin sesión");
  await a.action(
    "register",
    { name: "Alumno", email: "a@gmail.com", password: "TestCampus2026!", faculty: "EE.GG. Letras" },
    400,
  );
  for (const [i, person] of [a, b, c].entries())
    await person.action("register", {
      name: `Estudiante ${i}`,
      email: `e2e${i}@pucp.edu.pe`,
      password: "TestCampus2026!",
      faculty: "EE.GG. Letras",
    });
  await a.get("/explorar");
  ok("Registro PUCP, cookie y catálogo autenticado");
  const users = await db.user.findMany({ orderBy: { email: "asc" } });
  assert.notEqual(users[0].passwordHash, "TestCampus2026!");
  const photo = readFileSync("public/demo/books.jpg");
  const imageA = (await a.upload(photo)).url;
  const imageB = (await b.upload(photo)).url;
  const image = await a.get(imageA);
  assert.equal(image.headers.get("content-type"), "image/webp");
  await anonymous.get(imageA, 401);
  await a.upload(Buffer.from("not a photo"), "image/heic", 400);
  await a.upload(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413);
  await a.upload(Buffer.from("not a photo"), "image/jpeg", 400);
  ok("Subida, lectura inmediata, tipos, contenido y tamaño de imágenes");
  const material = {
    title: "Libro de prueba E2E",
    description: "Material propio en buen estado para intercambiar sin dinero.",
    category: "Libros",
    faculty: "EE.GG. Letras",
    condition: "Buen estado",
    kind: "TRADE",
    wanted: "Otros libros",
    location: "Biblioteca Central",
    images: [imageA],
  };
  await b.action("listing.save", material, 400);
  const target = (await a.action("listing.save", material)).id;
  const offer = (
    await b.action("listing.save", {
      ...material,
      title: "Apuntes de prueba E2E",
      images: [imageB],
    })
  ).id;
  await b.action("listing.save", { ...material, id: target }, 403);
  await a.action("listing.save", { ...material, id: target, title: "Libro actualizado E2E" });
  await a.get(`/materiales/${target}`);
  ok("Publicación, edición y propiedad de materiales e imágenes");
  await a.action("favorite", { id: offer, saved: true });
  await a.action("favorite", { id: offer, saved: true });
  assert.equal(await db.favorite.count(), 1);
  await a.action("profile", {
    name: "Mariana de Prueba",
    faculty: "Arquitectura",
    cycle: "5.º ciclo",
    bio: "Perfil editado.",
  });
  await a.get("/perfil?tab=favorites");
  ok("Favoritos idempotentes y edición de perfil");
  const wanted = (
    await a.action("wanted.create", {
      title: "Necesito apuntes para estudiar",
      description: "Busco apuntes completos para mis cursos.",
      category: "Impresos y apuntes",
      faculty: "EE.GG. Letras",
    })
  ).id;
  await b.action("wanted.respond", {
    id: wanted,
    listingId: offer,
    message: "Respuesta privada verificable E2E",
  });
  assert.match(await (await a.get("/pedidos?mine=1")).text(), /Respuesta privada verificable E2E/);
  assert.doesNotMatch(await (await c.get("/pedidos")).text(), /Respuesta privada verificable E2E/);
  await a.action("wanted.close", { id: wanted });
  await b.action(
    "wanted.respond",
    { id: wanted, listingId: offer, message: "Respuesta fuera de plazo" },
    409,
  );
  ok("Tablón, respuestas privadas y cierre de pedidos");
  const t = (
    await b.action("trade.propose", {
      targetId: target,
      offeredId: offer,
      message: "Quiero hacer este trueque de prueba.",
    })
  ).id;
  await c.get(`/solicitudes/${t}`, 404);
  await c.action("trade.message", { id: t, body: "No autorizado" }, 403);
  await a.action("trade.accept", { id: t });
  await b.action("trade.message", { id: t, body: "Nos vemos en la biblioteca." });
  await a.action("listing.save", { ...material, id: target }, 409);
  await a.action("trade.meeting", {
    id: t,
    meetingPlace: "Biblioteca Central",
    meetingAt: new Date(Date.now() + 86400000).toISOString(),
  });
  await b.action("trade.confirm", { id: t });
  assert.equal((await db.trade.findUnique({ where: { id: t } })).status, "ACCEPTED");
  await a.action("trade.confirm", { id: t });
  assert.equal((await db.trade.findUnique({ where: { id: t } })).status, "COMPLETED");
  await b.action("trade.review", { id: t, rating: 5, comment: "Una entrega puntual y cordial." });
  assert.match(await (await a.get("/perfil")).text(), /intercambios completados/);
  ok("Propuesta, permisos, reserva, chat, encuentro, doble confirmación y valoración");
  const donation = (
    await a.action("listing.save", {
      ...material,
      title: "Donación E2E para moderación",
      kind: "DONATION",
    })
  ).id;
  await b.action("report", {
    id: donation,
    reason: "Otro motivo",
    details: "Reporte de demostración para probar el flujo.",
  });
  const report = await db.report.findFirst();
  await b.action("report.resolve", { id: report.id }, 403);
  await db.user.create({
    data: {
      name: "Administrador E2E",
      email: "admin.e2e@pucp.edu.pe",
      passwordHash: await hash("AdminTest2026!", 12),
      faculty: "Otras facultades",
      role: "ADMIN",
    },
  });
  await admin.action("login", { email: "admin.e2e@pucp.edu.pe", password: "AdminTest2026!" });
  await admin.get("/admin");
  await admin.action("listing.status", { id: donation, status: "ARCHIVED" });
  await admin.action("report.resolve", { id: report.id });
  ok("Reportes y moderación con permisos separados");
  const csrf = await fetch(`${base}/api/actions`, {
    method: "POST",
    headers: { Origin: "https://otra-web.example", Cookie: a.cookie },
    body: JSON.stringify({ action: "logout" }),
  });
  assert.equal(csrf.status, 403);
  ok("Rechazo de mutaciones desde un origen ajeno");
  await stop();
  await start();
  await a.get("/perfil");
  await a.get(imageA);
  assert.equal(await db.trade.count({ where: { status: "COMPLETED" } }), 1);
  ok("Persistencia de sesión, imágenes y base de datos después de reiniciar");
  await a.action("logout");
  await a.get("/perfil", 307);
  ok("Cierre de sesión efectivo");
  console.log(`\n${checks} comprobaciones HTTP completas. Base temporal aislada.`);
} catch (e) {
  console.error(e);
  console.error(logs);
  process.exitCode = 1;
} finally {
  await stop();
  await db.$disconnect();
  if (path.dirname(dir) === os.tmpdir() && path.basename(dir).startsWith("ecomarket-e2e-"))
    rmSync(dir, { recursive: true, force: true });
}
