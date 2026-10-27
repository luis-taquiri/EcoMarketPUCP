import Link from "next/link";
import type { Metadata } from "next";
import { TERMS_VERSION, PRIVACY_CONTACT } from "@/lib/legal";

export const metadata: Metadata = { title: "Términos de uso" };

export default function Terms() {
  return (
    <>
      <p className="eyebrow">ECOMARKET PUCP</p>
      <h1>Términos de uso</h1>
      <p className="muted">Versión {TERMS_VERSION} · Publicado el 27 de octubre de 2026</p>
      <section>
        <h2>Objeto y participación</h2>
        <p>
          EcoMarket PUCP facilita trueques y donaciones de materiales académicos entre personas de
          la comunidad universitaria. Es un proyecto estudiantil independiente, no un servicio
          oficial de la universidad. No procesa pagos, ventas, comisiones ni transferencias
          monetarias.
        </p>
        <p>
          Para registrarte debes utilizar un correo cuyo dominio sea exactamente @pucp.edu.pe,
          proporcionar información veraz, estar autorizado para utilizar esa dirección y proteger tu
          contraseña. La aplicación no verifica la titularidad del correo ni la identidad de sus
          usuarios. No suplantes a otras personas ni utilices una cuenta ajena.
        </p>
      </section>
      <section>
        <h2>Publicaciones y conducta</h2>
        <p>
          Publica únicamente materiales que puedas entregar legítimamente y que estés autorizado a
          intercambiar, con fotografías y descripciones veraces. Respeta los derechos de autor y los
          datos de otras personas.
        </p>
        <p>
          No se permiten solicitudes de dinero, productos ilícitos o peligrosos, documentos de
          identidad, credenciales, información sensible, contenido discriminatorio, acoso,
          suplantación, spam ni intentos de acceder a cuentas o datos ajenos.
        </p>
      </section>
      <section>
        <h2>Acuerdos y entregas</h2>
        <p>
          Enviar una propuesta no reserva materiales. Al aceptarla se reservan los objetos
          involucrados. Las dos personas deben confirmar la entrega para que el sistema marque el
          intercambio como completado. No confirmes una entrega que no ocurrió.
        </p>
        <p>
          Coordina en espacios públicos del campus y revisa el material antes de confirmar. Si una
          persona ya confirmó, la cancelación requiere revisión humana. La plataforma no garantiza
          la entrega física, el estado de los materiales ni resuelve disputas automáticamente.
        </p>
      </section>
      <section>
        <h2>Moderación y disponibilidad</h2>
        <p>
          Administración puede deshabilitar y reactivar el acceso de cuentas de estudiantes para
          atender incumplimientos o incidencias de seguridad. Al deshabilitar se cierran sus
          sesiones y se ocultan sus publicaciones, pero se conservan los datos y los acuerdos
          existentes. Puedes solicitar una revisión mediante el correo de contacto.
        </p>
        <p>
          Puedes reportar publicaciones o conductas desde la aplicación. El administrador revisa
          reportes y puede archivar materiales disponibles conforme a las reglas del proyecto. Las
          valoraciones deben reflejar intercambios realmente completados.
        </p>
        <p>
          El servicio puede interrumpirse por mantenimiento, restricciones del laboratorio AWS
          Academy o finalización del curso. No se garantiza disponibilidad permanente. Las cuentas y
          publicaciones demo contienen datos ficticios y no representan ofertas reales.
        </p>
      </section>
      <section>
        <h2>Datos y contacto</h2>
        <p>
          Las cifras ambientales son estimaciones educativas basadas en datos declarados y supuestos
          de fabricación evitada. No equivalen a compensaciones de carbono ni certifican árboles
          salvados. La metodología y sus límites están disponibles en tu sección de impacto.
        </p>
        <p>
          El tratamiento de datos se explica en el{" "}
          <Link href="/privacidad">aviso de privacidad</Link> y se autoriza por separado durante el
          registro. Estas condiciones no limitan derechos reconocidos por la normativa aplicable.
        </p>
        <p>
          Para consultas, incidencias o solicitudes sobre tu cuenta, escribe a{" "}
          <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
        </p>
      </section>
    </>
  );
}
