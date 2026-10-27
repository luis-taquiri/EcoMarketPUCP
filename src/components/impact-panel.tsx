import Link from "next/link";
import { Leaf, ArrowUpRight } from "lucide-react";
import { impactLevel, impactNumber } from "@/lib/impact";

export function ImpactPanel({
  summary,
  details = false,
}: {
  details?: boolean;
  summary: {
    sheets: number;
    co2Kg: number;
    completed: number;
  };
}) {
  const level = impactLevel(summary.sheets);
  return (
    <aside className="eco-impact" aria-labelledby="eco-impact-title">
      <div className="eco-impact-heading">
        <Leaf size={34} />
        <div>
          <p>MI IMPACTO ECOLÓGICO</p>
          <h2 id="eco-impact-title">Tu huella positiva</h2>
        </div>
      </div>
      <dl className="eco-impact-values">
        <div>
          <dt>
            hojas A4 equivalentes
            <br />
            reutilizadas
          </dt>
          <dd>{impactNumber(summary.sheets)}</dd>
        </div>
        <div>
          <dt>
            CO₂e potencialmente
            <br />
            evitado
          </dt>
          <dd>
            {impactNumber(summary.co2Kg, 2)}
            <small> kg</small>
          </dd>
        </div>
        <div>
          <dt>
            intercambios
            <br />
            completados
          </dt>
          <dd>{impactNumber(summary.completed)}</dd>
        </div>
      </dl>
      <div className="eco-level-label">
        <b>Nivel {level.name}</b>
        <span>{level.percent}%</span>
      </div>
      <progress
        className="eco-progress"
        value={level.percent}
        max={100}
        aria-label={`Progreso del nivel ${level.name}`}
      />
      <p className="eco-next-level">
        {level.next
          ? `${impactNumber(level.remaining)} hojas más para llegar a Nivel ${level.next}`
          : "Nivel máximo de participación alcanzado"}
      </p>
      <Link href={details ? "#metodologia" : "/impacto"} className="eco-method-link">
        {details ? "Fuente y supuestos" : "Ver mi impacto y metodología"}
        <ArrowUpRight size={15} />
      </Link>
      <p className="eco-estimate-note">
        Estimación EPA (2006). No es una medición de emisiones ni de árboles salvados.
      </p>
    </aside>
  );
}
