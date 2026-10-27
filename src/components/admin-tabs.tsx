import Link from "next/link";

export function AdminTabs({ active }: { active: "reports" | "users" }) {
  return (
    <nav className="tabs" aria-label="Administración">
      <Link
        href="/admin"
        className={active === "reports" ? "active" : ""}
        aria-current={active === "reports" ? "page" : undefined}
      >
        Reportes
      </Link>
      <Link
        href="/admin/usuarios"
        className={active === "users" ? "active" : ""}
        aria-current={active === "users" ? "page" : undefined}
      >
        Usuarios
      </Link>
    </nav>
  );
}
