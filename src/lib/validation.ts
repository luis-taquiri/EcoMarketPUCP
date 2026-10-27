import { z } from "zod";
import { CATEGORIES, FACULTIES, CONDITIONS, LOCATIONS } from "./constants";
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo.")
  .email("Escribe un correo válido.")
  .regex(/^[^@\s]+@pucp\.edu\.pe$/, "Usa tu correo @pucp.edu.pe.");
export const passwordSchema = z
  .string()
  .min(15, "La contraseña debe tener al menos 15 caracteres.")
  .max(72, "Máximo 72 caracteres.")
  .refine((password) => new TextEncoder().encode(password).length <= 72, {
    message: "La contraseña supera 72 bytes. Las tildes y los emojis pueden ocupar más de un byte.",
  });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(70),
  faculty: z.enum(FACULTIES),
  cycle: z.string().trim().max(20).default(""),
  bio: z.string().trim().max(500).default(""),
});
export const registerSchema = profileSchema.extend({
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos de uso." }),
  consentData: z.literal(true, {
    error: "Debes autorizar el tratamiento de datos descrito en el aviso de privacidad.",
  }),
});
const optionalAmount = (max: number) =>
  z.preprocess(
    (value) =>
      value === "" || value === null || value === undefined
        ? null
        : typeof value === "string"
          ? Number(value)
          : value,
    z.number().int().min(1).max(max).nullable(),
  );
export const listingSchema = z
  .object({
    title: z.string().trim().min(5, "El título debe tener al menos 5 caracteres.").max(100),
    description: z
      .string()
      .trim()
      .min(15, "Describe el material en al menos 15 caracteres.")
      .max(3000),
    category: z.enum(CATEGORIES),
    faculty: z.enum(FACULTIES),
    course: z.string().trim().max(100).default(""),
    condition: z.enum(CONDITIONS),
    kind: z.enum(["TRADE", "DONATION"]),
    wanted: z.string().trim().max(500).default(""),
    location: z.enum(LOCATIONS),
    images: z.array(z.string().max(200)).min(1, "Agrega al menos una foto.").max(5),
    impactMaterial: z.enum(["NONE", "OFFICE_PAPER", "TEXTBOOK"]).default("NONE"),
    paperSheets: optionalAmount(20000),
    weightGrams: optionalAmount(100000),
  })
  .refine((d) => d.kind !== "TRADE" || d.wanted.length >= 3, {
    message: "Indica qué material buscas a cambio.",
    path: ["wanted"],
  })
  .superRefine((data, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message, path: ["impactMaterial"] });
    if (data.impactMaterial === "NONE") {
      if (data.paperSheets !== null || data.weightGrams !== null)
        issue("Elige el tipo de material para registrar hojas o peso.");
    } else if (data.impactMaterial === "OFFICE_PAPER") {
      if (data.category !== "Impresos y apuntes")
        issue("La estimación de papel corresponde a impresos y apuntes.");
      if ((data.paperSheets === null) === (data.weightGrams === null))
        issue("Indica las hojas A4 o el peso del papel, no ambos.");
    } else {
      if (data.category !== "Libros")
        issue("La estimación de libros de texto corresponde a la categoría Libros.");
      if (data.weightGrams === null || data.paperSheets !== null)
        issue("Para libros de texto indica su peso en gramos, no páginas ni hojas.");
    }
  });
export const wantedSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(10).max(1500),
  category: z.enum(CATEGORIES),
  faculty: z.enum(FACULTIES),
  course: z.string().trim().max(100).default(""),
});
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function ensure(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new AppError(message, status);
}
