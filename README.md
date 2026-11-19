# kgm-api

API del sistema de expediente estudiantil KGM, construida con **NestJS 12**, **Prisma 7** y **PostgreSQL 16**.

## Requisitos

- Node.js 22 o superior
- Docker Desktop (para la base de datos y el stack completo)

## Variables de entorno

Create a local `.env` file and keep it out of version control.

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Credenciales de PostgreSQL | `kgm` / `kgm` / `kgm` |
| `POSTGRES_PORT` | Puerto del host para PostgreSQL | `5432` |
| `API_PORT` | Puerto del host para la API | `3000` |
| `APP_PORT` | Puerto del host para el frontend `kgm-app` | `5173` |
| `ADMINER_PORT` | Puerto del host para Adminer | `8081` |
| `ESCUELA_ID` | Escuela seleccionada por el front mientras no haya autenticación | `1` |
| `PORT` | Puerto interno de NestJS (solo ejecución local) | `3000` |
| `DATABASE_URL` | Cadena de conexión de Prisma (solo ejecución local) | `postgresql://kgm:kgm@localhost:5432/kgm?schema=public` |
| `JWT_SECRET` | Secreto aleatorio de al menos 32 bytes para firmar sesiones | Obligatorio |
| `ADMIN_BOOTSTRAP_SECRET` | Secreto temporal de al menos 32 bytes para aprovisionar el primer administrador de una escuela | Obligatorio solo durante el bootstrap |
| `CORS_ORIGINS` | Orígenes web permitidos, separados por coma | En desarrollo: `http://localhost:5173`; en producción: configurar explícitamente |
| `NODE_ENV` | Entorno de ejecución | En producción debe ser `production` |

> Si el puerto `5432` ya está ocupado por un PostgreSQL local, define `POSTGRES_PORT=5433` y ajusta `DATABASE_URL` al mismo puerto.

Genera secretos distintos para cada instalación; no reutilices valores de ejemplo ni los incluyas en Git:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Guarda una salida como `JWT_SECRET` y otra como `ADMIN_BOOTSTRAP_SECRET` en el gestor de secretos del despliegue (o en `.env` local, ignorado por Git). La API no inicia si falta `JWT_SECRET` o si tiene menos de 32 bytes.

## Stack completo en Docker

```bash
docker compose up -d --build
```

| Servicio | URL |
| --- | --- |
| API | http://localhost:3000 |
| Healthcheck | http://localhost:3000/health |
| Adminer | http://localhost:8081 |
| Frontend (`kgm-app`) | http://localhost:5173 |

En Adminer usa: sistema `PostgreSQL`, servidor `db`, usuario `kgm`, contraseña `kgm`, base `kgm`.

Las migraciones de Prisma se aplican automáticamente al iniciar el servicio `api`. Para recrear la base desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

> `docker compose down -v` elimina permanentemente los datos de la base y las fotos locales. No lo uses para aplicar cambios de esquema.

### HU 4.2: crear usuarios y preparar el primer administrador

La API ofrece estos endpoints:

- `POST /auth/login`: acepta `email` y `password`; devuelve un bearer token válido durante 15 minutos.
- `GET /usuarios/opciones?rol=DOCENTE|TUTOR`: requiere `Authorization: Bearer <token>` de un administrador. Devuelve únicamente perfiles de la misma escuela, activos (para docentes), con correo y todavía sin usuario vinculado.
- `POST /usuarios`: requiere sesión de administrador. Para `DOCENTE` y `TUTOR`, recibe JSON con `rol`, `perfilId` y `password`; para `ADMINISTRADOR`, recibe multipart con `rol`, `nombre`, `email`, `telefono`, `password` y una foto opcional.
- `POST /auth/bootstrap-admin`: ruta operativa, protegida por `x-admin-bootstrap-secret`, para crear el primer administrador de una escuela. Solo funciona cuando esa escuela todavía no tiene un usuario con rol de administrador.

El bootstrap **no se hace desde el navegador**. Configura temporalmente `ADMIN_BOOTSTRAP_SECRET` en el servidor y envía la solicitud desde un entorno confiable; no guardes el secreto en el front, en scripts versionados ni en el historial del shell. Por ejemplo, desde PowerShell, usa `Read-Host -AsSecureString` para pedir el secreto y la contraseña inicial, forma un objeto JSON en memoria y llama `Invoke-RestMethod` a `http://localhost:3000/auth/bootstrap-admin` con `x-admin-bootstrap-secret`. El cuerpo requiere `escuelaId`, `nombre`, `email` y `password`. Al terminar, quita `ADMIN_BOOTSTRAP_SECRET` del despliegue y reinicia la API. El administrador recién creado inicia sesión en **Usuarios > Creación de usuarios**.

