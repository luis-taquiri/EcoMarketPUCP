import test from "node:test";
import assert from "node:assert/strict";
import { emailSchema, passwordSchema, listingSchema } from "../src/lib/validation";
test("Solo se aceptan correos PUCP y se normalizan", () => {
  assert.equal(emailSchema.parse(" Alumno@PUCP.EDU.PE "), "alumno@pucp.edu.pe");
  for (const email of ["usuario@gmail.com", "hola@pucp.edu.pe.evil.com", "@pucp.edu.pe"])
    assert.equal(emailSchema.safeParse(email).success, false);
});
test("Las contraseñas tienen límites definidos", () => {
  assert.equal(passwordSchema.safeParse("1234567").success, false);
  assert.equal(passwordSchema.safeParse("x".repeat(73)).success, false);
  assert.equal(passwordSchema.safeParse("UnaClaveLarga!2026").success, true);
});
test("Un trueque requiere fotos y preferencias; una donación no requiere preferencias", () => {
  const item = {
    title: "Material de estudio",
    description: "Descripción completa del material de estudio.",
    category: "Libros",
    faculty: "EE.GG. Letras",
    condition: "Buen estado",
    kind: "TRADE",
    location: "Biblioteca Central",
    images: ["/uploads/test.webp"],
  };
  assert.equal(listingSchema.safeParse(item).success, false);
  assert.equal(listingSchema.safeParse({ ...item, wanted: "Otros libros" }).success, true);
  assert.equal(listingSchema.safeParse({ ...item, kind: "DONATION" }).success, true);
  assert.equal(listingSchema.safeParse({ ...item, kind: "DONATION", images: [] }).success, false);
});
