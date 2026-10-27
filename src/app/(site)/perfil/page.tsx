import Link from "next/link";
import { ArrowRight, Plus, Star, Sprout, Gift, ArrowLeftRight } from "lucide-react";
import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Avatar, Empty, Badge } from "@/components/ui";
import { ListingCard } from "@/components/listing-card";
import { ProfileForm } from "@/components/profile-form";
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await requirePageUser();
  const s = await searchParams;
  const favorite = s.tab === "favorites";
  const archived = s.tab === "archived";
  const where = favorite
    ? { favorites: { some: { userId: user.id } }, status: { not: "ARCHIVED" } }
    : { userId: user.id, ...(archived ? { status: "ARCHIVED" } : { status: { not: "ARCHIVED" } }) };
  const total = await db.listing.count({ where });
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(pages, Math.max(1, parseInt(s.page || "1") || 1));
  const listings = await db.listing.findMany({
    where,
    include: {
      user: { select: { name: true } },
      favorites: { where: { userId: user.id }, select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    skip: (page - 1) * 12,
  });
  const completed = await db.trade.count({
    where: { status: "COMPLETED", OR: [{ requesterId: user.id }, { receiverId: user.id }] },
  });
  const donated = await db.trade.count({
    where: { status: "COMPLETED", receiverId: user.id, offeredId: null },
  });
  const active = await db.trade.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: user.id }, { receiverId: user.id }] },
    include: {
      target: { select: { title: true } },
      requester: { select: { name: true } },
      receiver: { select: { name: true } },
    },
  });
  const ratings = await db.review.aggregate({
    where: { reviewedId: user.id },
    _avg: { rating: true },
    _count: true,
  });
  return (
    <div className="container page">
      <div className="profile-heading">
        <Avatar name={user.name} large />
        <div>
          <h1>{user.name}</h1>
          <p className="muted">
            {user.faculty}
            {user.cycle && ` · ${user.cycle}`}
          </p>
          <p className="small muted">{user.email}</p>
          {user.bio && <p>{user.bio}</p>}
          {ratings._count > 0 && (
            <p className="rating">
              <Star size={17} /> {ratings._avg.rating?.toFixed(1)} · {ratings._count} valoraciones
            </p>
          )}
        </div>
        <ProfileForm
          profile={{ name: user.name, faculty: user.faculty, cycle: user.cycle, bio: user.bio }}
        />
      </div>
      <div className="profile-layout">
        <section>
          <div className="in-progress">
            {active.map((t) => (
              <article key={t.id}>
                <div>
                  <p className="eyebrow">INTERCAMBIO EN CURSO</p>
                  <h2>{t.target.title}</h2>
                  <p className="muted">
                    Con {user.id === t.receiverId ? t.requester.name : t.receiver.name} ·{" "}
                    {t.meetingPlace}
                  </p>
                  <Badge status={t.status} />
                </div>
                <Link className="btn" href={`/solicitudes/${t.id}`}>
                  Coordinar entrega
                  <ArrowRight size={17} />
                </Link>
              </article>
            ))}
          </div>
          <div className="section-heading">
            <div>
              <p className="eyebrow">MIS MATERIALES</p>
              <h2>
                {favorite
                  ? "Favoritos"
                  : archived
                    ? "Publicaciones archivadas"
                    : "Mis publicaciones"}
              </h2>
            </div>
            <Link className="btn secondary" href="/publicar">
              <Plus size={17} />
              Nueva publicación
            </Link>
          </div>
          <div className="tabs">
            <Link href="/perfil" className={!favorite && !archived ? "active" : ""}>
              Publicaciones
            </Link>
            <Link href="/perfil?tab=favorites" className={favorite ? "active" : ""}>
              Favoritos
            </Link>
            <Link href="/perfil?tab=archived" className={archived ? "active" : ""}>
              Archivadas
            </Link>
          </div>
          {listings.length ? (
            <div className="listing-grid profile-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} editable={!favorite} />
              ))}
            </div>
          ) : (
            <Empty
              title={favorite ? "Todavía no tienes favoritos" : "No hay publicaciones aquí"}
              description={
                favorite
                  ? "Guarda materiales que te interesan desde el catálogo."
                  : "Comparte un material que ya no utilices."
              }
              href={favorite ? "/explorar" : "/publicar"}
              label={favorite ? "Explorar" : "Publicar material"}
            />
          )}{" "}
          {pages > 1 && (
            <nav className="pagination">
              {page > 1 && <Link href={`?tab=${s.tab || ""}&page=${page - 1}`}>Anterior</Link>}
              <span>
                {page} / {pages}
              </span>
              {page < pages && <Link href={`?tab=${s.tab || ""}&page=${page + 1}`}>Siguiente</Link>}
            </nav>
          )}
        </section>
        <aside className="impact-panel">
          <p className="eyebrow">TU ACTIVIDAD</p>
          <h2>Tu aporte a la comunidad</h2>
          <Sprout size={45} />
          <div>
            <b>{completed}</b>
            <span>
              <ArrowLeftRight size={17} />
              intercambios completados
            </span>
          </div>
          <div>
            <b>{donated}</b>
            <span>
              <Gift size={17} />
              donaciones entregadas
            </span>
          </div>
          <p className="small muted">Cifras de entregas confirmadas por ambas personas.</p>
        </aside>
      </div>
    </div>
  );
}
