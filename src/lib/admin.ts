import { db } from "./db";
import { ensure } from "./validation";

export async function setUserDisabled(actorId: string, targetId: string, disabled: boolean) {
  return db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({
      where: { id: actorId },
      select: { role: true, disabled: true },
    });
    ensure(actor && actor.role === "ADMIN" && !actor.disabled, "No tienes permiso.", 403);
    ensure(actorId !== targetId, "No puedes deshabilitar tu propia cuenta.", 409);
    const target = await tx.user.findUnique({
      where: { id: targetId },
      select: { id: true, role: true },
    });
    ensure(target, "Usuario no encontrado.", 404);
    ensure(target.role === "STUDENT", "Las cuentas administradoras están protegidas.", 409);
    await tx.user.update({ where: { id: target.id }, data: { disabled } });
    await tx.session.deleteMany({ where: { userId: target.id } });
  });
}
