# Intranet Hospitalaria

Repositorio interno del hospital para publicar y consultar videos de tutoriales, documentos y
formatos de calidad, con control de acceso por roles.

## Stack

- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Auth**: JWT (access + refresh) con roles `admin`, `editor`, `lector`
- **Archivos**: disco local con streaming de video (HTTP Range)

## Roles

| Rol | Permisos |
|-----|----------|
| `admin` | Todo: usuarios, categorías, publicar y gestionar contenido |
| `editor` | Publicar, editar y eliminar contenido propio |
| `lector` | Ver la biblioteca, reproducir videos y descargar documentos |

## Estructura

```
backend/            API NestJS
frontend/           SPA React
specs/              Especificación (Spec Kit)
docker-compose.yml  Despliegue on-premise
scripts/backup.sh   Respaldo de BD + archivos
```

## Desarrollo local

Requisitos: Node.js ≥ 20, PostgreSQL local.

```bash
# 1. Crear la base de datos
createdb intranet

# 2. Backend
cd backend
npm install
cp .env.example .env      # ajustar DATABASE_*, JWT_*
npm run seed              # crea admin y categorías por defecto
npm run start:dev         # http://localhost:3000/api

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Credenciales iniciales: `admin` / `admin123` (cámbialas tras el primer acceso).

## Verificación

```bash
cd backend  && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run build
```

## Despliegue (Linux on-premise)

```bash
# Configurar secretos
export JWT_ACCESS_SECRET=...
export JWT_REFRESH_SECRET=...
export SEED_ADMIN_PASSWORD=...

docker compose up -d --build
```

- Frontend + proxy en el puerto `80`.
- `postgres` (volumen `pgdata`) y `backend` (volumen `uploads`) son persistentes.
- El backend ejecuta el seed (idempotente) antes de arrancar.

### Backups

```bash
./scripts/backup.sh
```

Genera en `backups/` un volcado de PostgreSQL (`db-*.sql`) y un tarball de los archivos
(`uploads-*.tar.gz`), conservando los últimos 7 días.

### Restaurar

```bash
docker compose exec -T postgres psql -U intranet intranet < backups/db-YYYYMMDD-HHMMSS.sql
docker compose exec -T backend tar -C /data -xzf - < backups/uploads-YYYYMMDD-HHMMSS.tar.gz
```

## Notas de seguridad

- Las contraseñas se almacenan con bcrypt.
- Los archivos solo se sirven mediante endpoints autenticados.
- Cambia los secretos JWT y la contraseña del admin antes de producción.
- En producción, tras el primer arranque, define `DB_SYNCHRONIZE=false` y gestiona el esquema
  con migraciones de TypeORM.
