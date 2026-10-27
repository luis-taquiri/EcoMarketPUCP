import Link from "next/link";
import { ArrowRight, Check, X, Gift, ArrowLeftRight } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, Badge, Empty, PageTitle } from "@/components/ui";
import { ActionButton } from "@/components/client-ui";
import { photos, date } from "@/lib/constants";
export default async function Requests({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await requirePageUser();
  const s = await searchParams;
  const sent = s.tab === "sent";
  const where = sent ? { requesterId: user.id } : { receiverId: user.id };
  const total = await db.trade.count({ where });
  const pages = Math.max(1, Math.ceil(total / 15));
  const page = Math.min(pages, Math.max(1, parseInt(s.page || "1") || 1));
  const trades = await db.trade.findMany({
    where,
    include: {
      requester: { select: { name: true } },
      receiver: { select: { name: true } },
      target: true,
      offered: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
    skip: (page - 1) * 15,
  });
  const pending = await db.trade.count({ where: { receiverId: user.id, status: "PENDING" } });
  return (
    <div className="container page">
      <PageTitle
        eyebrow="INTERCAMBIOS"
        title="Mis Solicitudes"
        description="Revisa y gestiona tus propuestas de trueque y donación."
      />
      <div className="tabs">
        <Link href="/solicitudes" className={!sent ? "active" : ""}>
          Solicitudes recibidas {pending > 0 && <span className="count">{pending}</span>}
        </Link>
        <Link href="/solicitudes?tab=sent" className={sent ? "active" : ""}>
          Solicitudes enviadas
        </Link>
      </div>
      <div className="request-list">
        {trades.map((t) => (
          <article className="request-item" key={t.id}>
            <div className="person-line">
              <Avatar name={sent ? t.receiver.name : t.requester.name} />
              <div>
                <b>{sent ? t.receiver.name : t.requester.name}</b>
                <small>{date(t.createdAt)}</small>
              </div>
            </div>
            <div className="request-material">
              <img src={photos(t.target.images)[0]} alt="" />
              <div>
                <p className="eyebrow">
                  {t.offeredId ? (
                    <>
                      <ArrowLeftRight size={13} /> {sent ? "OFRECES" : "TE OFRECE"}
                    </>
                  ) : (
                    <>
                      <Gift size={13} /> DONACIÓN
                    </>
                  )}
                </p>
                <h3>{t.offered?.title || "Solicitud sin nada a cambio"}</h3>
                <p className="small muted">por {t.target.title}</p>
              </div>
            </div>
            <div className="request-controls">
              <Badge status={t.status} />
              <div className="button-row">
                {!sent && t.status === "PENDING" && (
                  <>
                    <ActionButton
                      action="trade.accept"
                      data={{ id: t.id }}
                      className="btn"
                      confirm="¿Aceptar la propuesta? Ambos materiales quedarán reservados y se cerrarán las propuestas incompatibles."
                    >
                      <Check size={16} />
                      Aceptar
                    </ActionButton>
                    <ActionButton action="trade.reject" data={{ id: t.id }}>
                      <X size={16} />
                      Rechazar
                    </ActionButton>
                  </>
                )}
                <Link className="btn soft" href={`/solicitudes/${t.id}`}>
                  {t.status === "ACCEPTED" ? "Coordinar entrega" : "Ver solicitud"}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </article>
        ))}
        {!trades.length && (
          <Empty
            title={sent ? "No has enviado solicitudes" : "Aún no tienes solicitudes"}
            description={
              sent
                ? "Explora los materiales y propón tu primer intercambio."
                : "Publica un material para empezar a recibir propuestas."
            }
            href={sent ? "/explorar" : "/publicar"}
            label={sent ? "Explorar materiales" : "Publicar material"}
          />
        )}
      </div>
      {pages > 1 && (
        <nav className="pagination">
          {page > 1 && (
            <Link href={`?tab=${sent ? "sent" : "received"}&page=${page - 1}`}>Anterior</Link>
          )}
          <span>
            Página {page} de {pages}
          </span>
          {page < pages && (
            <Link href={`?tab=${sent ? "sent" : "received"}&page=${page + 1}`}>Siguiente</Link>
          )}
        </nav>
      )}
    </div>
  );
}
