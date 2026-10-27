import { Brand } from "@/components/ui";
import { Campus } from "@/components/campus";
import { Sprout } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LegalLinks } from "@/components/legal-links";
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await currentUser()) redirect("/explorar");
  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-visual">
          <div className="auth-visual-copy">
            <p className="hero-label">
              <Sprout size={16} /> COMUNIDAD QUE TRANSFORMA
            </p>
            <h1>Dale una segunda vida a tus materiales.</h1>
            <p>
              Lo que ya no usas puede ser justo lo que alguien necesita. Conecta, comparte y
              construye un campus más sostenible.
            </p>
          </div>
          <Campus />
          <div className="auth-impact">
            <span>
              <b>Sin dinero</b>Solo trueques y donaciones
            </span>
            <span>
              <b>En el campus</b>Encuentros en lugares públicos
            </span>
          </div>
        </section>
        <section className="auth-panel">
          <Brand />
          <p className="muted auth-tagline">Economía circular y trueque en tu campus</p>
          {children}
          <p className="auth-note">
            Proyecto estudiantil independiente. Se solicita correo PUCP, pero no se verifica su
            titularidad ni existe conexión con el acceso institucional.
          </p>
        </section>
      </div>
      <footer className="auth-footer">
        EcoMarket PUCP <span>Menos desperdicio. Más comunidad.</span>
        <LegalLinks />
      </footer>
    </main>
  );
}
