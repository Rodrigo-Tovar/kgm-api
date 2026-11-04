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

El esquema de `initial_schema.sql` se carga solo la primera vez que se crea el volumen. Para recrear la base desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

## Desarrollo local

```bash
# 1. Base de datos
docker compose up -d db

# 2. Dependencias (el postinstall genera el cliente de Prisma)
npm ci

# 3. API con recarga en caliente
npm run start:dev
```

## Prisma

El esquema vive en `prisma/schema.prisma` y se obtuvo por introspección de `initial_schema.sql` (la base es la fuente de verdad, no se usan migraciones de Prisma). El cliente se genera en `src/generated/prisma` y no se versiona.

```bash
npm run prisma:generate   # regenera el cliente
npm run prisma:pull       # reintrospecta la base (requiere que esté arriba)
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
  generated/prisma/      # cliente generado (ignorado por git)
prisma/
  schema.prisma          # modelos introspeccionados
initial_schema.sql       # esquema inicial de PostgreSQL
```

## Notas

- Las tablas tienen RLS activado en `initial_schema.sql`, pero no hay políticas definidas. La API se conecta como dueño de las tablas (`kgm`), por lo que RLS no aplica; si se requiere aislamiento por escuela hay que añadir políticas y un rol sin privilegios de dueño.
- Los `check` de `Calificacion.valor` y `Usuario.rol` existen en la base de datos, pero Prisma no los valida en el cliente: valida en los DTO con `class-validator`.
