# kgm-api-spring

## Requisitos

- JDK 21 o superior
- No es necesario instalar Maven: usa el wrapper incluido (`mvnw` / `mvnw.cmd`)

## Comandos

```bash
# Compilar y ejecutar pruebas
./mvnw verify          # Windows: mvnw.cmd verify

# Ejecutar la aplicación (http://localhost:8080)
# Requiere PostgreSQL local: `docker compose up -d db` o el stack completo
./mvnw spring-boot:run

# Healthcheck
curl http://localhost:8080/actuator/health
```

## Ambiente local con Docker

Levanta PostgreSQL local (con el esquema de `initial_schema.sql`), Adminer, la API y el frontend `kgm-app`:

```bash
docker compose up -d --build
```

| Servicio | URL |
| --- | --- |
| Frontend (kgm-app) | http://localhost:5173 |
| API (kgm-api) | http://localhost:8080 |
| Healthcheck | http://localhost:8080/actuator/health |
| Adminer | http://localhost:8081 |

En Adminer usa: sistema `PostgreSQL`, servidor `db`, usuario `kgm`, contraseña `kgm`, base `kgm`.

Los puertos y credenciales se personalizan creando un `.env` a partir de `.env.example`.

### Notas

- El esquema se carga solo la primera vez que se crea el volumen de la base. Para recrearla desde cero: `docker compose down -v`.
- La API y el frontend corren en modo desarrollo con recarga en caliente (el código fuente se monta como volumen).
- El usuario de PostgreSQL es dueño de las tablas, por lo que RLS no le aplica (útil en desarrollo local).

API en springboot para el proyecto kgm
