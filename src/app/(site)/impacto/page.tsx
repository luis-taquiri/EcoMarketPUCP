import Link from "next/link";
import { ArrowLeft, Leaf, FileText, Scale } from "lucide-react";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { getImpactSummary } from "@/lib/impact-summary";
import { EPA_SOURCE, impactNumber } from "@/lib/impact";
import { date } from "@/lib/constants";
import { ImpactPanel } from "@/components/impact-panel";
import { PageTitle, Empty } from "@/components/ui";

export default async function Impact({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requirePageUser();
  const search = await searchParams;
  const summary = await getImpactSummary(user.id);
  const pages = Math.max(1, Math.ceil(summary.estimated / 20));
  const page = Math.min(pages, Math.max(1, parseInt(search.page || "1") || 1));
  const entries = await db.impactEntry.findMany({
    where: { userId: user.id },
    include: { listing: { select: { title: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 20,
    skip: (page - 1) * 20,
  });
  return (
    <div className="container page">
      <Link className="back-link" href="/perfil">
        <ArrowLeft size={17} />
        Mi perfil
      </Link>
      <PageTitle
        eyebrow="MI IMPACTO ECOLÓGICO"
        title="Cada material cuenta"
        description="Tu contribución estimada a partir de entregas confirmadas por ambas personas."
      />
      <div className="impact-detail-layout">
        <div>
          <section className="impact-history">
            <div className="section-heading">
              <h2>Materiales que entregaste</h2>
              <span className="muted small">{summary.estimated} con estimación</span>
            </div>
            {entries.length ? (
              entries.map((entry) => (
                <article className="impact-history-row" key={entry.id}>
                  <span className="impact-material-icon">
                    {entry.material === "OFFICE_PAPER" ? (
                      <FileText size={22} />
                    ) : (
                      <Scale size={22} />
                    )}
                  </span>
                  <div>
                    <b>{entry.listing.title}</b>
                    <p className="muted small">
                      {entry.material === "OFFICE_PAPER" ? "Papel de oficina" : "Libro de texto"} ·{" "}
                      {impactNumber(entry.weightGrams, 1)} g · {date(entry.createdAt)}
                    </p>
                    {entry.paperSheets > 0 && (
                      <small className="muted">
                        {impactNumber(entry.paperSheets)} hojas A4 equivalentes
                      </small>
                    )}
                  </div>
                  <strong>
                    {impactNumber(entry.co2Grams / 1000, 2)}
                    <small> kg CO₂e</small>
                  </strong>
                </article>
              ))
            ) : (
              <Empty
                title="Aún no hay entregas con estimación"
                description="Las entregas anteriores sin datos ambientales no reciben una estimación retroactiva."
              />
            )}
            {summary.withoutEstimate > 0 && (
              <p className="notice">
                {summary.withoutEstimate}{" "}
                {summary.withoutEstimate === 1
                  ? "material entregado sin datos suficientes"
                  : "materiales entregados sin datos suficientes"}{" "}
                para estimar su impacto. No se asigna un factor a otros tipos de material.
              </p>
            )}
            {pages > 1 && (
              <nav className="pagination" aria-label="Historial de impacto">
                {page > 1 && <Link href={`/impacto?page=${page - 1}`}>Anterior</Link>}
                <span>
                  {page} / {pages}
                </span>
                {page < pages && <Link href={`/impacto?page=${page + 1}`}>Siguiente</Link>}
              </nav>
            )}
          </section>
          <section className="impact-method" id="metodologia">
            <h2>
              <Leaf size={22} />
              Cómo se estima
            </h2>
            <p>
              Se atribuye a quien entrega cada material, no también a quien lo recibe. Un trueque
              puede registrar dos materiales distintos; una donación, uno. Solo cuenta tras la doble
              confirmación, una vez por material.
            </p>
            <dl>
              <div>
                <dt>Papel de oficina</dt>
                <dd>1,13 kg CO₂e por kg de papel.</dd>
              </div>
              <div>
                <dt>Libros de texto</dt>
                <dd>2,43 kg CO₂e por kg de libro.</dd>
              </div>
              <div>
                <dt>Hojas A4 de 80 g/m²</dt>
                <dd>0,210 × 0,297 × 80 = 4,9896 g por hoja.</dd>
              </div>
            </dl>
            <p>
              CO₂e estimado = peso en kg × factor del material. En libros se utiliza peso declarado,
              no páginas. Las hojas equivalentes solo representan papel de oficina, no páginas de
              libros.
            </p>
            <p>
              Los factores de fabricación proceden del Exhibit 3-1 de EPA (2006): 0,28 y 0,60 MTCE
              por tonelada corta, convertidos con × (44/12) × 1000 ÷ 907,18474 y redondeados a 1,13
              y 2,43. No se suma el carbono forestal.
            </p>
            <p className="notice">
              Es un ahorro potencial, no una medición ni una compensación certificada. Supone que
              reutilizar sustituye una compra nueva. Los factores son promedios históricos de EE.
              UU., no de Perú. No se incluye transporte ni la impresión original; hojas y peso son
              declarados por usuarios.
            </p>
            <p>
              Los niveles de participación se basan en hojas equivalentes: Semilla al comenzar,
              Brote desde la primera hoja, Árbol desde 200 y Bosque desde 1000. No representan
              árboles plantados o salvados.
            </p>
            <p>
              Cada registro conserva el peso, el factor, el método y el resultado del momento de la
              entrega. No cambia por editar otros materiales ni por actualizar factores
              posteriormente.
            </p>
            <a className="text-link" href={EPA_SOURCE} target="_blank" rel="noopener noreferrer">
              Consultar fuente EPA: capítulo 3, Exhibit 3-1 ↗
            </a>
          </section>
        </div>
        <ImpactPanel summary={summary} details />
      </div>
    </div>
  );
}
