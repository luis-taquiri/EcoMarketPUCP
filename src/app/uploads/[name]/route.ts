import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  const user = await currentUser();
  if (!user) return new Response(null, { status: 401 });
  const { name } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) return new Response(null, { status: 404 });
  const upload = await db.upload.findUnique({ where: { name }, select: { userId: true } });
  if (!upload) return new Response(null, { status: 404 });
  if (upload.userId !== user.id) {
    const visible = await db.$queryRaw<{ id: string }[]>`
      SELECT l.id FROM "Listing" l, json_each(l.images) photo
      WHERE l.userId = ${upload.userId} AND photo.value = ${`/uploads/${name}`}
      AND ((l.status IN ('AVAILABLE', 'RESERVED', 'EXCHANGED')
        AND EXISTS (SELECT 1 FROM "User" owner WHERE owner.id = l.userId AND owner.disabled = 0)) OR EXISTS (
        SELECT 1 FROM "Trade" t
        WHERE (t.targetId = l.id OR t.offeredId = l.id)
        AND (t.requesterId = ${user.id} OR t.receiverId = ${user.id})
      )) LIMIT 1
    `;
    if (!visible.length) return new Response(null, { status: 404 });
  }
  try {
    const bytes = await readFile(
      path.join(path.resolve(process.env.UPLOAD_DIR || "./uploads"), name),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
