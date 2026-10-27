# EcoMarket PUCP

Aplicación de trueques y donaciones entre estudiantes, **sin pagos, precios, comisiones ni dinero de por medio**. Proyecto independiente de MarketLite, inspirado en el [prototipo de Figma proporcionado](https://www.figma.com/make/qZEHSOGYEOhcxYQ7pYgViC/EcoMarket-PUCP-App--Copy-).

Una sola aplicación: Next.js + React + TypeScript + Tailwind/CSS, Prisma, SQLite e imágenes locales. Docker incluye Node, dependencias, migraciones y servidor. Funciona en Linux ARM64 y AMD64, sin servicios cloud obligatorios.

## Qué funciona

- Registro e ingreso con correo `@pucp.edu.pe` y contraseña, mostrar/ocultar contraseña, perfil editable y cierre de sesión.
- Catálogo con búsqueda, facultad, categoría, trueque/donación, orden y paginación de 12 materiales.
- Publicar, editar, archivar y volver a publicar materiales. Hasta 5 fotos por publicación.
- Fotos JPG, PNG o WebP de hasta 5 MB: se validan, orientan y convierten a WebP. HEIC se rechaza con un mensaje claro; conviértelo a JPG primero.
- Favoritos y perfiles de estudiantes con sus materiales y valoraciones reales.
- Tablón de pedidos, respuestas con un material propio y cierre de pedidos. Las respuestas solo son visibles para quien hizo el pedido y quien respondió.
- Propuestas de trueque con un material a cambio; solicitudes de donación sin contraprestación.
- Aceptar/rechazar/cancelar, reservar los materiales, conversación privada, lugar y hora de encuentro y confirmación de ambas personas.
- Valoraciones una vez por participante, después de completar la entrega.
- Reportes de publicaciones/conducta y panel de moderación para un administrador.
- Contadores calculados de la base de datos, no cifras ambientales inventadas.

**Es un prototipo estudiantil, no un servicio oficial de PUCP.** Se valida el formato del correo, pero no su titularidad. No hay SSO institucional, envío de correos, recuperación por email ni verificación oficial de identidad. No se anuncian usuarios como “verificados”. Para abrirlo a una comunidad real, hace falta acordar la verificación de estudiantes y quién atiende los reportes.

## Arranque rápido con Docker

Requisitos: Git, Docker Engine y Docker Compose v2. No necesitas instalar Node ni SQLite en la VM.

```bash
git clone https://github.com/luis-taquiri/EcoMarketPUCP.git
cd EcoMarketPUCP
cp .env.example .env
docker compose up -d --build
docker compose ps
```

En Windows, usa `Copy-Item .env.example .env` en lugar de `cp`. En Ubuntu, ante un error de permisos con Docker, usa `sudo docker compose ...`.

Abre **http://localhost:3200** y crea una cuenta desde “Crea tu cuenta”. La primera construcción necesita internet para descargar dependencias; la aplicación no necesita servicios externos durante su uso normal.

El contenedor aplica las migraciones al arrancar. **No borra datos ni sobrescribe usuarios.** Si una migración falla, el arranque se detiene y deja el error en el log, sin ignorarlo ni reiniciar la base.

```bash
docker compose logs --tail=100 ecomarket
docker compose logs -f ecomarket
```

## Configuración

Edita `.env`. Este archivo no se sube a GitHub.

| Variable         | Para qué sirve                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `APP_URL`        | Origen exacto donde abrirás la web, sin ruta. En producción, `https://ecomarket.mcserverzcra.co.uk`. |
| `COOKIE_SECURE`  | `false` para HTTP local; **`true` al publicar con HTTPS**.                                           |
| `HOST_PORT`      | Puerto local del servidor: `3200`. MarketLite puede seguir en `3000`.                                |
| `SEED_DEMO`      | `false` por defecto. `true` carga la demo solo cuando no existe ningún usuario.                      |
| `ADMIN_EMAIL`    | Correo `@pucp.edu.pe` para crear una cuenta administradora inicial, opcional.                        |
| `ADMIN_PASSWORD` | Contraseña propia de 12 a 72 caracteres para ese administrador.                                      |
| `DATABASE_URL`   | Solo desarrollo local. Compose establece `file:/app/data/prod.db` dentro del contenedor.             |
| `UPLOAD_DIR`     | Solo desarrollo local. Compose establece `/app/uploads`.                                             |

`APP_URL` también se usa para rechazar solicitudes de escritura originadas desde otra web. Si cambias el puerto, ajusta `APP_URL`. No abras el puerto del contenedor a internet: Compose lo publica únicamente en `127.0.0.1`.

## Datos de demostración

En una base vacía:

```bash
docker compose exec ecomarket npm run db:seed
```

O configura `SEED_DEMO=true` **antes del primer arranque**. El seed crea 6 estudiantes, 6 materiales, 4 pedidos y una propuesta pendiente para Mariana. Si ya hay usuarios, no modifica nada. No uses estas cuentas conocidas en una instalación pública.

| Usuario demo                 | Contraseña       |
| ---------------------------- | ---------------- |
| `mariana.demo@pucp.edu.pe`   | `EcoCampus2026!` |
| `valeria.demo@pucp.edu.pe`   | `EcoCampus2026!` |
| `diego.demo@pucp.edu.pe`     | `EcoCampus2026!` |
| `lucia.demo@pucp.edu.pe`     | `EcoCampus2026!` |
| `alejandro.demo@pucp.edu.pe` | `EcoCampus2026!` |
| `marco.demo@pucp.edu.pe`     | `EcoCampus2026!` |

Para probar un trueque: entra como Mariana, acepta la propuesta de Valeria en **Mis Solicitudes**, propón el encuentro y confirma la entrega. En otro navegador entra como Valeria y confirma también. Solo entonces aparecerá como completado y permitirá valorar. Los datos son ficticios.

## Administrador

Configura `ADMIN_EMAIL` y `ADMIN_PASSWORD` con valores propios en `.env` y ejecuta:

```bash
docker compose up -d
```

Al iniciar, se crea el administrador si ese correo no existe. **No se cambia la contraseña ni se asciende a un usuario existente automáticamente.** Utiliza una dirección distinta de las cuentas ya registradas. Después de comprobar el acceso, puedes quitar la contraseña de `.env` y ejecutar otra vez `docker compose up -d`; la cuenta queda en SQLite.

El administrador ve **Moderación** en la navegación. Puede revisar reportes y archivar publicaciones disponibles; no accede a conversaciones privadas. No se archiva un material reservado o entregado para evitar romper acuerdos.

Para restablecer una contraseña desde la VM, usa el script local e interactivo:

```bash
docker compose exec ecomarket node scripts/reset-password.mjs
```

Pide correo y contraseña por terminal, no los coloca en el historial de comandos. Invalida las sesiones del usuario. No permite ver contraseñas originales, que se guardan con bcrypt.

## Publicar junto a MarketLite en la VM ARM64

No reemplaces las carpetas, el dominio ni el contenedor de MarketLite. Usa `/opt/ecomarket-pucp/EcoMarketPUCP` y un subdominio separado, por ejemplo **ecomarket.mcserverzcra.co.uk**.

1. En el DNS de `mcserverzcra.co.uk`, crea un registro **A**, host **ecomarket**, dirección **165.1.121.30**. No modifiques los registros de MarketLite ni clientes.pe.
2. Clona el repositorio en la carpeta nueva y crea `.env`. Establece `APP_URL=https://ecomarket.mcserverzcra.co.uk`, `COOKIE_SECURE=true`, `HOST_PORT=3200` y tus datos de administrador si lo necesitas. Mantén `SEED_DEMO=false` para la instalación real.
3. Ejecuta `sudo docker compose up -d --build`. En ARM64, Docker descarga Node ARM64 y genera Prisma en esa arquitectura automáticamente. No copies `node_modules` desde Windows.
4. Comprueba `curl http://127.0.0.1:3200/api/health`. Debe responder `{"ok":true}`.
5. Crea `/etc/apache2/sites-available/ecomarket.conf` con este contenido:

```apache
<VirtualHost *:80>
    ServerName ecomarket.mcserverzcra.co.uk
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3200/
    ProxyPassReverse / http://127.0.0.1:3200/
    LimitRequestBody 6291456
    ErrorLog ${APACHE_LOG_DIR}/ecomarket_error.log
    CustomLog ${APACHE_LOG_DIR}/ecomarket_access.log combined
</VirtualHost>
```

6. Activa **solo** este nuevo sitio; no deshabilites los existentes:

```bash
sudo a2enmod proxy proxy_http headers ssl
sudo a2ensite ecomarket.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

7. Con el DNS ya propagado y los puertos 80/443 accesibles, instala Certbot si no lo tienes y crea el certificado:

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d ecomarket.mcserverzcra.co.uk
```

Selecciona redirigir HTTP a HTTPS. En el VirtualHost `*:443` generado, conserva `ProxyPreserveHost`, `ProxyPass` y `ProxyPassReverse` y agrega `RequestHeader set X-Forwarded-Proto "https"`. Verifica con `sudo apache2ctl configtest` y recarga Apache.

8. Abre **https://ecomarket.mcserverzcra.co.uk**. El puerto 3200 se queda privado. Las imágenes se sirven por la app desde `/uploads/`; **no necesitas Alias de Apache ni permisos sobre `/var/lib/docker`**.

El repositorio no configura DNS, certificados ni la VM automáticamente. Esos pasos se realizan en tu cuenta y servidor.

## Persistencia y actualizaciones

Los datos e imágenes están en volúmenes distintos de MarketLite:

- `ecomarket-pucp_ecomarket_data`: SQLite y archivos WAL.
- `ecomarket-pucp_ecomarket_uploads`: imágenes.

```bash
git pull
docker compose up -d --build
```

Esto reconstruye la aplicación conservando los volúmenes. No ejecutes `docker compose down -v` ni borres los volúmenes si quieres conservar datos. `docker compose down` sin `-v` conserva los datos.

Copia de respaldo simple y consistente, deteniendo un momento solo EcoMarket:

```bash
mkdir -p backups
docker compose stop ecomarket
docker compose cp ecomarket:/app/data ./backups/data
docker compose cp ecomarket:/app/uploads ./backups/uploads
docker compose start ecomarket
```

Usa una carpeta nueva para cada respaldo. No publiques copias de la BD ni imágenes privadas en GitHub. Conserva ambos directorios juntos.

## Desarrollo sin Docker

Node 22, npm y Git:

```bash
npm ci
cp .env.example .env
npx prisma generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abre http://127.0.0.1:3200. El servidor acepta `localhost` y el origen configurado en `APP_URL`. Si Docker ya ocupa el puerto 3200, detén solo EcoMarket o usa `npx next dev --hostname 127.0.0.1 --port 3201` y ajusta `APP_URL`.

Para nuevas migraciones durante desarrollo: `npx prisma migrate dev --name nombre_del_cambio`. En producción se usa únicamente `npm run db:migrate`, nunca `migrate reset` ni `db push`.

Compilación local de producción:

```bash
npm run build
npm start
```

`npm start` escucha en el puerto 3000; configura `APP_URL` acorde. Docker conserva el puerto interno 3000 y lo publica en el 3200 de la VM.

## Pruebas

```bash
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

`npm test` comprueba validaciones, permisos, reservas, cancelaciones, doble confirmación, valoración y concurrencia. `test:e2e` arranca el build en un puerto libre y prueba la API real con usuarios, imágenes, publicación, tablón, propuestas, moderación y persistencia tras reinicio. Ambos utilizan una base temporal aislada que eliminan al terminar, no tu base de trabajo.

## Estructura

```text
src/app/(auth)/       Login y registro
src/app/(site)/       Catálogo, tablón, solicitudes, perfil y moderación
src/app/api/          Acciones, carga de imágenes y healthcheck
src/app/uploads/      Lectura de imágenes locales en ejecución
src/components/      Formularios y componentes compartidos
src/lib/             Prisma, sesión, validaciones y reglas del trueque
prisma/              Modelo, migraciones y seed
scripts/             Arranque, administrador y pruebas
tests/               Pruebas de validación y reglas de negocio
```

## Reglas del intercambio

- Proponer no reserva nada. Un trueque requiere un material propio disponible; una donación no.
- Aceptar reserva ambos materiales en una transacción y rechaza otras propuestas pendientes incompatibles.
- Un material reservado o entregado no se puede editar ni archivar.
- Cancelar antes de cualquier confirmación libera las reservas. Las propuestas rechazadas no se reactivan: hay que enviar una nueva.
- Una confirmación mantiene el intercambio aceptado; dos lo completan y marcan los materiales como entregados. Confirmar de nuevo no duplica nada.
- Si una persona ya confirmó, no se permite cancelar automáticamente. Una controversia exige revisión humana; el prototipo no resuelve disputas ni garantiza la entrega física.
- Las preferencias son texto libre, pero **no hay pago, carrito, saldo ni integración de Yape**. Los intentos de venta pueden reportarse.
- Los encuentros usan la hora de Lima, incluso si el navegador está en otro huso horario.

## Alcance

Una instancia de la aplicación y una base SQLite local, no un clúster. El límite práctico depende del disco, RAM, imágenes y concurrencia; no se promete almacenamiento ilimitado. Hay paginación del catálogo, pedidos, solicitudes y publicaciones propias. El chat se actualiza cada 10 segundos mientras la pestaña está visible, sin WebSockets ni servicios externos.

No hay envío de correos, notificaciones push, préstamos, pagos ni cálculo de CO₂. El código es deliberadamente sencillo; antes de una apertura pública amplia se deben reforzar la verificación institucional, prevención de abuso, moderación, política de privacidad y respaldo periódico.

Referencias visuales y licencias: [docs/ASSETS.md](docs/ASSETS.md).
