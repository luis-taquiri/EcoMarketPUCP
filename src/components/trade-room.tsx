"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Check, MessageCircle, Send, Star, X, ArrowLeftRight } from "lucide-react";
import { LOCATIONS, photos, date } from "@/lib/constants";
import { Avatar, Badge } from "./ui";
import { api, ActionButton, ErrorText, Submit } from "./client-ui";
type TradeData = {
  id: string;
  status: string;
  requesterId: string;
  receiverId: string;
  requesterConfirmed: boolean;
  receiverConfirmed: boolean;
  meetingPlace: string;
  meetingAt: Date | null;
  requester: { name: string };
  receiver: { name: string };
  target: { id: string; title: string; images: unknown };
  offered: { id: string; title: string; images: unknown } | null;
  messages: { id: string; userId: string; body: string; createdAt: Date; user: { name: string } }[];
  reviews: { authorId: string; rating: number; comment: string }[];
};
export function TradeRoom({ trade, userId }: { trade: TradeData; userId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const receiver = userId === trade.receiverId;
  const partner = receiver ? trade.requester : trade.receiver;
  const closed = !["PENDING", "ACCEPTED"].includes(trade.status);
  const confirmed = receiver ? trade.receiverConfirmed : trade.requesterConfirmed;
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 10000);
    return () => clearInterval(timer);
  }, [router]);
  async function submit(e: React.FormEvent<HTMLFormElement>, action: string) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    const data: Record<string, unknown> = Object.fromEntries(new FormData(form));
    if (data.meetingAt) data.meetingAt = new Date(`${data.meetingAt}:00-05:00`).toISOString();
    if (data.rating) data.rating = Number(data.rating);
    try {
      await api(`trade.${action}`, { ...data, id: trade.id });
      if (action === "message") setMessage("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="trade-title">
        <div className="person-line">
          <Avatar name={partner.name} />
          <div>
            <h1>Intercambio con {partner.name}</h1>
            <p className="muted">Coordinen los detalles antes de encontrarse.</p>
          </div>
        </div>
        <Badge status={trade.status} />
      </div>
      <div className="trade-layout">
        <section className="trade-summary">
          <h2>Los materiales</h2>
          <Link href={`/materiales/${trade.target.id}`} className="trade-object">
            <img src={photos(trade.target.images)[0]} alt="" />
            <span>
              <small>MATERIAL SOLICITADO</small>
              <b>{trade.target.title}</b>
            </span>
          </Link>
          {trade.offered ? (
            <>
              <ArrowLeftRight className="trade-arrows" size={23} />
              <Link href={`/materiales/${trade.offered.id}`} className="trade-object">
                <img src={photos(trade.offered.images)[0]} alt="" />
                <span>
                  <small>A CAMBIO DE</small>
                  <b>{trade.offered.title}</b>
                </span>
              </Link>
            </>
          ) : (
            <p className="notice">Donación gratuita. No hay dinero ni materiales a cambio.</p>
          )}
          <ol className="trade-steps">
            <li className="done">
              <Check size={17} />
              Solicitud enviada
            </li>
            <li className={["ACCEPTED", "COMPLETED"].includes(trade.status) ? "done" : ""}>
              <Check size={17} />
              Propuesta aceptada
            </li>
            <li className={trade.status === "COMPLETED" ? "done" : ""}>
              <Check size={17} />
              Entrega confirmada por ambos
            </li>
          </ol>
          {receiver && trade.status === "PENDING" && (
            <div className="button-row">
              <ActionButton
                action="trade.accept"
                data={{ id: trade.id }}
                className="btn"
                confirm="¿Aceptar y reservar los materiales para este intercambio?"
              >
                <Check size={16} />
                Aceptar
              </ActionButton>
              <ActionButton action="trade.reject" data={{ id: trade.id }}>
                <X size={16} />
                Rechazar
              </ActionButton>
            </div>
          )}
          {trade.status === "ACCEPTED" && (
            <section className="meeting">
              <h3>
                <CalendarDays size={19} />
                Encuentro en el campus
              </h3>
              {trade.meetingAt && (
                <p className="notice">
                  <b>{trade.meetingPlace}</b>
                  <br />
                  {new Date(trade.meetingAt).toLocaleString("es-PE", {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: "America/Lima",
                  })}
                </p>
              )}
              {!trade.receiverConfirmed && !trade.requesterConfirmed && (
                <form className="form-stack" onSubmit={(e) => submit(e, "meeting")}>
                  <label>
                    Lugar
                    <select name="meetingPlace" defaultValue={trade.meetingPlace}>
                      {LOCATIONS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha y hora de Lima
                    <input name="meetingAt" type="datetime-local" required />
                  </label>
                  <Submit busy={busy}>Proponer encuentro</Submit>
                </form>
              )}
              <p className="small muted">Confirma únicamente cuando hayas realizado la entrega.</p>
              <p className="small">
                {trade.requesterConfirmed ? "✓" : "○"} {trade.requester.name} ·{" "}
                {trade.receiverConfirmed ? "✓" : "○"} {trade.receiver.name}
              </p>
              {confirmed ? (
                <p className="notice">
                  Tu entrega está confirmada. Falta la confirmación de la otra persona.
                </p>
              ) : (
                trade.meetingAt && (
                  <ActionButton
                    action="trade.confirm"
                    data={{ id: trade.id }}
                    className="btn"
                    confirm="¿Confirmas que ya realizaste la entrega? Este paso no se puede deshacer."
                  >
                    <Check size={18} />
                    Confirmar entrega realizada
                  </ActionButton>
                )
              )}
            </section>
          )}
          {!closed && !trade.receiverConfirmed && !trade.requesterConfirmed && (
            <ActionButton
              action="trade.cancel"
              data={{ id: trade.id }}
              className="text-link danger"
              confirm="¿Cancelar esta solicitud? Los materiales reservados volverán a estar disponibles."
            >
              Cancelar solicitud
            </ActionButton>
          )}
          {trade.status === "COMPLETED" && (
            <section className="meeting">
              <h3>
                <Star size={19} />
                Valora el intercambio
              </h3>
              {trade.reviews.some((r) => r.authorId === userId) ? (
                <p className="notice">Tu valoración ha sido registrada.</p>
              ) : (
                <form className="form-stack" onSubmit={(e) => submit(e, "review")}>
                  <label>
                    Puntuación
                    <select name="rating" defaultValue="5">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "estrella" : "estrellas"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Comentario
                    <textarea name="comment" required minLength={3} maxLength={500} rows={3} />
                  </label>
                  <Submit busy={busy}>Guardar valoración</Submit>
                </form>
              )}
            </section>
          )}
        </section>
        <section className="chat">
          <div className="chat-heading">
            <MessageCircle size={21} />
            <h2>Conversación</h2>
            <span className="muted small">Privada</span>
          </div>
          <div className="messages" aria-live="polite">
            {trade.messages.map((m) => (
              <div key={m.id} className={`message ${m.userId === userId ? "own" : ""}`}>
                <b>{m.user.name}</b>
                <p>{m.body}</p>
                <small>
                  {date(m.createdAt)} ·{" "}
                  {new Date(m.createdAt).toLocaleTimeString("es-PE", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Lima",
                  })}
                </small>
              </div>
            ))}
          </div>
          {closed ? (
            <p className="notice">Esta conversación está cerrada.</p>
          ) : (
            <form className="message-form" onSubmit={(e) => submit(e, "message")}>
              <textarea
                aria-label="Mensaje"
                name="body"
                placeholder="Escribe un mensaje…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={1500}
                rows={2}
              />
              <button
                className="btn"
                disabled={busy || !message.trim()}
                aria-label="Enviar mensaje"
                title="Enviar mensaje"
              >
                <Send size={20} />
              </button>
            </form>
          )}
          <ErrorText message={error} />
          <p className="small muted chat-note">
            Reúnanse en un lugar público del campus. No envíes dinero ni contraseñas.
          </p>
        </section>
      </div>
    </>
  );
}
