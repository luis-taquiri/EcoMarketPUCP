import { z } from "zod";
import { CATEGORIES, FACULTIES, CONDITIONS, LOCATIONS } from "./constants";
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Escribe un correo válido.")
  .regex(/^[^@\s]+@pucp\.edu\.pe$/, "Usa tu correo @pucp.edu.pe.");
export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "Máximo 72 caracteres.");
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(70),
  faculty: z.enum(FACULTIES),
  cycle: z.string().trim().max(20).default(""),
  bio: z.string().trim().max(500).default(""),
});
export const registerSchema = profileSchema.extend({
  email: emailSchema,
  password: passwordSchema,
});
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
  })
  .refine((d) => d.kind !== "TRADE" || d.wanted.length >= 3, {
    message: "Indica qué material buscas a cambio.",
    path: ["wanted"],
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
