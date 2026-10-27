import Link from "next/link";

export function LegalLinks() {
  return (
    <nav className="legal-links" aria-label="Información legal">
      <Link href="/privacidad">Privacidad</Link>
      <Link href="/terminos">Términos de uso</Link>
    </nav>
  );
}
