import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, MapPin, Star, Pencil, Archive, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { photos, date } from "@/lib/constants";
import { Avatar, Badge } from "@/components/ui";
import { ActionButton } from "@/components/client-ui";
import { Gallery, MaterialActions } from "@/components/material-actions";
export default async function Material({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePageUser();
  const { id } = await params;
  const item = await db.listing.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          faculty: true,
          disabled: true,
          ratings: { select: { rating: true } },
        },
      },
    },
  });
  if (
    !item ||
    item.user.disabled ||
    (item.status === "ARCHIVED" && item.userId !== user.id && user.role !== "ADMIN")
  )
    notFound();
  const owned = item.userId === user.id;
  const options = await db.listing.findMany({
    where: { userId: user.id, status: "AVAILABLE", kind: "TRADE" },
    select: { id: true, title: true },
  });
  const ratings = item.user.ratings;
  const average = ratings.length
    ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)
    : null;
  return (
    <div className="container page">
      <Link href="/explorar" className="back-link">
        <ArrowLeft size={17} />
        Volver a explorar
      </Link>
      <article className="material-detail">
        <Gallery images={photos(item.images)} title={item.title} />
        <div className="detail-content">
          <div className="detail-tags">
            <span className={`kind-tag static ${item.kind === "DONATION" ? "gift" : ""}`}>
              {item.kind === "DONATION" ? "REGALO" : "TRUEQUE"}
            </span>
            <Badge status={item.status} />
          </div>
          <p className="eyebrow">{item.faculty}</p>
          <h1>{item.title}</h1>
          {item.course && (
            <p className="course">
              <BookOpen size={17} />
              {item.course}
            </p>
          )}
          <Link href={`/comunidad/${item.userId}`} className="detail-owner">
            <Avatar name={item.user.name} />
            <span>
              <b>{item.user.name}</b>
              <small>
                {item.user.faculty}
                {average && (
                  <>
                    {" "}
                    · <Star size={12} /> {average} ({ratings.length})
                  </>
                )}
              </small>
            </span>
          </Link>
          <div className="detail-facts">
            <div>
              <small>CONDICIÓN</small>
              <b>{item.condition}</b>
            </div>
            <div>
              <small>ENTREGA SUGERIDA</small>
              <b>
                <MapPin size={15} />
                {item.location}
              </b>
            </div>
          </div>
          <h3>Descripción</h3>
          <p className="pre-wrap">{item.description}</p>
          {item.kind === "TRADE" && (
            <>
              <h3>¿Qué busca a cambio?</h3>
              <p className="pre-wrap">{item.wanted}</p>
            </>
          )}
          <p className="muted small">Publicado el {date(item.createdAt)}</p>
          <MaterialActions
            id={item.id}
            title={item.title}
            kind={item.kind}
            available={item.status === "AVAILABLE"}
            owned={owned}
            options={options}
          />
          {owned && ["AVAILABLE", "ARCHIVED"].includes(item.status) && (
            <div className="button-row">
              <Link className="btn" href={`/publicar?id=${id}`}>
                <Pencil size={17} />
                Editar material
              </Link>
              <ActionButton
                action="listing.status"
                data={{ id, status: item.status === "ARCHIVED" ? "AVAILABLE" : "ARCHIVED" }}
                confirm={
                  item.status === "AVAILABLE"
                    ? "¿Archivar esta publicación? Se cerrarán sus propuestas pendientes."
                    : undefined
                }
              >
                {item.status === "ARCHIVED" ? (
                  <>
                    <RotateCcw size={16} />
                    Republicar
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    Archivar
                  </>
                )}
              </ActionButton>
            </div>
          )}
          {owned && item.status === "RESERVED" && (
            <Link className="btn soft" href="/solicitudes">
              Ver intercambio en curso
            </Link>
          )}
        </div>
      </article>
    </div>
  );
}
