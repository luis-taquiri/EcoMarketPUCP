import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, sameOrigin, readLimited } from "@/lib/http";
import { ensure, AppError } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const user = await requireUser();
    ensure(
      Number(request.headers.get("content-length") || 0) < 6 * 1024 * 1024,
      "La imagen supera 5 MB.",
      413,
    );
    const bytesIn = await readLimited(request, 6 * 1024 * 1024);
    const form = await new Response(new Uint8Array(bytesIn), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    ensure(file instanceof File && file.size > 0, "Selecciona una imagen.");
    ensure(file.size <= 5 * 1024 * 1024, "Máximo 5 MB por imagen.", 413);
    ensure(
      ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Usa JPG, PNG o WebP. Convierte las fotos HEIC antes de subirlas.",
    );
    const count = await db.upload.count({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 3600000) } },
    });
    ensure(count < 60, "Límite de imágenes por hora alcanzado.", 429);
    let bytes: Buffer;
    try {
      const source = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 40000000 });
      const metadata = await source.metadata();
      ensure(
        metadata.format && ["jpeg", "png", "webp"].includes(metadata.format),
        "El contenido debe ser una imagen JPG, PNG o WebP real.",
      );
      bytes = await source
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new AppError("No se pudo leer la imagen. Prueba guardándola como JPG.");
    }
    const dir = path.resolve(process.env.UPLOAD_DIR || "./uploads");
    const name = `${randomUUID()}.webp`;
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);
    await db.upload.create({ data: { name, userId: user.id } });
    return NextResponse.json({ url: `/uploads/${name}` });
  } catch (error) {
    return apiError(error);
  }
}
