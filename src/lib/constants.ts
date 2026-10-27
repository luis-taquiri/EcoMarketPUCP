export const CATEGORIES = [
  "Impresos y apuntes",
  "Libros",
  "Útiles de taller",
  "Tecnología",
  "Otros",
] as const;
export const FACULTIES = [
  "EE.GG. Letras",
  "EE.GG. Ciencias",
  "Ciencias e Ingeniería",
  "Arquitectura",
  "Gestión",
  "Derecho",
  "Arte y Diseño",
  "Educación",
  "Ciencias Sociales",
  "Comunicaciones",
  "Otras facultades",
] as const;
export const CONDITIONS = ["Nuevo", "Como nuevo", "Buen estado", "Con señales de uso"] as const;
export const LOCATIONS = [
  "Biblioteca Central",
  "Tinkuy",
  "Complejo de Innovación Académica",
  "Pabellón de Letras",
  "Pabellón de Ciencias",
  "Cafetería de Arte",
] as const;
export const STATUS: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservado",
  EXCHANGED: "Entregado",
  ARCHIVED: "Archivado",
  PENDING: "Pendiente",
  ACCEPTED: "Aceptado",
  COMPLETED: "Completado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  OPEN: "Abierto",
  CLOSED: "Cerrado",
  RESOLVED: "Revisado",
};
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();
}
export function photos(images: unknown): string[] {
  return Array.isArray(images) ? images.filter((s): s is string => typeof s === "string") : [];
}
export function date(value: Date | string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Lima",
  }).format(new Date(value));
}
