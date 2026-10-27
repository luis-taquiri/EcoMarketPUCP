"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Plus, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Brand, Avatar } from "./ui";
import { ActionButton } from "./client-ui";
export function Header({
  name,
  pending,
  admin,
}: {
  name: string;
  pending: number;
  admin: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    ["/explorar", "Explorar"],
    ["/pedidos", "Tablón de Pedidos"],
    ["/solicitudes", "Mis Solicitudes"],
    ["/perfil", "Mi Perfil"],
  ];
  return (
    <header className="header">
      <div className="header-inner">
        <Brand />
        <button
          className="icon-btn mobile-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "nav open" : "nav"} aria-label="Navegación principal">
          {links.map(([href, label]) => (
            <Link
              onClick={() => setOpen(false)}
              key={href}
              href={href}
              className={path.startsWith(href) ? "active" : ""}
            >
              {label}
              {href === "/solicitudes" && pending > 0 && <span className="count">{pending}</span>}
            </Link>
          ))}
          {admin && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Moderación
            </Link>
          )}
          <div className="nav-logout">
            <ActionButton action="logout" href="/login" className="text-link">
              <LogOut size={17} /> Cerrar sesión
            </ActionButton>
          </div>
        </nav>
        <div className="header-actions">
          <Link href="/publicar" className="btn" aria-label="Publicar material">
            <Plus size={18} />
            <span>Publicar material</span>
          </Link>
          <Link href="/perfil" title="Mi perfil">
            <Avatar name={name} />
          </Link>
          <ActionButton action="logout" href="/login" className="icon-btn">
            <LogOut size={18} />
            <span className="sr-only">Cerrar sesión</span>
          </ActionButton>
        </div>
      </div>
    </header>
  );
}
