import Link from "next/link";
import type { Metadata } from "next";
import { PRIVACY_CONTACT, PRIVACY_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso de privacidad" };

export default function Privacy() {
  return (
    <>
      <p className="eyebrow">ECOMARKET PUCP</p>
      <h1>Aviso de privacidad</h1>
      <p className="muted">Versión {PRIVACY_VERSION} · Publicado el 27 de octubre de 2026</p>
      <section>
        <h2>Quién trata tus datos</h2>
        <p>
          El equipo desarrollador de EcoMarket PUCP gestiona este proyecto estudiantil
          independiente. No es un servicio oficial de la PUCP ni utiliza sus sistemas de
          autenticación. El contacto operativo para privacidad es{" "}
          <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a>.
        </p>
      </section>
      <section>
        <h2>Qué información utilizamos</h2>
        <ul>
          <li>
            Para registrarte: nombre, correo de dominio @pucp.edu.pe, facultad y contraseña. La
            contraseña se guarda como un hash, no en texto legible.
          </li>
          <li>
            Si decides completarlos: ciclo y biografía. También guardamos las fotos y los datos de
            tus publicaciones, favoritos, pedidos, propuestas, conversaciones, encuentros,
            confirmaciones, valoraciones y reportes.
          </li>
          <li>
            Conservamos la fecha y versión de los términos y del aviso aceptados. Las cuentas
            anteriores y las de demostración no reciben una aceptación ficticia.
          </li>
          <li>
            Usamos una cookie técnica de sesión de hasta siete días. El servidor puede registrar
            direcciones IP y datos técnicos de las solicitudes para operar y proteger el servicio.
          </li>
        </ul>
      </section>
      <section>
        <h2>Para qué y con quién se comparten</h2>
        <p>
          Tratamos estos datos para crear y proteger tu cuenta, mostrar materiales, gestionar
          intercambios y donaciones, coordinar entregas y atender reportes. No vendemos datos ni los
          utilizamos para publicidad o perfiles comerciales.
        </p>
        <p>
          Tu nombre, facultad, ciclo, biografía, materiales, pedidos y valoraciones son visibles
          para otros usuarios registrados. Tu correo no se muestra en el perfil comunitario. Los
          mensajes y detalles de un encuentro solo se muestran a sus participantes; los reportes son
          atendidos por administración.
        </p>
        <p>
          Las fotografías de publicaciones son accesibles a la comunidad autenticada según la
          visibilidad de la publicación. No subas documentos de identidad, datos sensibles, imágenes
          de terceros sin autorización ni información privada en descripciones públicas.
        </p>
        <p>
          La instalación del curso utiliza Amazon Web Services en Estados Unidos (región Norte de
          Virginia), por lo que el almacenamiento y procesamiento de datos se realiza fuera del
          Perú. El proveedor de infraestructura y el equipo operador pueden tener acceso técnico
          para alojamiento, mantenimiento y atención de incidencias. No enviamos tus datos a
          servicios de IA desde la aplicación.
        </p>
      </section>
      <section>
        <h2>Tu decisión y tus derechos</h2>
        <p>
          Si declaras hojas o peso de un material, también calculamos una estimación educativa de su
          reutilización tras completar la entrega. El historial y el nivel ambiental se muestran
          únicamente en tu propia cuenta; no son mediciones verificadas ni un perfil comercial.
          Administración puede deshabilitar o reactivar cuentas para atender incidencias, sin borrar
          automáticamente sus datos.
        </p>
        <p>
          Las casillas del registro están desmarcadas y requieren tu aceptación expresa. El nombre,
          correo, facultad y credenciales son necesarios para prestar el servicio; si no autorizas
          ese tratamiento no se crea la cuenta. Los datos opcionales no son obligatorios.
        </p>
        <p>
          Puedes solicitar información, acceso, rectificación, cancelación o supresión, oposición y
          revocación del consentimiento escribiendo a{" "}
          <a href={`mailto:${PRIVACY_CONTACT}`}>{PRIVACY_CONTACT}</a> desde el correo de tu cuenta.
          Indica la solicitud, sin enviar tu contraseña ni documentos innecesarios. El equipo
          verifica la petición y la atiende manualmente conforme a los plazos y obligaciones
          aplicables.
        </p>
        <p>
          Retirar la autorización puede impedir seguir usando la cuenta. No invalida el tratamiento
          previo que haya sido legítimo. Puedes acudir a la Autoridad Nacional de Protección de
          Datos Personales si consideras que tu solicitud no fue atendida.
        </p>
      </section>
      <section>
        <h2>Conservación y seguridad</h2>
        <p>
          Los datos se conservan durante el uso de la cuenta y el desarrollo del piloto. Al
          solicitar su eliminación o al cerrar el proyecto, el equipo debe revisar y suprimir o
          anonimizar lo que ya no resulte necesario, salvo conservación justificada para atender
          obligaciones o incidencias. No existe un borrado automático por inactividad.
        </p>
        <p>
          Los respaldos requieren revisión y eliminación por el equipo operador; no deben
          reutilizarse para fines distintos ni restaurar datos eliminados sin aplicar nuevamente las
          solicitudes atendidas.
        </p>
        <p>
          Aplicamos controles de acceso, contraseñas con hash, sesiones y HTTPS en el despliegue.
          Ningún sistema elimina todos los riesgos. El dominio del correo se valida, pero no se
          comprueba que seas su titular ni se acredita tu condición de estudiante.
        </p>
      </section>
      <section>
        <h2>Cambios y consultas</h2>
        <p>
          Una modificación de finalidades o condiciones requiere actualizar este aviso y evaluar si
          es necesario solicitar nuevamente autorización. Puedes conservar esta versión mediante la
          función de imprimir de tu navegador.
        </p>
        <p>
          Consulta también los <Link href="/terminos">términos de uso</Link>.
        </p>
      </section>
    </>
  );
}
