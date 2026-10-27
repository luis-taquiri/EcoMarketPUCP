import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty standalone">
      <h1>No encontramos esta página</h1>
      <p>El material puede haber sido archivado o el enlace ya no está disponible.</p>
      <Link className="btn" href="/explorar">
        Volver a explorar
      </Link>
    </main>
  );
}
