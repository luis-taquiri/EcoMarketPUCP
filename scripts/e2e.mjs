import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createHash } from "node:crypto";
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
  TRUST_PROXY: "false",
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
    setCookie: "",
    async action(action, data = {}, status = 200) {
      const r = await fetch(`${base}/api/actions`, {
        method: "POST",
        headers: { Origin: env.APP_URL, "Content-Type": "application/json", Cookie: this.cookie },
        body: JSON.stringify({ action, data }),
      });
      const body = await r.json();
      assert.equal(r.status, status, `${action}: ${JSON.stringify(body)}`);
      if (r.headers.get("set-cookie")) {
        this.setCookie = r.headers.get("set-cookie");
        this.cookie = this.setCookie.split(";")[0];
      }
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
        headers: { Origin: env.APP_URL, Cookie: this.cookie },
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
  for (const page of ["/privacidad", "/terminos"])
    assert.match(await (await anonymous.get(page)).text(), /luis\.taquirid@pucp\.edu\.pe/);
  const registration = await (await anonymous.get("/registro")).text();
  assert.match(registration, /name="acceptTerms"/);
  assert.match(registration, /name="consentData"/);
  assert.doesNotMatch(registration, /type="checkbox"[^>]*checked/);
  ok("Rutas y mutaciones protegidas sin sesión");
  await a.action(
    "register",
    {
      name: "Alumno",
      email: "a@gmail.com",
      password: "TestCampus2026!",
      faculty: "EE.GG. Letras",
      acceptTerms: true,
      consentData: true,
    },
    400,
  );
  const personData = {
    name: "Alumno de prueba",
    email: "sinconsentimiento@pucp.edu.pe",
    password: "TestCampus2026!",
    faculty: "EE.GG. Letras",
  };
  for (const consent of [
    {},
    { acceptTerms: true },
    { acceptTerms: true, consentData: false },
    { acceptTerms: "true", consentData: "true" },
  ])
    await a.action("register", { ...personData, ...consent }, 400);
  assert.equal(await db.user.count(), 0);
  assert.equal(await db.session.count(), 0);
  for (const email of ["a@sub.pucp.edu.pe", "a@pucp.edu.pe.attacker.example", "a@falsopucp.edu.pe"])
    await a.action("register", { ...personData, email, acceptTerms: true, consentData: true }, 400);
  ok("Documentos públicos, consentimiento obligatorio y rechazo del dominio no PUCP");
  for (const [i, person] of [a, b, c].entries())
    await person.action("register", {
      name: `Estudiante ${i}`,
      email: `e2e${i}@pucp.edu.pe`,
      password: "TestCampus2026!",
      faculty: "EE.GG. Letras",
      acceptTerms: true,
      consentData: true,
      role: "ADMIN",
      termsAcceptedAt: "2000-01-01T00:00:00.000Z",
      privacyVersion: "version-falsificada",
    });
  await a.get("/explorar");
  assert.match(a.setCookie, /HttpOnly/i);
  assert.match(a.setCookie, /SameSite=Lax/i);
  const health = await anonymous.get("/api/health");
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal(health.headers.get("x-content-type-options"), "nosniff");
  ok("Registro PUCP, cookie y catálogo autenticado");
  const users = await db.user.findMany({ orderBy: { email: "asc" } });
  assert.notEqual(users[0].passwordHash, "TestCampus2026!");
  for (const user of users) {
    assert.equal(user.role, "STUDENT");
    assert.equal(user.termsVersion, "2026-10-27");
    assert.equal(user.privacyVersion, "2026-10-27");
    assert.ok(user.termsAcceptedAt > new Date("2026-01-01"));
    assert.equal(user.termsAcceptedAt.getTime(), user.privacyAcceptedAt.getTime());
  }
  const persistedSession = await db.session.findFirst();
  assert.equal(persistedSession.tokenHash.length, 64);
  assert.notEqual(persistedSession.tokenHash, a.cookie.split("=")[1]);
  const photo = readFileSync("public/demo/books.jpg");
  const imageA = (await a.upload(photo)).url;
  const imageB = (await b.upload(photo)).url;
  const image = await a.get(imageA);
  assert.equal(image.headers.get("content-type"), "image/webp");
  await anonymous.get(imageA, 401);
  await b.get(imageA, 404);
  await a.get("/uploads/not-a-uuid.webp", 404);
  await a.upload(Buffer.from("not a photo"), "image/heic", 400);
  await a.upload(Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413);
  await a.upload(Buffer.from("not a photo"), "image/jpeg", 400);
  await a.upload(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" /></svg>',
    ),
    "image/jpeg",
    400,
  );
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
  await b.get(imageA);
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
  const profileHtml = await (await a.get("/perfil")).text();
  for (const user of users) assert.ok(!profileHtml.includes(user.passwordHash));
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
  const moderationImage = (await a.upload(photo)).url;
  const donation = (
    await a.action("listing.save", {
      ...material,
      title: "Donación E2E para moderación",
      kind: "DONATION",
      images: [moderationImage],
    })
  ).id;
  await c.get(moderationImage);
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
  assert.equal(
    (await db.user.findUnique({ where: { email: "admin.e2e@pucp.edu.pe" } })).privacyAcceptedAt,
    null,
  );
  await admin.get("/admin");
  await admin.action("listing.status", { id: donation, status: "ARCHIVED" });
  await c.get(moderationImage, 404);
  await a.get(moderationImage);
  await admin.action("report.resolve", { id: report.id });
  ok("Reportes y moderación con permisos separados");
  const csrf = await fetch(`${base}/api/actions`, {
    method: "POST",
    headers: { Origin: "https://otra-web.example", Cookie: a.cookie },
    body: JSON.stringify({ action: "logout" }),
  });
  assert.equal(csrf.status, 403);
  const forgedHost = await fetch(`${base}/api/actions`, {
    method: "POST",
    headers: { Host: "attacker.example", Origin: "http://attacker.example", Cookie: a.cookie },
    body: JSON.stringify({ action: "logout" }),
  });
  assert.equal(forgedHost.status, 403);
  ok("Rechazo de mutaciones desde un origen ajeno");
  await stop();
  await start();
  await a.get("/perfil");
  await a.get(imageA);
  assert.equal(await db.trade.count({ where: { status: "COMPLETED" } }), 1);
  ok("Persistencia de sesión, imágenes y base de datos después de reiniciar");
  const oldCookie = a.cookie;
  await a.action("login", { email: "e2e0@pucp.edu.pe", password: "TestCampus2026!" });
  assert.notEqual(a.cookie, oldCookie);
  assert.equal(
    await db.session.count({
      where: { tokenHash: createHash("sha256").update(oldCookie.split("=")[1]).digest("hex") },
    }),
    0,
  );
  for (let i = 0; i < 15; i++)
    await anonymous.action(
      "login",
      { email: "noexiste@pucp.edu.pe", password: "WrongPassword2026!" },
      401,
    );
  await anonymous.action(
    "login",
    { email: "noexiste@pucp.edu.pe", password: "WrongPassword2026!" },
    429,
  );
  ok("Rotación de sesión y bloqueo de intentos repetidos");
  await a.action("logout");
  await a.get("/perfil", 307);
  ok("Cierre de sesión efectivo");
  await stop();
  env.APP_URL = "https://ecomarket.example";
  await start();
  await admin.action("login", { email: "admin.e2e@pucp.edu.pe", password: "AdminTest2026!" });
  assert.match(admin.setCookie, /; Secure/i);
  ok("Cookie Secure automática detrás de HTTPS aunque COOKIE_SECURE sea false");
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
