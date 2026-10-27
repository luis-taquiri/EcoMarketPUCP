# Revisión de seguridad y privacidad

Fecha: 27 de octubre de 2026. Alcance: revisión del código del prototipo EcoMarket PUCP y pruebas automatizadas locales. No es una auditoría independiente, certificación legal ni prueba de penetración de AWS.

## Cambios implementados

- Registro: dominio exacto `pucp.edu.pe`, longitud limitada, aceptación explícita de dos casillas desmarcadas. El servidor rechaza autorizaciones ausentes, falsas o enviadas como texto. Los roles y las fechas/versiones enviados por un cliente no se aceptan como autoridad.
- Constancia de aceptación: fecha y versión de términos y privacidad en SQLite; migración aditiva con valores nulos para cuentas anteriores. No se registra una aceptación en nombre de usuarios demo o del administrador.
- Contraseñas: bcrypt con coste 12; registros nuevos de 15 caracteres como mínimo y límite de 72 bytes UTF-8. Scripts de administrador y recuperación también impiden truncamiento por bytes. No se fuerzan cambios a las cuentas existentes.
- Sesiones: tokens aleatorios de 32 bytes, solo SHA-256 en la base, cookie HttpOnly/SameSite=Lax, Secure automático con APP_URL HTTPS, siete días de vigencia. Un nuevo login invalida la sesión anterior del mismo navegador. Logout y recuperación de contraseña revocan las sesiones correspondientes.
- Login: mensaje genérico y comparación bcrypt de coste equivalente cuando el usuario no existe. Límites de 15 intentos por cuenta y 60 por origen de red cada diez minutos; contador en memoria acotado a 2048 claves. Las acciones autenticadas tienen un límite general de 120 por minuto por usuario.
- CSRF: comprobación obligatoria del Origin frente a APP_URL. Un Host manipulado no amplía los orígenes permitidos en producción. Se admiten alias loopback del mismo puerto solo para desarrollo local.
- Archivos: límite de 5 MB y 40 megapíxeles, formato decodificado JPG/PNG/WebP, rechazo de SVG con MIME falsificado, conversión a WebP y eliminación de metadatos por recodificación. Nombres UUID, sin rutas controladas por el usuario; máximo 60 cargas por hora por cuenta.
- Visibilidad de fotos: un borrador solo puede verlo su propietario. Otras personas autenticadas solo acceden si la foto está en una publicación visible o en una publicación archivada de un intercambio en el que participaron. Las respuestas se sirven sin almacenamiento en caché.
- Autorización: se mantienen comprobaciones de propietario, participantes del chat e intercambios y rol administrador. Los hashes de contraseña no se incluyen en los perfiles enviados al navegador. Las consultas SQL específicas de visibilidad usan parámetros, no concatenación de entradas.
- Navegador: nosniff, protección frente a marcos, Referrer-Policy, Permissions-Policy, HSTS en producción y CSP básica para objetos, formularios y URL base. Esta CSP no es una política completa de scripts basada en nonces.
- Despliegue: puerto Docker enlazado únicamente a loopback, aplicación ejecutada como usuario node después de preparar volúmenes, HTTPS en Apache. No se modifica la configuración de otras aplicaciones.

## Verificación

Resultado de esta revisión: 16 pruebas automatizadas, 14 comprobaciones HTTP, typecheck y build correctos; npm audit sin vulnerabilidades conocidas. También se construyó y arrancó la imagen Docker Linux AMD64 sobre una copia de la base anterior: se conservaron los identificadores, permisos y hashes de las 7 cuentas existentes, se creó un administrador de prueba y se comprobaron consentimiento, login, conversión y visibilidad de fotos. La copia y los contenedores de prueba están aislados de AWS.

`npm test` cubre consentimiento, dominio, bytes de contraseña, origen falsificado, límites y expiración, reservas y seed. `npm run test:e2e` comprueba el servidor de producción con una base temporal: registro sin autorización, metadatos de aceptación no falsificables, sesiones, acceso a fotos, SVG camuflado, propiedad de publicaciones, chat privado, moderación, reinicio y fuerza bruta. Ejecutar también `npm run typecheck`, `npm run build` y `npm audit`.

Al revisar las dependencias, Next.js 15.5.28 y sharp 0.35.5 ya incluyen las correcciones descritas en el [aviso oficial del 14 de octubre de 2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026). No se hace una migración de framework innecesaria. El resultado de npm audit solo representa los avisos conocidos en el momento de ejecución, no una garantía de ausencia de fallos.

## Límites y tareas del responsable

- El correo no se confirma y no hay SSO ni MFA. Conocer un dominio universitario no acredita identidad o pertenencia institucional.
- Las cuentas demo son públicas y su contraseña es conocida. No usarlas con datos personales reales; deshabilitar el uso de la demo si el servicio deja de ser una presentación.
- Los límites en memoria se reinician con el proceso y están diseñados para una instancia. No sustituyen protección perimetral frente a ataques distribuidos ni un sistema de monitorización.
- El equipo debe revisar los reportes, aplicar las solicitudes de derechos y definir plazos operativos de conservación y respaldo. La plataforma no elimina cuentas ni resuelve controversias automáticamente.
- No se afirma cumplimiento integral de la Ley 29733. Deben revisarse identidad/domicilio del responsable, registro del banco de datos y garantías/comunicación de alojamiento internacional. Referencia: [Reglamento aprobado por DS 016-2024-JUS](https://www.congreso.gob.pe/Docs/DGP/DIDP/files/ds_016-2024-jus.pdf).
- Los usuarios anteriores no reciben constancia retroactiva. Si el responsable necesita una nueva autorización para ellos, debe solicitarla expresamente antes del nuevo tratamiento; no basta con actualizar la base.
- La disponibilidad depende del laboratorio AWS Academy. Mantener respaldos fuera del laboratorio y evitar Reset o eliminación de volúmenes sin copia.

Referencias técnicas: [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) y [OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Ampliación: gestión de usuarios

El panel `/admin/usuarios` selecciona solo datos necesarios para gestionar el acceso; no envía hashes ni sesiones al navegador. Su página y la acción de cambio de estado exigen rol ADMIN activo en el servidor. No permite bloquear al administrador ni a otras cuentas ADMIN. Deshabilitar y reactivar revocan sesiones; el login vuelve a comprobar el estado dentro de la transacción que crea la sesión. Los acuerdos aceptados se conservan y no se cancelan de forma silenciosa.

Las publicaciones de cuentas deshabilitadas no se muestran en catálogo, tablón, favoritos o perfil comunitario. Las fotos de un acuerdo histórico siguen disponibles para el participante activo, pero no para usuarios ajenos. No se pueden aceptar nuevas propuestas con cuentas deshabilitadas.

Por indicación del usuario no se ejecutaron pruebas para esta ampliación. Las cifras de pruebas de la revisión anterior no certifican estas funcionalidades nuevas.
