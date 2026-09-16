# Quickstart / Validación End-to-End: Intranet de Contenidos Hospitalarios

Guía para levantar el proyecto y validar que la funcionalidad funciona de extremo a extremo.

## Prerrequisitos

- Node.js ≥ 20 y npm.
- PostgreSQL local (Postgres.app en macOS) con base de datos `intranet` creada.
- Variables de entorno configuradas (ver `.env.example` en `backend/`).

## Configuración inicial

```bash
# Backend
cd backend
npm install
cp .env.example .env          # ajustar DATABASE_URL, JWT_SECRET, etc.
npm run migration:run         # crea el esquema
npm run seed                  # crea el admin inicial y las categorías por defecto
npm run start:dev             # levanta la API en http://localhost:3000/api

# Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000/api
npm run dev                   # SPA en http://localhost:5173
```

## Escenarios de validación

1. **Login por rol**: iniciar sesión con el admin seed (ver credenciales en el seed), crear un
   usuario `editor` y uno `lector`; verificar que cada rol solo ve sus funciones.
2. **Publicar contenido**: con `editor`, subir un video MP4 y un PDF desde la pantalla de editor;
   asignar categoría y publicar.
3. **Consumir contenido**: con `lector`, ver el video (reproduce con avance/pausa) y descargar el
   PDF.
4. **Búsqueda y filtros**: buscar una palabra del título y filtrar por categoría/tipo; verificar
   resultados y estado vacío.
5. **Control de acceso**: con `lector`, intentar publicar o acceder a rutas de admin → debe ser
   bloqueado (API 403 y UI oculta).

## Comandos de verificación

```bash
# Backend
cd backend && npm run lint && npm run typecheck && npm test

# Frontend
cd frontend && npm run lint && npm run typecheck && npm run build
```

## Resultado esperado

Usuario autenticado navega la biblioteca, reproduce videos y descarga documentos; editor publica
contenido; admin gestiona usuarios y categorías; todo acceso no autorizado es rechazado.
