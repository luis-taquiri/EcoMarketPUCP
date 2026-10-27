import { requirePageUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/header";
import { Leaf } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  const pending = await db.trade.count({ where: { receiverId: user.id, status: "PENDING" } });
  return (
    <>
      <a href="#main" className="skip-link">
        Ir al contenido
      </a>
      <Header name={user.name} pending={pending} admin={user.role === "ADMIN"} />
      <main id="main">{children}</main>
      <footer className="footer">
        <span>
          <Leaf size={18} /> EcoMarket PUCP
        </span>
        <span>Una segunda vida para cada material. Sin dinero de por medio.</span>
      </footer>
    </>
  );
}
