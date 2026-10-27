"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X, ArrowLeftRight, Gift, Upload } from "lucide-react";
import Link from "next/link";
import { CATEGORIES, FACULTIES, CONDITIONS, LOCATIONS } from "@/lib/constants";
import { api, ErrorText, Submit } from "./client-ui";
export type ListingInput = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  faculty?: string;
  course?: string;
  condition?: string;
  kind?: string;
  wanted?: string;
  location?: string;
  images?: string[];
};
export function ListingForm({ initial = {} }: { initial?: ListingInput }) {
  const router = useRouter();
  const [images, setImages] = useState(initial.images || []);
  const [kind, setKind] = useState(initial.kind || "TRADE");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: FileList | File[]) {
    if (uploading) return;
    setError("");
    if (files.length + images.length > 5) {
      setError("Puedes subir hasta 5 imágenes.");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5 MB por imagen.");
        const form = new FormData();
        form.set("file", file);
        const res = await fetch("/api/uploads", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setImages((prev) => [...prev, data.url]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <form
      className="editor form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          const fields = Object.fromEntries(new FormData(e.currentTarget));
          const result = await api("listing.save", {
            ...fields,
            kind,
            images,
            ...(initial.id ? { id: initial.id } : {}),
          });
          router.push(`/materiales/${result.id}`);
          router.refresh();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div
        className="upload-area"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void upload(e.dataTransfer.files);
        }}
      >
        <ImagePlus size={30} />
        <strong>{uploading ? "Preparando imágenes…" : "Agrega fotos de tu material"}</strong>
        <span>JPG, PNG o WebP · Hasta 5 imágenes · 5 MB cada una</span>
        <label className="btn secondary file-label">
          <Upload size={16} />
          Seleccionar archivos
          <input
            aria-label="Fotos del material"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading || images.length >= 5}
            onChange={(e) => {
              if (e.target.files) void upload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {images.length > 0 && (
        <div className="upload-previews">
          {images.map((src, i) => (
            <div key={src}>
              <img src={src} alt={`Foto ${i + 1}`} />
              <button
                type="button"
                disabled={uploading}
                onClick={() => setImages((prev) => prev.filter((x) => x !== src))}
                aria-label={`Quitar foto ${i + 1}`}
                title="Quitar foto"
              >
                <X size={16} />
              </button>
              {i === 0 && <small>Portada</small>}
            </div>
          ))}
        </div>
      )}
      <label>
        Título del material
        <input
          name="title"
          defaultValue={initial.title}
          required
          minLength={5}
          maxLength={100}
          placeholder="Ej. Lecturas de Realidad Peruana"
        />
      </label>
      <div className="form-grid">
        <label>
          Facultad
          <select name="faculty" defaultValue={initial.faculty || ""} required>
            <option value="">Seleccionar facultad</option>
            {FACULTIES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label>
          Categoría
          <select name="category" defaultValue={initial.category || CATEGORIES[0]}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Curso (opcional)
          <input
            name="course"
            defaultValue={initial.course}
            maxLength={100}
            placeholder="Ej. Cálculo 1"
          />
        </label>
        <label>
          Estado del material
          <select name="condition" defaultValue={initial.condition || "Buen estado"}>
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Descripción
        <textarea
          name="description"
          defaultValue={initial.description}
          required
          minLength={15}
          maxLength={3000}
          rows={5}
          placeholder="Describe el contenido, su estado y cualquier detalle importante…"
        />
      </label>
      <fieldset>
        <legend>Tipo de intercambio</legend>
        <div className="type-options">
          <label className={kind === "TRADE" ? "selected" : ""}>
            <input
              type="radio"
              name="kind"
              value="TRADE"
              checked={kind === "TRADE"}
              onChange={() => setKind("TRADE")}
            />
            <ArrowLeftRight size={23} />
            <span>
              <b>Trueque</b>
              <small>Recibe otro material a cambio</small>
            </span>
          </label>
          <label className={kind === "DONATION" ? "selected" : ""}>
            <input
              type="radio"
              name="kind"
              value="DONATION"
              checked={kind === "DONATION"}
              onChange={() => setKind("DONATION")}
            />
            <Gift size={23} />
            <span>
              <b>Donación</b>
              <small>Compártelo sin recibir algo</small>
            </span>
          </label>
        </div>
      </fieldset>
      {kind === "TRADE" && (
        <label>
          ¿Qué buscas a cambio?
          <input
            name="wanted"
            defaultValue={initial.wanted}
            required
            minLength={3}
            maxLength={500}
            placeholder="Ej. Apuntes de Estadística o útiles de dibujo"
          />
        </label>
      )}
      <label>
        Entrega sugerida
        <select name="location" defaultValue={initial.location || LOCATIONS[0]}>
          {LOCATIONS.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
      <p className="notice">
        Solo materiales propios o que tienes permiso de compartir. No se admiten ventas, cobros ni
        copias no autorizadas.
      </p>
      {initial.id && (
        <p className="muted small">
          Al editar se cierran las propuestas pendientes sobre este material para que puedan volver
          a enviarse con los datos actualizados.
        </p>
      )}
      <ErrorText message={error} />
      <div className="form-footer">
        <Link className="btn secondary" href="/perfil">
          Cancelar
        </Link>
        <Submit busy={busy || uploading}>
          {initial.id ? "Guardar cambios" : "Publicar en el campus"}
        </Submit>
      </div>
    </form>
  );
}
