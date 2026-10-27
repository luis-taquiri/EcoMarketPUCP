import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { PageTitle, Badge, Empty } from "@/components/ui";
import { ActionButton } from "@/components/client-ui";
import { date } from "@/lib/constants";
import { AdminTabs } from "@/components/admin-tabs";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requirePageUser();
  if (user.role !== "ADMIN") notFound();
  const s = await searchParams;
  const count = await db.report.count({ where: { status: "OPEN" } });
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, parseInt(s.page || "1") || 1));
  const reports = await db.report.findMany({
    where: { status: "OPEN" },
    include: {
      listing: { select: { id: true, title: true, status: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    skip: (page - 1) * 20,
  });
  return (
    <div className="container narrow page">
      <PageTitle
        eyebrow="ADMINISTRACIÓN"
        title="Revisión de reportes"
        description={`${count} reportes pendientes de revisión.`}
      />
      <AdminTabs active="reports" />
      {reports.map((r) => (
        <article className="wanted-item" key={r.id}>
          <div className="person-line">
            <b>{r.reason}</b>
            <Badge status={r.status} />
          </div>
          <Link className="text-link" href={`/materiales/${r.listingId}`}>
            {r.listing.title}
          </Link>
          <p className="pre-wrap">{r.details}</p>
          <p className="muted small">
            Reportado por {r.user.name} · {date(r.createdAt)}
          </p>
          <div className="button-row">
            {r.listing.status === "AVAILABLE" && (
              <ActionButton
                action="listing.status"
                data={{ id: r.listingId, status: "ARCHIVED" }}
                confirm="¿Archivar la publicación reportada? Se cerrarán sus propuestas pendientes."
              >
                Archivar publicación
              </ActionButton>
            )}
            <ActionButton action="report.resolve" data={{ id: r.id }} className="btn">
              Marcar como revisado
            </ActionButton>
          </div>
        </article>
      ))}
      {!reports.length && (
        <Empty
          title="Sin reportes pendientes"
          description="Los nuevos reportes de la comunidad aparecerán aquí."
        />
      )}
      {pages > 1 && (
        <nav className="pagination">
          {page > 1 && <Link href={`?page=${page - 1}`}>Anterior</Link>}
          <span>
            {page} / {pages}
          </span>
          {page < pages && <Link href={`?page=${page + 1}`}>Siguiente</Link>}
        </nav>
      )}
    </div>
  );
}
