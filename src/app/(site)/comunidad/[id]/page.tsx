import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { Avatar, Empty } from "@/components/ui";
import { ListingCard } from "@/components/listing-card";
import { date } from "@/lib/constants";
export default async function Member({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePageUser();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      faculty: true,
      cycle: true,
      bio: true,
      disabled: true,
      createdAt: true,
      ratings: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!user || user.disabled) notFound();
  const listings = await db.listing.findMany({
    where: { userId: id, status: "AVAILABLE" },
    include: {
      user: { select: { name: true } },
      favorites: { where: { userId: me.id }, select: { userId: true } },
    },
    take: 24,
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="container page">
      <Link href="/explorar" className="back-link">
        <ArrowLeft size={16} />
        Explorar
      </Link>
      <div className="profile-heading">
        <Avatar name={user.name} large />
        <div>
          <h1>{user.name}</h1>
          <p className="muted">
            {user.faculty} · {user.cycle || "Comunidad EcoMarket"}
          </p>
          <p>{user.bio}</p>
          <small className="muted">En EcoMarket desde {date(user.createdAt)}</small>
        </div>
      </div>
      <h2>Materiales disponibles</h2>
      <div className="listing-grid member-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      {!listings.length && (
        <Empty
          title="Sin materiales disponibles"
          description="Este estudiante no tiene publicaciones disponibles en este momento."
        />
      )}
      <section className="reviews">
        <h2>Valoraciones de intercambios</h2>
        {user.ratings.map((r) => (
          <article key={r.id}>
            <b>{r.author.name}</b>
            <span>
              <Star size={15} /> {r.rating}/5
            </span>
            <p>{r.comment}</p>
            <small>{date(r.createdAt)}</small>
          </article>
        ))}
        {!user.ratings.length && <p className="muted">Todavía no hay valoraciones.</p>}
      </section>
    </div>
  );
}
