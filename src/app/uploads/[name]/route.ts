import { readFile } from "node:fs/promises";
import path from "node:path";
import { currentUser } from "@/lib/auth";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await currentUser())) return new Response(null, { status: 401 });
  const { name } = await params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(name)) return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(
      path.join(path.resolve(process.env.UPLOAD_DIR || "./uploads"), name),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
