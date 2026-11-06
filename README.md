# kgm-api

API del sistema de expediente estudiantil KGM, construida con **NestJS 12**, **Prisma 7** y **PostgreSQL 16**.

## Requisitos

- Node.js 22 o superior
- Docker Desktop (para la base de datos y el stack completo)

## Variables de entorno

```bash
cp .env.example .env
```

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

> Si el puerto `5432` ya está ocupado por un PostgreSQL local, define `POSTGRES_PORT=5433` y ajusta `DATABASE_URL` al mismo puerto.

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

## Migraciones

Las bases existentes se inicializaron con `initial_schema.sql` y no tienen historial de Prisma. Antes de desplegar una nueva migración en esa base, marca como aplicadas las migraciones que ya están representadas por el esquema actual y despliega solo las pendientes:

```bash
docker compose exec api npx prisma migrate resolve --applied 0_init
docker compose exec api npx prisma migrate resolve --applied 20261105_hu14_campos_edicion_alumno
docker compose exec api npx prisma migrate deploy
```

La migración `20261105_hu24_docentes` agrega los datos de contacto y foto de Docente y reemplaza la unicidad global de CURP por unicidad dentro de cada escuela. Sus campos nuevos son nullable para conservar compatibilidad con docentes existentes.

En una instalación nueva, `initial_schema.sql` ya crea esos campos e índices. En ese caso, también se debe marcar el esquema inicial y la migración HU-1.4 como aplicados antes de `migrate deploy`, para que Prisma no intente volver a crear las tablas.

Mientras no exista autenticación, el frontend envía `ESCUELA_ID` como configuración de desarrollo. Crea una escuela de prueba en Adminer antes de registrar docentes:

```sql
INSERT INTO public.escuela (nombre, clave)
SELECT 'Escuela de desarrollo', 'DEV-001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.escuela WHERE clave = 'DEV-001'
);
```

Configura `ESCUELA_ID` con el ID resultante (normalmente `1` en una base vacía). Este mecanismo es solo para desarrollo; en producción el backend debe tomar la escuela de la identidad autenticada, no confiar en un ID enviado por el navegador.

Las fotos JPG, PNG y WebP de hasta 2 MB se guardan en el volumen Docker `kgm-api-uploads` y se sirven desde `/uploads`. La base guarda la ruta relativa del archivo.

## Datos de desarrollo

La seed crea o actualiza datos de demostración para la escuela `DEV-001`: ciclos, grados, grupos, materias, docentes, alumnos, tutores, inscripciones, asignaciones académicas, expedientes y calificaciones de dos bimestres. No crea usuarios ni contraseñas y no elimina registros.

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
