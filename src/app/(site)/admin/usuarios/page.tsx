import { notFound } from "next/navigation";
import Link from "next/link";
import { Search, UserRoundCheck, UserRoundX, ShieldCheck, Users } from "lucide-react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePageUser } from "@/lib/auth";
import { date } from "@/lib/constants";
import { PageTitle, Avatar, Empty } from "@/components/ui";
import { ActionButton } from "@/components/client-ui";
import { AdminTabs } from "@/components/admin-tabs";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const admin = await requirePageUser();
  if (admin.role !== "ADMIN") notFound();
  const search = await searchParams;
  const q = typeof search.q === "string" ? search.q.trim().toLowerCase().slice(0, 254) : "";
  const status = ["active", "disabled"].includes(search.status || "") ? search.status! : "";
  const where: Prisma.UserWhereInput = {
    ...(q ? { email: { contains: q } } : {}),
    ...(status ? { disabled: status === "disabled" } : {}),
  };
  const count = await db.user.count({ where });
  const pages = Math.max(1, Math.ceil(count / 20));
  const page = Math.min(pages, Math.max(1, parseInt(search.page || "1") || 1));
  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      faculty: true,
      role: true,
      disabled: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 20,
    skip: (page - 1) * 20,
  });
  const pageLink = (n: number) =>
    `/admin/usuarios?${new URLSearchParams({ q, status, page: String(n) })}`;
  return (
    <div className="container page admin-users-page">
      <PageTitle eyebrow="ADMINISTRACIÓN" title="Usuarios" />
      <AdminTabs active="users" />
      <form action="/admin/usuarios" className="user-search">
        <label className="search-input">
          <Search size={19} />
          <span className="sr-only">Buscar por correo</span>
          <input
            name="q"
            type="search"
            defaultValue={q}
            maxLength={254}
            placeholder="Buscar por correo…"
          />
        </label>
        <label>
          <span className="sr-only">Estado de la cuenta</span>
          <select name="status" defaultValue={status}>
            <option value="">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="disabled">Deshabilitadas</option>
          </select>
        </label>
        <button className="btn secondary" type="submit">
          <Search size={17} />
          Buscar
        </button>
        {(q || status) && (
          <Link className="text-link" href="/admin/usuarios">
            Limpiar
          </Link>
        )}
      </form>
      <div className="user-list-heading">
        <p>
          <Users size={17} />
          {count} {count === 1 ? "cuenta encontrada" : "cuentas encontradas"}
        </p>
        <span className="muted small">Las cuentas administradoras están protegidas.</span>
      </div>
      {users.length ? (
        <div className="users-table-wrap">
          <table className="users-table">
            <caption className="sr-only">Cuentas de EcoMarket y su estado de acceso</caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Correo</th>
                <th scope="col">Acceso</th>
                <th scope="col">Materiales</th>
                <th scope="col">Registro</th>
                <th scope="col">Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-identity">
                      <Avatar name={user.name} />
                      <div>
                        <b>{user.name}</b>
                        <small>{user.faculty}</small>
                      </div>
                    </div>
                  </td>
                  <td className="user-email">{user.email}</td>
                  <td data-label="Acceso">
                    <span className={`account-status ${user.disabled ? "disabled" : "active"}`}>
                      {user.disabled ? "Deshabilitada" : "Activa"}
                    </span>
                  </td>
                  <td data-label="Materiales">{user._count.listings}</td>
                  <td data-label="Registro" className="user-date">
                    {date(user.createdAt)}
                  </td>
                  <td>
                    <div className="user-state-action">
                      {user.role === "ADMIN" ? (
                        <span className="admin-protected">
                          <ShieldCheck size={16} />
                          {user.id === admin.id ? "Tu cuenta" : "Administrador"}
                        </span>
                      ) : (
                        <ActionButton
                          action="admin.user-status"
                          data={{ id: user.id, disabled: !user.disabled }}
                          className={`btn secondary ${user.disabled ? "" : "danger"}`}
                          confirm={
                            user.disabled
                              ? `¿Reactivar la cuenta ${user.email}? Tendrá que iniciar sesión nuevamente.`
                              : `¿Deshabilitar la cuenta ${user.email}? Se cerrarán sus sesiones y se ocultarán sus publicaciones. Sus datos y los intercambios aceptados se conservarán.`
                          }
                        >
                          {user.disabled ? <UserRoundCheck size={17} /> : <UserRoundX size={17} />}
                          {user.disabled ? "Reactivar" : "Deshabilitar"}
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title="No se encontraron usuarios"
          description="No hay cuentas que coincidan con el correo o estado seleccionado."
        />
      )}
      {pages > 1 && (
        <nav className="pagination" aria-label="Páginas de usuarios">
          {page > 1 && <Link href={pageLink(page - 1)}>Anterior</Link>}
          <span>
            Página {page} de {pages}
          </span>
          {page < pages && <Link href={pageLink(page + 1)}>Siguiente</Link>}
        </nav>
      )}
    </div>
  );
}
