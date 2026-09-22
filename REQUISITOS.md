# Requisitos para iniciar el sistema

Esta intranet está compuesta por un **backend** (NestJS + TypeORM + PostgreSQL), un **frontend**
(React + Vite + Tailwind) y, opcionalmente, un despliegue con **Docker Compose + Nginx**.

A continuación se listan todos los requisitos necesarios para iniciar el sistema en **desarrollo**
(entorno local) y en **producción**.

## 1. Software requerido

| Requisito | Versión mínima | Recomendada | Obligatorio |
|-----------|----------------|-------------|-------------|
| Node.js   | 20            | 22 LTS o 24 | Sí          |
| npm       | 10            | (incluido con Node) | Sí    |
| PostgreSQL | 14           | 16 o 18     | Sí (desarrollo) |
| Docker + Docker Compose | 24 / 2.x | última | Opcional (producción) |

> **Nota**: para desarrollo se usa PostgreSQL local (p. ej. Postgres.app en macOS o el paquete
> `postgresql` en Linux). Para producción se usa `docker-compose.yml` (Postgres + API + Nginx).

### Verificar versiones

```bash
node --version    # >= v20
npm --version     # >= 10
psql --version    # >= 14
docker --version  # opcional
```

## 2. Puertos

| Servicio   | Puerto | Uso |
|------------|--------|-----|
| Backend API | 3000 | API REST + WebSocket (Socket.IO) |
| Frontend (dev) | 5173 | Vite (con proxy a la API) |
| Nginx (producción) | 80 | Frontend + proxy a la API |

## 3. Base de datos

Debe existir una base de datos PostgreSQL accesible. En desarrollo:

```bash
createdb intranet
```

Los datos de conexión se configuran en `backend/.env` (ver siguiente sección).

## 4. Variables de entorno

### Backend — `backend/.env`

Crear copiando `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno (`development` / `production`) | `development` |
| `PORT` | Puerto de la API | `3000` |
| `DATABASE_HOST` | Host de PostgreSQL | `localhost` |
| `DATABASE_PORT` | Puerto de PostgreSQL | `5432` |
| `DATABASE_USER` | Usuario de la BD | `postgres` |
| `DATABASE_PASSWORD` | Contraseña de la BD | *(vacío en local)* |
| `DATABASE_NAME` | Nombre de la BD | `intranet` |
| `JWT_ACCESS_SECRET` | Secreto del access token (¡cambiar!) | — |
| `JWT_ACCESS_TTL` | Duración del access token | `15m` |
| `JWT_REFRESH_SECRET` | Secreto del refresh token (¡cambiar!) | — |
| `JWT_REFRESH_TTL` | Duración del refresh token | `7d` |
| `UPLOAD_DIR` | Carpeta de archivos (relativa) | `uploads` |
| `MAX_FILE_SIZE_MB` | Tamaño máximo de subida | `2048` |
| `SEED_ADMIN_USERNAME` | Usuario admin inicial | `admin` |
| `SEED_ADMIN_PASSWORD` | Contraseña admin inicial | `admin123` |
| `SEED_ADMIN_FULLNAME` | Nombre del admin | `Administrador` |
| `CORS_ORIGIN` *(opcional)* | Orígenes CORS separados por coma | — |

### Frontend

En desarrollo **no requiere** variables (usa el proxy de Vite hacia `http://localhost:3000/api`).
En producción el frontend se sirve con Nginx, que hace de proxy de `/api` y `/socket.io` hacia el
backend. No se requieren variables de entorno en el frontend.

## 5. Cómo iniciar el sistema

### Opción A — Desarrollo

```bash
# 1. Base de datos
createdb intranet

# 2. Backend
cd backend
npm install
cp .env.example .env       # ajustar DATABASE_* y JWT_*
npm run seed               # crea esquema + admin + categorías
npm run start:dev          # http://localhost:3000/api

# 3. Frontend (otra terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Credenciales iniciales: `admin` / `admin123` (cámbialas tras el primer acceso).

### Opción B — Producción (Docker)

```bash
export JWT_ACCESS_SECRET=...
export JWT_REFRESH_SECRET=...
export SEED_ADMIN_PASSWORD=...
docker compose up -d --build
```

## 6. Instalación automática

Ejecuta `./install.sh`. El script **verifica los requisitos** (Node, npm, PostgreSQL y conexión) y,
solo si se cumplen, instala dependencias, crea la base de datos y ejecuta el seed.

## 7. Verificación

```bash
cd backend  && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run build
```
