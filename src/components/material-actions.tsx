"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, Gift, Flag } from "lucide-react";
import { api, ErrorText, Modal, Submit } from "./client-ui";
export function MaterialActions({
  id,
  title,
  kind,
  available,
  owned,
  options,
}: {
  id: string;
  title: string;
  kind: string;
  available: boolean;
  owned: boolean;
  options: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"proposal" | "report" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  function open(value: "proposal" | "report") {
    setError("");
    setSent(false);
    setModal(value);
  }
  return (
    <div className="material-actions">
      {!owned && available && (
        <button className="btn" onClick={() => open("proposal")}>
          {kind === "DONATION" ? <Gift size={19} /> : <ArrowLeftRight size={19} />}Solicitar{" "}
          {kind === "DONATION" ? "donación" : "trueque"}
        </button>
      )}
      {!owned && (
        <button className="text-link muted report-link" onClick={() => open("report")}>
          <Flag size={14} />
          Reportar publicación o conducta
        </button>
      )}
      <Modal
        open={modal === "proposal"}
        onClose={() => !busy && setModal(null)}
        title={`Solicitar “${title}”`}
      >
        <p className="muted">
          {kind === "TRADE"
            ? "Elige qué ofrecerás y escribe un mensaje para coordinar."
            : "Escribe al estudiante que comparte este material."}
        </p>
        {kind === "TRADE" && !options.length ? (
          <div className="notice">
            Necesitas un material disponible para ofrecer a cambio.
            <Link className="btn" href="/publicar">
              Publicar un material
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
                const fields = Object.fromEntries(new FormData(e.currentTarget));
                const result = await api("trade.propose", { ...fields, targetId: id });
                router.push(`/solicitudes/${result.id}`);
                router.refresh();
                setModal(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {kind === "TRADE" && (
              <label>
                Ofrezco a cambio
                <select name="offeredId" required>
                  <option value="">Selecciona uno de tus materiales</option>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Mensaje
              <textarea
                name="message"
                rows={4}
                minLength={10}
                maxLength={1500}
                required
                defaultValue="¡Hola! Me interesa este material. Puedo encontrarme en el campus esta semana."
              />
            </label>
            <ErrorText message={error} />
            <Submit busy={busy}>
              Enviar {kind === "TRADE" ? "propuesta de trueque" : "solicitud de donación"}
            </Submit>
          </form>
        )}
      </Modal>
      <Modal
        open={modal === "report"}
        onClose={() => !busy && setModal(null)}
        title="Reportar publicación"
      >
        {sent ? (
          <p role="status" className="notice">
            El reporte fue enviado para revisión.
          </p>
        ) : (
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                await api("report", { ...Object.fromEntries(new FormData(e.currentTarget)), id });
                setSent(true);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Motivo
              <select name="reason">
                {[
                  "Solicita dinero",
                  "Contenido inapropiado",
                  "Información engañosa",
                  "Conducta inadecuada",
                  "Otro motivo",
                ].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              ¿Qué sucedió?
              <textarea name="details" required minLength={10} maxLength={1500} rows={4} />
            </label>
            <ErrorText message={error} />
            <Submit busy={busy}>Enviar reporte</Submit>
          </form>
        )}
      </Modal>
    </div>
  );
}
export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="gallery">
      <div className="gallery-main">{images[index] && <img src={images[index]} alt={title} />}</div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              className={i === index ? "active" : ""}
              aria-label={`Ver foto ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
