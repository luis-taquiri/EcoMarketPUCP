import Link from "next/link";
import { Brand } from "@/components/ui";
import { LegalLinks } from "@/components/legal-links";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Brand />
        <Link href="/login">Ingresar</Link>
      </header>
      <main className="legal-document">{children}</main>
      <footer className="legal-footer">
        <LegalLinks />
        <Link href="/registro">Crear una cuenta</Link>
      </footer>
    </div>
  );
}
