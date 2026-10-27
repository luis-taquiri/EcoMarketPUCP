import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { sameOrigin, limitAuthentication } from "../src/lib/http";
import { limitAttempts } from "../src/lib/rate-limit";
import { AppError } from "../src/lib/validation";

test("El origen configurado prevalece sobre un Host controlado por un atacante", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://ecomarket.mcserverzcra.co.uk";
  try {
    for (const origin of [
      undefined,
      "null",
      "https://attacker.example",
      "https://ecomarket.mcserverzcra.co.uk.evil.example",
      "http://ecomarket.mcserverzcra.co.uk",
    ]) {
      const request = new NextRequest("https://attacker.example/api/actions", {
        headers: origin ? { Origin: origin } : {},
      });
      assert.throws(
        () => sameOrigin(request),
        (e: unknown) => e instanceof AppError && e.status === 403,
      );
    }
    assert.doesNotThrow(() =>
      sameOrigin(
        new NextRequest("http://localhost:3000/api/actions", {
          headers: { Origin: "https://ecomarket.mcserverzcra.co.uk" },
        }),
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});

test("Los alias locales solo se aceptan en el puerto de desarrollo configurado", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "http://localhost:3200";
  try {
    assert.doesNotThrow(() =>
      sameOrigin(
        new NextRequest("http://localhost:3200/api/actions", {
          headers: { Origin: "http://127.0.0.1:3200" },
        }),
      ),
    );
    assert.throws(() =>
      sameOrigin(
        new NextRequest("http://localhost:3201/api/actions", {
          headers: { Origin: "http://127.0.0.1:3201" },
        }),
      ),
    );
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});

test("El limitador bloquea y permite volver a intentar al expirar la ventana", () => {
  limitAttempts("unit-window", 2, 1000, 1000);
  limitAttempts("unit-window", 2, 1000, 1500);
  assert.throws(
    () => limitAttempts("unit-window", 2, 1000, 1999),
    (e: unknown) => e instanceof AppError && e.status === 429,
  );
  assert.doesNotThrow(() => limitAttempts("unit-window", 2, 1000, 2000));
});

test("El proxy local usa la última IP y no la primera dirección falsificada", () => {
  const previous = process.env.TRUST_PROXY;
  process.env.TRUST_PROXY = "true";
  try {
    for (let i = 0; i < 60; i++)
      limitAuthentication(
        new NextRequest("http://localhost/api/actions", {
          headers: { "x-forwarded-for": `192.0.2.${i + 1}, 198.51.100.7` },
        }),
        `auth${i}@pucp.edu.pe`,
      );
    assert.throws(
      () =>
        limitAuthentication(
          new NextRequest("http://localhost/api/actions", {
            headers: { "x-forwarded-for": "203.0.113.5, 198.51.100.7" },
          }),
          "otra@pucp.edu.pe",
        ),
      (e: unknown) => e instanceof AppError && e.status === 429,
    );
  } finally {
    if (previous === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = previous;
  }
});

test("El número de claves del limitador está acotado", () => {
  let admitted = 0;
  for (let i = 0; i < 2050; i++) {
    try {
      limitAttempts(`capacity-${i}`, 1, 1000, 10000000000000);
      admitted++;
    } catch (error) {
      assert.ok(error instanceof AppError && error.status === 429);
    }
  }
  assert.ok(admitted > 2000 && admitted <= 2048);
});
