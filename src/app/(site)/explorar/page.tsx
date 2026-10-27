import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Search, Sprout, ArrowLeft, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { Campus } from "@/components/campus";
import { CatalogFilters } from "@/components/catalog-filters";
import { ListingCard } from "@/components/listing-card";
import { Empty } from "@/components/ui";
export default async function Explore({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePageUser();
  const s = await searchParams;
  const str = (k: string) => (typeof s[k] === "string" ? (s[k] as string).slice(0, 100) : "");
  const q = str("q"),
    category = str("category"),
    faculty = str("faculty"),
    kind = str("kind"),
    sort = str("sort");
  const where: Prisma.ListingWhereInput = {
    status: "AVAILABLE",
    user: { disabled: false },
    ...(category ? { category } : {}),
    ...(faculty ? { faculty } : {}),
    ...(["TRADE", "DONATION"].includes(kind) ? { kind } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { course: { contains: q } },
          ],
        }
      : {}),
  };
  const total = await db.listing.count({ where });
  const pages = Math.max(1, Math.ceil(total / 12));
  const page = Math.min(pages, Math.max(1, Number.parseInt(str("page")) || 1));
  const listings = await db.listing.findMany({
    where,
    include: {
      user: { select: { name: true } },
      favorites: { where: { userId: user.id }, select: { userId: true } },
    },
    orderBy:
      sort === "title" ? { title: "asc" } : { createdAt: sort === "oldest" ? "asc" : "desc" },
    take: 12,
    skip: (page - 1) * 12,
  });
  const groups = await db.listing.groupBy({
    by: ["category"],
    where: { status: "AVAILABLE", user: { disabled: false } },
    _count: true,
  });
  const counts: Record<string, number> = { total: groups.reduce((n, g) => n + g._count, 0) };
  groups.forEach((g) => (counts[g.category] = g._count));
  const completed = await db.trade.count({ where: { status: "COMPLETED" } });
  const pageLink = (n: number) => {
    const params = new URLSearchParams({ q, category, faculty, kind, sort, page: String(n) });
    return `/explorar?${params}#catalogo`;
  };
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <p className="hero-label">
              <Sprout size={15} /> COMUNIDAD PUCP SOSTENIBLE
            </p>
            <h1>
              Economía circular y trueque de
              <br className="desktop-break" /> material académico en la PUCP
            </h1>
            <p>
              Encuentra apuntes, libros y materiales que otros estudiantes ya no usan.
              <br />
              Comparte y reduce tu impacto ambiental.
            </p>
            <div className="hero-stats">
              <span>
                <b>{counts.total}</b> materiales disponibles
              </span>
              <span>
                <b>{completed}</b> intercambios completados
              </span>
              <span>
                <b>0</b> pagos
              </span>
            </div>
          </div>
          <Campus />
        </div>
      </section>
      <div className="catalog-layout container" id="catalogo">
        <CatalogFilters
          key={`${category}-${faculty}-${kind}-${q}`}
          category={category}
          faculty={faculty}
          kind={kind}
          q={q}
          counts={counts}
        />
        <section className="catalog-results">
          <div className="catalog-title">
            <div>
              <p className="eyebrow">EXPLORA EL CAMPUS</p>
              <h2>Materiales disponibles</h2>
              <p className="muted small">
                {total} {total === 1 ? "publicación encontrada" : "publicaciones encontradas"}
              </p>
            </div>
          </div>
          <form action="/explorar" className="search-form">
            <label className="search-input">
              <span className="sr-only">Buscar materiales</span>
              <Search size={20} />
              <input name="q" defaultValue={q} placeholder="Buscar apuntes, materiales, libros…" />
            </label>
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="faculty" value={faculty} />
            <input type="hidden" name="kind" value={kind} />
            <label className="sort-label">
              <span className="sr-only">Ordenar por</span>
              <select name="sort" defaultValue={sort}>
                <option value="">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="title">Nombre A–Z</option>
              </select>
            </label>
            <button className="btn secondary" type="submit">
              <Search size={17} />
              <span>Buscar</span>
            </button>
          </form>
          {(q || category || faculty || kind) && (
            <div className="active-filters">
              <span>
                {[
                  q,
                  category,
                  faculty,
                  kind === "DONATION" ? "Donaciones" : kind === "TRADE" ? "Trueques" : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <Link href="/explorar">Quitar filtros</Link>
            </div>
          )}
          {listings.length ? (
            <div className="listing-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <Empty
              title="No encontramos materiales"
              description="Prueba otra búsqueda o publica lo que necesitas en el tablón."
              href="/pedidos"
              label="Ir al tablón"
            />
          )}
          {pages > 1 && (
            <nav className="pagination" aria-label="Páginas del catálogo">
              {page > 1 && (
                <Link href={pageLink(page - 1)} className="btn secondary">
                  <ArrowLeft size={16} />
                  Anterior
                </Link>
              )}
              <span>
                Página {page} de {pages}
              </span>
              {page < pages && (
                <Link href={pageLink(page + 1)} className="btn secondary">
                  Siguiente
                  <ArrowRight size={16} />
                </Link>
              )}
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
