import { AppError } from "./validation";

const attempts = new Map<string, { count: number; until: number }>();
const MAX_KEYS = 2048;

export function limitAttempts(key: string, limit: number, windowMs: number, now = Date.now()) {
  let entry = attempts.get(key);
  if (entry && entry.until <= now) {
    attempts.delete(key);
    entry = undefined;
  }
  if (!entry) {
    if (attempts.size >= MAX_KEYS) {
      for (const [stored, value] of attempts) if (value.until <= now) attempts.delete(stored);
      if (attempts.size >= MAX_KEYS)
        throw new AppError("Demasiadas solicitudes. Inténtalo más tarde.", 429);
    }
    entry = { count: 0, until: now + windowMs };
    attempts.set(key, entry);
  }
  if (entry.count >= limit)
    throw new AppError("Demasiados intentos. Espera antes de volver a intentarlo.", 429);
  entry.count++;
}
