"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty standalone">
      <h1>No pudimos cargar esta página</h1>
      <p>Vuelve a intentarlo en un momento.</p>
      <button className="btn" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