Las contraseñas nuevas deben tener entre 12 y 128 caracteres; la API las guarda con scrypt y nunca las devuelve. El correo se normaliza a minúsculas y un índice único insensible a mayúsculas impide duplicados globales, incluso en solicitudes concurrentes. La vinculación del usuario con el docente/tutor ocurre en la misma transacción; si el perfil ya tiene acceso, el alta se rechaza sin duplicarlo. Las fotos de administradores se validan por tipo/contenido y se guardan en el volumen persistente de uploads.

En producción, configura `CORS_ORIGINS` con el origen HTTPS exacto del front, `NODE_ENV=production`, HTTPS en el proxy/ingress y limitación de solicitudes para login/bootstrap en el ingress. El bootstrap es una operación excepcional: no mantengas su secreto configurado después de aprovisionar al administrador.

**Alcance de permisos:** los endpoints `/usuarios` sí exigen JWT y rol `ADMINISTRADOR`, y la escuela se obtiene del token, nunca de un ID enviado por el navegador. Los demás módulos heredados de la API aún no tienen guards de autenticación; esta implementación no debe interpretarse como una autorización global de toda la plataforma. Antes de abrir esos módulos con datos reales, habrá que proteger sus endpoints con las políticas de cada rol.

## Migraciones

Las bases existentes se inicializaron con `initial_schema.sql` y no tienen historial de Prisma. Antes de desplegar una nueva migración en esa base, marca como aplicadas las migraciones que ya están representadas por el esquema actual y despliega solo las pendientes:

```bash
docker compose exec api npx prisma migrate resolve --applied 0_init
docker compose exec api npx prisma migrate resolve --applied 20261105_hu14_campos_edicion_alumno
docker compose exec api npx prisma migrate deploy
```

La migración `20261105_hu24_docentes` agrega los datos de contacto y foto de Docente y reemplaza la unicidad global de CURP por unicidad dentro de cada escuela. Sus campos nuevos son nullable para conservar compatibilidad con docentes existentes.

En una instalación nueva, `initial_schema.sql` ya crea esos campos e índices. En ese caso, también se debe marcar el esquema inicial y la migración HU-1.4 como aplicados antes de `migrate deploy`, para que Prisma no intente volver a crear las tablas.

Los módulos heredados del frontend aún envían `ESCUELA_ID` como configuración de desarrollo. Crea una escuela de prueba en Adminer antes de registrar docentes:

```sql
INSERT INTO public.escuela (nombre, clave)
SELECT 'Escuela de desarrollo', 'DEV-001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.escuela WHERE clave = 'DEV-001'
);
```

Configura `ESCUELA_ID` con el ID resultante (normalmente `1` en una base vacía). Para `/usuarios`, la escuela se toma del token autenticado y no se acepta del navegador.

Las fotos JPG, PNG y WebP de hasta 2 MB se guardan en el volumen Docker `kgm-api-uploads` y se sirven desde `/uploads`. La base guarda la ruta relativa del archivo.

## Datos de desarrollo

La seed crea o actualiza datos de demostración para la escuela `DEV-001`: ciclos, grados, grupos, materias, docentes, alumnos, tutores, inscripciones, asignaciones académicas, expedientes, calificaciones de dos bimestres y el usuario administrador de demostración documentado más abajo. No elimina registros; al repetirla se restablece la contraseña de ese administrador para que las credenciales documentadas sigan funcionando.

Con el stack levantado y el esquema actualizado, ejecútala manualmente:

```bash
docker compose exec api npm run prisma:seed
```

También se puede usar `npx prisma db seed`. La seed es idempotente: volver a correrla actualiza sus registros identificados para desarrollo en vez de duplicarlos. No la ejecutes contra una base con datos reales; es exclusivamente para desarrollo y demostración.
Si ya tienes un volumen creado con el antiguo `initial_schema.sql`, elimínalo con `docker compose down -v` o marca las migraciones existentes como aplicadas con `npx prisma migrate resolve` antes de desplegar.

## Desarrollo local

