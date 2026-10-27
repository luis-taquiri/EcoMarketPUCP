import { Leaf, PackageOpen } from "lucide-react";
import Link from "next/link";
import { initials, STATUS } from "@/lib/constants";
export function Brand() {
  return (
    <Link href="/explorar" className="brand" aria-label="EcoMarket PUCP, inicio">
      <span className="brand-icon">
        <Leaf size={26} />
      </span>
      <span>
        <strong>
          EcoMarket <b>PUCP</b>
        </strong>
        <small>INTERCAMBIA. REUTILIZA. IMPACTA.</small>
      </span>
    </Link>
  );
}
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <span className={`avatar ${large ? "large" : ""}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Badge({ status }: { status: string }) {
  return <span className={`badge ${status.toLowerCase()}`}>{STATUS[status] || status}</span>;
}
export function Empty({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <PackageOpen size={38} />
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="btn" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
