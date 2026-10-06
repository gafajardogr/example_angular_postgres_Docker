# Clave
<img width="1294" height="872" alt="Captura de pantalla 2026-10-06 113511" src="https://github.com/user-attachments/assets/fcc1dda5-d99b-4557-bcb8-1ad863b38284" />

Gestor privado de credenciales con Angular, Fastify y PostgreSQL. Configura una llave maestra, inicia sesión y administra accesos con campos personalizados.

## Arquitectura

| Parte | Función |
| --- | --- |
| `apps/web` | Interfaz Angular standalone: acceso, búsqueda y edición de credenciales. |
| `apps/api` | API REST Fastify con autenticación JWT, validación y consultas parametrizadas. |
| `database/schema.sql` | Tablas e índices de PostgreSQL. |
| `docker-compose.yml` | PostgreSQL 17 con volumen persistente e inicialización del esquema. |

El frontend corre en `127.0.0.1:4200`, el API en `127.0.0.1:3000` y PostgreSQL se publica en `127.0.0.1:5433` para no interferir con una instalación local que use `5432`.

## Requisitos

- Node.js 20.19 o posterior y npm.
- Docker Desktop con Docker Compose, o PostgreSQL 15 o posterior.

## Instalación y configuración

Desde PowerShell, en la raíz del proyecto:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
```

El `.env.example` raíz trae valores de desarrollo para Docker. `POSTGRES_PASSWORD` debe coincidir con la contraseña de `DATABASE_URL`. Reemplaza `JWT_SECRET` por un secreto aleatorio de al menos 32 bytes:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Si ya existe `.env`, consérvalo y verifica que incluya `DATABASE_URL` y `JWT_SECRET`. El API carga `apps/api/.env` si existe; si no, carga el `.env` raíz. Si usas `apps/api/.env`, mantén la contraseña de su URL sincronizada con `POSTGRES_PASSWORD` del archivo raíz. Los `.env` están excluidos de Git.

## Puesta en marcha

Con Docker, inicia PostgreSQL y luego la aplicación:

```powershell
npm run db:up
npm run dev
```

Abre <http://127.0.0.1:4200>. En el primer acceso crea una llave maestra de al menos 12 caracteres; después aparecerá el administrador de credenciales. La API está en <http://127.0.0.1:3000> y su comprobación de salud en `/api/health`.

Compose ejecuta `database/schema.sql` automáticamente solo al crear el volumen por primera vez. Si usas PostgreSQL existente, configura su URL en `DATABASE_URL`, aplica el esquema manualmente y omite `npm run db:up`.

Para detener los procesos, pulsa `Ctrl+C` en la terminal de `npm run dev` y ejecuta `npm run db:down`. Esto conserva los datos; no uses `docker compose down -v` salvo que quieras borrar también el volumen.

## Seguridad

La llave maestra se almacena como hash bcrypt. **Las contraseñas de servicios se guardan en texto plano en PostgreSQL**, no cifradas. No uses credenciales reales en producción con esta configuración. Antes de desplegar, cifra los secretos en reposo con una clave externa a la base, protege copias y discos, habilita TLS y define rotación y recuperación.

El JWT dura 15 minutos y se guarda en `sessionStorage`; XSS podría robarlo mientras la sesión esté activa. El limitador de intentos está en memoria por proceso. No existe recuperación automática de la llave maestra.

## Compilación

```powershell
npm run build
```

También puedes compilar por separado con `npm run build:api` y `npm run build:web`.
