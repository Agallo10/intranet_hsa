# API Contracts: Intranet de Contenidos Hospitalarios

API REST JSON. Base path: `/api`. Autenticación: `Authorization: Bearer <accessToken>`.
Errores: formato uniforme `{ "statusCode", "message", "error" }`.

## Autenticación

### POST /auth/login — `@Public()`
Request: `{ "username": string, "password": string }`
Response 200: `{ "accessToken": string, "refreshToken": string, "user": UserDto }`
Response 401: credenciales inválidas.

### POST /auth/refresh — `@Public()`
Request: `{ "refreshToken": string }`
Response 200: `{ "accessToken": string, "refreshToken": string }`

### GET /auth/me
Response 200: `UserDto` (usuario autenticado actual).

## Usuarios (solo `admin`)

### GET /users?q=&role=&page=&limit=
Listado paginado de usuarios.

### POST /users
Request: `{ "username", "password", "fullName", "role" }` → 201 `UserDto`.

### PATCH /users/:id
Request (parcial): `{ "fullName"?, "role"?, "isActive"?, "password"? }` → 200 `UserDto`.

### DELETE /users/:id (o PATCH isActive=false)
Desactiva un usuario → 204. No se permite autodesactivarse.

## Categorías

### GET /categories (todos los autenticados)
Listado de categorías activas ordenadas. → 200 `CategoryDto[]`.

### POST /categories — `admin`
Request: `{ "name", "description"?, "order"? }` → 201 `CategoryDto`.

### PATCH /categories/:id — `admin`
Request parcial: `{ "name"?, "description"?, "order"?, "isActive"? }` → 200 `CategoryDto`.

## Contenido

### GET /contents?q=&category=&type=&from=&to=&page=&limit=
Listado paginado + filtros. Lectores solo ven publicados; editor/admin ven todo.
Response 200: `{ "items": ContentDto[], "total": number, "page": number, "limit": number }`.

### POST /contents — `editor` | `admin` (multipart/form-data)
Campos: `file` (archivo), `title`, `description?`, `type` (`video`|`document`), `categoryId`,
`isPublished?`.
Response 201: `ContentDto`. Error 400/413/415 si tipo o tamaño inválidos.

### GET /contents/:id
Response 200: `ContentDto` (respeta visibilidad por rol).

### PATCH /contents/:id — `editor` | `admin`
Request parcial: `{ "title"?, "description"?, "categoryId"?, "isPublished"? }` → 200 `ContentDto`.

### DELETE /contents/:id — `editor` | `admin` (solo el autor o admin)
Elimina metadatos y archivo → 204.

### GET /contents/:id/file (autenticado; streaming/descarga)
Streaming del archivo con soporte `Range` (video) o descarga (documento).
Response 200/206 con cabeceras `Content-Type`, `Content-Length`, `Accept-Ranges`, `Content-Range`.
Error 404 si no existe o no está publicado para el rol.

## DTOs de referencia

**UserDto**: `{ id, username, fullName, role, isActive, createdAt }` (sin `passwordHash`).

**CategoryDto**: `{ id, name, slug, description, order, isActive }`.

**ContentDto**: `{ id, title, description, type, originalName, mimeType, sizeBytes, isPublished,
category: CategoryDto, uploadedBy: { id, fullName }, createdAt, updatedAt }`.
