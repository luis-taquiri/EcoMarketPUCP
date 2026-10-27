import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { date, CATEGORIES } from "@/lib/constants";
import { Avatar, PageTitle, Empty, Badge } from "@/components/ui";
import { NewWanted, RespondWanted } from "@/components/wanted-actions";
import { ActionButton } from "@/components/client-ui";
export default async function WantedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; mine?: string; page?: string }>;
}) {
  const user = await requirePageUser();
  const s = await searchParams;
  const q = typeof s.q === "string" ? s.q.slice(0, 100) : "";
  const category = typeof s.category === "string" ? s.category : "";
  const mine = s.mine === "1";
  const where = {
    ...(mine ? { userId: user.id } : { status: "OPEN" }),
    user: { disabled: false },
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
  };
  const total = await db.wanted.count({ where });
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(pages, Math.max(1, parseInt(s.page || "1") || 1));
  const items = await db.wanted.findMany({
    where,
    include: {
      user: { select: { name: true } },
      responses: {
        where: { OR: [{ userId: user.id }, { wanted: { userId: user.id } }] },
        include: {
          user: { select: { name: true } },
          listing: { select: { title: true, status: true } },
        },
      },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    skip: (page - 1) * 12,
  });
  const options = await db.listing.findMany({
    where: { userId: user.id, status: "AVAILABLE" },
    select: { id: true, title: true },
  });
  const link = (n: number) =>
    `/pedidos?${new URLSearchParams({ q, category, mine: mine ? "1" : "", page: String(n) })}`;
  return (
    <div className="container page">
      <PageTitle
        eyebrow="COMUNIDAD PUCP"
        title="Tablón de Pedidos"
        description="Descubre qué necesitan otros estudiantes y dale una segunda vida a tus materiales."
      >
        <NewWanted faculty={user.faculty} />
      </PageTitle>
      <div className="tabs">
        <Link className={!mine ? "active" : ""} href="/pedidos">
          Todos los pedidos
        </Link>
        <Link className={mine ? "active" : ""} href="/pedidos?mine=1">
          Mis pedidos y respuestas
        </Link>
      </div>
      <form className="search-form" action="/pedidos">
        <label className="search-input">
          <Search size={20} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar en el tablón…"
            aria-label="Buscar pedidos"
          />
        </label>
        <select name="category" aria-label="Categoría" defaultValue={category}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input type="hidden" name="mine" value={mine ? "1" : ""} />
        <button className="btn secondary" type="submit">
          Buscar
        </button>
      </form>
      <div className="wanted-layout">
        <section className="wanted-list">
          {items.map((w) => (
            <article className="wanted-item" key={w.id}>
              <div className="person-line">
                <Avatar name={w.user.name} />
                <div>
                  <Link href={`/comunidad/${w.userId}`}>
                    <b>{w.user.name}</b>
                  </Link>
                  <small>{date(w.createdAt)}</small>
                </div>
                <Badge status={w.status} />
              </div>
              <h2>{w.title}</h2>
              <p className="muted small">
                {[w.course, w.faculty, w.category].filter(Boolean).join(" · ")}
              </p>
              <p className="pre-wrap">{w.description}</p>
              <div className="wanted-bottom">
                <span className="muted small">
                  <MapPin size={15} />
                  Campus San Miguel · {w._count.responses} respuestas
                </span>
                {w.userId !== user.id ? (
                  <RespondWanted id={w.id} options={options} />
                ) : (
                  w.status === "OPEN" && (
                    <ActionButton
                      action="wanted.close"
                      data={{ id: w.id }}
                      confirm="¿Cerrar este pedido? Ya no recibirá nuevas respuestas."
                    >
                      Cerrar pedido
                    </ActionButton>
                  )
                )}
              </div>
              {w.responses.length > 0 && (
                <div className="wanted-responses">
                  <h3>{w.userId === user.id ? "Respuestas recibidas" : "Tu respuesta"}</h3>
                  {w.responses.map((r) => (
                    <div key={r.id}>
                      <b>{r.user.name}</b>
                      <p>{r.message}</p>
                      <Link className="text-link" href={`/materiales/${r.listingId}`}>
                        {r.listing.title} →
                      </Link>
                      <Badge status={r.listing.status} />
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
          {!items.length && (
            <Empty
              title="Todavía no hay pedidos"
              description="Publica lo que necesitas o prueba otra búsqueda."
            />
          )}
          {pages > 1 && (
            <nav className="pagination">
              {page > 1 && <Link href={link(page - 1)}>Anterior</Link>}
              <span>
                {page} / {pages}
              </span>
              {page < pages && <Link href={link(page + 1)}>Siguiente</Link>}
            </nav>
          )}
        </section>
        <aside className="board-aside">
          <h3>¿Tienes algo que compartir?</h3>
          <p>Encuentra a quien pueda darle una segunda vida.</p>
          <Link href="/publicar" className="btn">
            Publicar material
          </Link>
        </aside>
      </div>
    </div>
  );
}
