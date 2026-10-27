"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, HandHeart } from "lucide-react";
import { CATEGORIES, FACULTIES } from "@/lib/constants";
import { api, ErrorText, Modal, Submit } from "./client-ui";
export function NewWanted({ faculty }: { faculty: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>
        <Plus size={18} />
        Publicar lo que necesito
      </button>
      <Modal title="¿Qué material necesitas?" open={open} onClose={() => !busy && setOpen(false)}>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await api("wanted.create", Object.fromEntries(new FormData(e.currentTarget)));
              setOpen(false);
              router.refresh();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Título
            <input
              name="title"
              required
              minLength={5}
              maxLength={120}
              placeholder="Busco lecturas de…"
            />
          </label>
          <div className="form-grid">
            <label>
              Categoría
              <select name="category">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Facultad
              <select name="faculty" defaultValue={faculty}>
                {FACULTIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Curso (opcional)
            <input name="course" maxLength={100} />
          </label>
          <label>
            Cuéntanos qué necesitas
            <textarea
              name="description"
              required
              minLength={10}
              maxLength={1500}
              rows={4}
              placeholder="Incluye los detalles y qué podrías ofrecer a cambio."
            />
          </label>
          <ErrorText message={error} />
          <Submit busy={busy}>Publicar pedido</Submit>
        </form>
      </Modal>
    </>
  );
}
export function RespondWanted({
  id,
  options,
}: {
  id: string;
  options: { id: string; title: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();
  return (
    <>
      <button className="btn soft" onClick={() => setOpen(true)}>
        <HandHeart size={18} />
        Tengo este material
      </button>
      <Modal title="Responder al pedido" open={open} onClose={() => !busy && setOpen(false)}>
        {sent ? (
          <p className="notice" role="status">
            Respuesta enviada. El estudiante podrá ver tu material y enviarte una solicitud.
          </p>
        ) : !options.length ? (
          <div className="notice">
            Primero publica el material que quieres compartir.
            <Link href="/publicar" className="btn">
              Publicar material
            </Link>
          </div>
        ) : (
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("wanted.respond", {
                  ...Object.fromEntries(new FormData(e.currentTarget)),
                  id,
                });
                setSent(true);
                router.refresh();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Material disponible
              <select name="listingId" required>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mensaje
              <textarea
                name="message"
                rows={3}
                required
                minLength={5}
                maxLength={1000}
                placeholder="¡Hola! Tengo este material disponible."
              />
            </label>
            <ErrorText message={error} />
            <Submit busy={busy}>Enviar respuesta</Submit>
          </form>
        )}
      </Modal>
    </>
  );
}