```bash
# 1. Base de datos
docker compose up -d db

# 2. Dependencias (el postinstall genera el cliente de Prisma)
npm ci

# 3. Aplicar migraciones pendientes
npm run prisma:deploy

# 4. API con recarga en caliente
npm run start:dev
```

## Prisma

El esquema vive en `prisma/schema.prisma` y es la fuente de verdad. Los cambios se versionan como migraciones en `prisma/migrations`, que se aplican al iniciar el contenedor `api` o manualmente con `npm run prisma:deploy`. El cliente se genera en `src/generated/prisma` y no se versiona.

```bash
npm run prisma:generate   # regenera el cliente
npm run prisma:migrate    # crea y aplica una migración en desarrollo
npm run prisma:deploy     # aplica migraciones pendientes
npm run prisma:studio     # abre Prisma Studio
```

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run start:dev` | API en modo watch |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main.js` |
| `npm run lint` | oxlint con tipos |
| `npm run format` | Prettier |
| `npm test` | Tests unitarios |
| `npm run test:e2e` | Tests e2e (requieren base de datos) |

## Estructura

```
src/
  app.module.ts          # módulo raíz
  main.ts                # bootstrap, CORS y ValidationPipe
  health/                # GET /health (incluye ping a la base)
  prisma/                # PrismaService y PrismaModule (global)
  auth/                  # inicio de sesión, JWT, contraseñas y bootstrap de administrador
  usuarios/              # opciones de perfiles y alta protegida por rol
  docentes/              # registro, consulta y actualización de docentes
    dto/
  generated/prisma/      # cliente generado (ignorado por git)
prisma/
  schema.prisma          # modelos y fuente de verdad del esquema
  migrations/            # migraciones versionadas
```

## Notas

- Las migraciones activan RLS en las tablas, pero no hay políticas definidas. La API se conecta como dueño de las tablas (`kgm`), por lo que RLS no aplica; si se requiere aislamiento por escuela hay que añadir políticas y un rol sin privilegios de dueño.
- Las migraciones incluyen los `check` de `Calificacion.valor` y `Usuario.rol`, pero Prisma no los valida en el cliente: valida en los DTO con `class-validator`.

## Resumen de cambios: HU 4.2

- Se agregó autenticación con JWT y contraseñas almacenadas con scrypt.
- El alta de usuarios y la consulta de perfiles requieren un administrador autenticado; el correo duplicado se rechaza y el perfil docente/tutor queda vinculado a su cuenta.
- El frontend permite iniciar sesión, seleccionar el rol y perfil, registrar usuarios y mostrar confirmaciones o errores.
- La migración `20261117142000_hu42_usuarios` agrega la foto de administrador y la restricción de correo única sin distinguir mayúsculas. Se aplica automáticamente al iniciar la API.

### Cuenta local de prueba

- Nombre: Leonardo Flores Leyva
- Correo: `leonardo.flores.leyva@kgm-demo.test` (dominio reservado para pruebas; no recibe correo)
- Rol: `ADMINISTRADOR`, escuela `DEV-001` (normalmente id `1` en una base vacía)
- Contraseña: `Tigre-Planeta-23711174!`

Esta misma cuenta es la que crea o actualiza la seed en `DEV-001`, así que QA puede iniciar sesión sin pasar por el bootstrap.

### Ejecutar el proyecto local

Desde la carpeta `kgm-api`, crea o conserva un `.env` local ignorado por Git con `JWT_SECRET` de al menos 32 bytes. Después levanta todo el stack:

```powershell
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:3000/health
```

Abre el frontend en `http://localhost:5173`. Si necesitas datos de demostración para elegir docentes o tutores, ejecuta la seed opcional:

```powershell
docker compose exec api npm run prisma:seed
```

La seed sí crea o actualiza la cuenta local de demostración. El volumen conserva los datos al detener o reiniciar Docker; `docker compose down -v` elimina permanentemente la base y esa cuenta, pero volver a ejecutar la seed la recrea.

## HU 2.5: asignación de alumnos

Cada alumno puede tener como máximo una asignación activa, sin importar el ciclo escolar. La API responde `409 Conflict` si se intenta asignarlo de nuevo, y un índice único parcial en PostgreSQL protege también contra solicitudes simultáneas. La migración conserva las filas existentes como historial: si había varias activas, mantiene activa la más reciente y marca las anteriores como inactivas. Para volver a asignar al alumno, primero debe cerrarse su asignación activa.
