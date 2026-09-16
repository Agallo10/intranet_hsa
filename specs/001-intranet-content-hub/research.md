# Research: Intranet de Contenidos Hospitalarios

Hallazgos y decisiones técnicas (fase 0). Se consultó documentación actualizada (Context7) para
validar patrones vigentes de NestJS y TypeORM.

## Decisiones

### 1. Autenticación JWT con Passport y guard de roles
- **Decision**: `@nestjs/passport` con estrategia JWT + guard `JwtAuthGuard` global y decorador
  `@Public()` para rutas abiertas (login, health). Control de roles con `RolesGuard` usando
  `Reflector` y un decorador `@Roles('admin', 'editor')`.
- **Rationale**: patrón canónico de NestJS, bien documentado, con separación clara entre
  autenticación (JWT) y autorización (roles).
- **Alternatives**: Sesiones de servidor (más estado, menos adecuado para SPA + API), guard por
  controlador sin global (más boilerplate). Elegimos guard global + `@Public()` por defecto seguro.

### 2. Contraseñas con bcrypt
- **Decision**: `bcrypt` para hash de contraseñas (10+ rondas de salt).
- **Rationale**: estándar de la industria; requisito no negociable de la constitución.
- **Alternatives**: argon2 (también válido pero añade dependencia nativa), scrypt. bcrypt es
  suficiente y ampliamente soportado.

### 3. Subida de archivos con Multer
- **Decision**: `FileInterceptor` + `MulterOptions` con `diskStorage` en `uploads/`, validación de
  MIME y `limits.fileSize`; nombre de archivo generado (UUID + extensión saneada).
- **Rationale**: integración nativa de NestJS (Express); almacenamiento en disco local requerido.
- **Alternatives**: multer `memoryStorage` + escritura manual (más control pero más código);
  FastifyAdapter (descartado: Multer no compatible). Se mantiene Express.

### 4. Streaming de video con soporte HTTP Range
- **Decision**: endpoint dedicado `GET /contents/:id/file` que implementa soporte de `Range` (HTTP
  206) manualmente con `fs.createReadStream({ start, end })` y cabeceras `Content-Range`,
  `Accept-Ranges`, `Content-Type` y `Content-Length`.
- **Rationale**: el reproductor HTML5 `<video>` requiere `Range` para iniciar rápido y permitir
  avance. `StreamableFile` no gestiona `Range` automáticamente; Express `res.sendFile` sí, pero se
  opta por un handler explícito para integrar la autorización por rol antes de servir el archivo.
- **Alternatives**: `res.sendFile` con ruta autenticada (más simple, menos control); servidor de
  archivos aparte (sobredimensionado). Se implementa handler de rango propio.

### 5. ORM TypeORM con PostgreSQL
- **Decision**: TypeORM con `DataMapper` (repositorios), entidades `User`, `Category`, `Content`,
  columnas enum para `role` y `type`, y sincronización de esquema controlada por migraciones.
- **Rationale**: integración oficial de NestJS (`@nestjs/typeorm`), tipado y relaciones claras.
- **Alternatives**: Prisma (bueno pero menos "nativo" de NestJS; requiere motor propio). TypeORM
  elegido por requerimiento del usuario.

### 6. Búsqueda y filtros
- **Decision**: `GET /contents?q=&category=&type=&from=&to=&page=&limit=` con `ILIKE` sobre título y
  descripción, filtros por categoría/tipo/fechas y paginación (`skip`/`take` + total).
- **Rationale**: suficiente para el volumen esperado; simple y mantenible (principio III).
- **Alternatives**: búsqueda de texto completo de PostgreSQL (`tsvector`) o trigram — se dejan como
  mejora futura si el volumen lo requiere.

### 7. Frontend: TanStack Query + React Router + Tailwind
- **Decision**: TanStack Query para estado de servidor (fetch/caché/refresh de token), React Router
  para rutas protegidas por rol, Tailwind CSS para estilos, Axios (o fetch) con interceptor de token.
- **Rationale**: stack moderno y estándar para SPA; separa estado servidor de estado UI.
- **Alternatives**: Redux (sobredimensionado), MUI/Mantine (más peso; se opta por Tailwind según
  decisión del usuario).

### 8. Despliegue con Docker Compose + Nginx
- **Decision**: `docker-compose.yml` con servicios `postgres`, `backend` y `frontend` (o Nginx
  sirviendo estáticos), volumen persistente para `uploads/` y datos de Postgres.
- **Rationale**: reproducible y simple en servidor Linux on-premise.
- **Alternatives**: instalación nativa de Node/Postgres (más manual). Docker Compose preferido.

## Riesgos y mitigaciones

- **Riesgo**: streaming de video pesado satura el proceso Node. **Mitigación**: streaming con
  `createReadStream` (no cargar en memoria), y Nginx como proxy con buffering adecuado.
- **Riesgo**: refresh token sin rotación. **Mitigación**: access token corto + refresh token con
  expiración y renovación automática en el cliente.
- **Riesgo**: archivos con nombre inseguro. **Mitigación**: nombre generado (UUID) y extensión
  saneada; nunca confiar en el nombre original.
