# Tasks: Intranet de Contenidos Hospitalarios

**Input**: Design documents from `/specs/001-intranet-content-hub/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md

**Tests**: Se incluyen tareas de prueba para lógica de autorización y endpoints críticos
(requerido por la constitución, principio IV).

**Organization**: Tareas agrupadas por historia de usuario (US1–US5) para implementación y
prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- `[P]`: puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- `[Story]`: historia de usuario asociada (US1..US5)

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Inicialización de proyectos backend y frontend.

- [ ] T001 Crear estructura de carpetas `backend/` y `frontend/` según plan.md
- [ ] T002 Inicializar backend NestJS (`@nestjs/cli`) en `backend/` con TypeScript
- [ ] T003 [P] Inicializar frontend React + Vite + TypeScript en `frontend/`
- [ ] T004 [P] Configurar Tailwind CSS en `frontend/` (postcss, tailwind.config, index.css)
- [ ] T005 [P] Instalar dependencias backend: `@nestjs/typeorm`, `typeorm`, `pg`,
  `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `passport-local`,
  `bcrypt`, `class-validator`, `class-transformer`, `multer`
- [ ] T006 [P] Instalar dependencias frontend: `react-router-dom`, `@tanstack/react-query`, `axios`
- [ ] T007 [P] Crear `.env.example` y `.gitignore` raíz (ignorar `node_modules`, `uploads/`, `.env`)

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Infraestructura base que toda historia de usuario necesita.

**⚠️ CRITICAL**: Ninguna historia puede iniciarse antes de completar esta fase.

- [ ] T008 Configurar `ConfigModule` global y validación de entorno en `backend/src/config/`
- [ ] T009 Configurar `TypeOrmModule.forRootAsync` (PostgreSQL) en `backend/src/app.module.ts`
- [ ] T010 [P] Crear entidad `User` en `backend/src/users/user.entity.ts`
- [ ] T011 [P] Crear entidad `Category` en `backend/src/categories/category.entity.ts`
- [ ] T012 [P] Crear entidad `Content` en `backend/src/contents/content.entity.ts`
- [ ] T013 Configurar filtro global de excepciones y formato de error uniforme en
  `backend/src/common/`
- [ ] T014 [P] Crear decorador `@Public()` en `backend/src/common/decorators/public.decorator.ts`
- [ ] T015 [P] Crear decorador `@Roles()` en `backend/src/common/decorators/roles.decorator.ts`
- [ ] T016 Configurar `JwtAuthGuard` global en `backend/src/common/guards/jwt-auth.guard.ts`
- [ ] T017 Configurar `RolesGuard` global en `backend/src/common/guards/roles.guard.ts`
- [ ] T018 Configurar estrategia JWT (`passport-jwt`) en `backend/src/auth/jwt.strategy.ts`
- [ ] T019 [P] Configurar migraciones TypeORM (`backend/src/migrations/` + scripts npm)

**Checkpoint**: Base lista — las historias pueden implementarse.

---

## Phase 3: User Story 1 - Autenticación y acceso por roles (Priority: P1) 🎯 MVP

**Goal**: Login con usuario/contraseña, emisión de JWT (access + refresh) y navegación según rol.

**Independent Test**: Crear usuarios de los tres roles y verificar login y que cada rol solo ve sus
funciones.

### Tests para US1

- [ ] T020 [P] [US1] Prueba unitaria de `RolesGuard` (permitir/denegar por rol) en
  `backend/src/common/guards/roles.guard.spec.ts`
- [ ] T021 [P] [US1] Prueba e2e de login (credenciales válidas/inválidas) en
  `backend/test/auth.e2e-spec.ts`

### Implementación US1

- [ ] T022 [US1] Implementar `AuthService` (login, refresh, validación) en
  `backend/src/auth/auth.service.ts`
- [ ] T023 [US1] Implementar `UsersService.findById`/`findByUsername` en
  `backend/src/users/users.service.ts`
- [ ] T024 [US1] Implementar `AuthController` (`POST /auth/login`, `POST /auth/refresh`,
  `GET /auth/me`) en `backend/src/auth/auth.controller.ts`
- [ ] T025 [US1] Crear DTOs de login/refresh en `backend/src/auth/dto/`
- [ ] T026 [US1] Crear seed de admin inicial + categorías por defecto en `backend/src/seed/`
- [ ] T027 [US1] Implementar cliente API con interceptor de token y refresh automático en
  `frontend/src/lib/api.ts`
- [ ] T028 [US1] Implementar contexto/sesión de auth en `frontend/src/features/auth/`
- [ ] T029 [US1] Implementar página de Login en `frontend/src/pages/Login.tsx`
- [ ] T030 [US1] Implementar rutas protegidas por rol en `frontend/src/App.tsx` (React Router)

**Checkpoint**: US1 funcional de forma independiente (login + redirección por rol).

---

## Phase 4: User Story 2 - Publicar y gestionar contenido (Priority: P1)

**Goal**: Editor/admin sube videos y documentos con metadatos y los publica.

**Independent Test**: Subir un video y un documento como editor y verificar que quedan publicados.

### Tests para US2

- [ ] T031 [P] [US2] Prueba unitaria de validación de tipo/tamaño de archivo en
  `backend/src/contents/content-validation.spec.ts`
- [ ] T032 [P] [US2] Prueba e2e de subida de contenido (autorizada y no autorizada) en
  `backend/test/contents.e2e-spec.ts`

### Implementación US2

- [ ] T033 [US2] Implementar `ContentsService.create` con almacenamiento en disco y nombre UUID en
  `backend/src/contents/contents.service.ts`
- [ ] T034 [US2] Configurar `MulterModule` (diskStorage, límites, filtro de MIME) en
  `backend/src/contents/contents.module.ts`
- [ ] T035 [US2] Implementar `POST /contents` (multipart, `@Roles('editor','admin')`) en
  `backend/src/contents/contents.controller.ts`
- [ ] T036 [US2] Implementar `PATCH /contents/:id` y `DELETE /contents/:id` (autor o admin)
- [ ] T037 [US2] Crear DTOs de contenido (create/update) con `class-validator`
- [ ] T038 [US2] Implementar formulario de subida (video/documento) en
  `frontend/src/pages/Editor.tsx`
- [ ] T039 [US2] Implementar listado y edición de contenido del editor en
  `frontend/src/features/contents/`

**Checkpoint**: US1 + US2 funcionales (publicación de contenido).

---

## Phase 5: User Story 3 - Explorar, reproducir y descargar (Priority: P1)

**Goal**: Biblioteca pública, detalle con reproductor de video (streaming) y descarga de documentos.

**Independent Test**: Lector ve un video (avance/pausa) y descarga un documento.

### Tests para US3

- [ ] T040 [P] [US3] Prueba unitaria de streaming con soporte `Range` en
  `backend/src/contents/streaming.spec.ts`
- [ ] T041 [P] [US3] Prueba e2e de acceso a archivo (autenticado vs anónimo) en
  `backend/test/contents.e2e-spec.ts`

### Implementación US3

- [ ] T042 [US3] Implementar `GET /contents` (listado paginado) en `backend/src/contents/`
- [ ] T043 [US3] Implementar `GET /contents/:id` (detalle) en `backend/src/contents/`
- [ ] T044 [US3] Implementar `GET /contents/:id/file` con soporte `Range` (video) y descarga
  (documento) en `backend/src/contents/contents.controller.ts`
- [ ] T045 [US3] Implementar query de Biblioteca con TanStack Query en
  `frontend/src/features/contents/`
- [ ] T046 [US3] Implementar página Biblioteca (grid de tarjetas) en
  `frontend/src/pages/Biblioteca.tsx`
- [ ] T047 [US3] Implementar componente `ContentCard` en `frontend/src/components/`
- [ ] T048 [US3] Implementar página Detalle con reproductor `<video>` y descarga en
  `frontend/src/pages/Detalle.tsx`

**Checkpoint**: US1–US3 funcionales (consumo de contenido completo).

---

## Phase 6: User Story 4 - Buscar y filtrar contenido (Priority: P2)

**Goal**: Búsqueda por título/descripción y filtros por categoría, tipo y rango de fechas.

**Independent Test**: Buscar término y filtrar por categoría/tipo devuelve resultados relevantes.

### Implementación US4

- [ ] T049 [US4] Implementar filtros (`q`, `category`, `type`, `from`, `to`, `page`, `limit`) en
  `GET /contents` en `backend/src/contents/contents.service.ts`
- [ ] T050 [US4] Implementar barra de búsqueda y filtros en `frontend/src/pages/Biblioteca.tsx`
- [ ] T051 [US4] Implementar estado vacío de resultados en `frontend/src/components/`

**Checkpoint**: US1–US4 funcionales (búsqueda y filtros).

---

## Phase 7: User Story 5 - Administración de usuarios y categorías (Priority: P2)

**Goal**: Admin gestiona usuarios (crear/editar/desactivar, roles) y categorías.

**Independent Test**: Admin crea un editor, desactiva un lector y agrega una categoría.

### Tests para US5

- [ ] T052 [P] [US5] Prueba e2e de control de acceso admin (403 para no-admin) en
  `backend/test/users.e2e-spec.ts`

### Implementación US5

- [ ] T053 [US5] Implementar `GET/POST/PATCH /users` (solo admin) en
  `backend/src/users/users.controller.ts`
- [ ] T054 [US5] Implementar `GET /categories` (todos) y `POST/PATCH /categories` (admin) en
  `backend/src/categories/categories.controller.ts`
- [ ] T055 [US5] Implementar pantalla de gestión de usuarios en `frontend/src/pages/admin/Users.tsx`
- [ ] T056 [US5] Implementar pantalla de gestión de categorías en
  `frontend/src/pages/admin/Categories.tsx`
- [ ] T057 [US5] Implementar layout de administración en `frontend/src/components/AdminLayout.tsx`

**Checkpoint**: Todas las historias funcionales de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Despliegue, documentación y verificación final.

- [ ] T058 [P] Crear `docker-compose.yml` (postgres + backend + frontend/nginx) en la raíz
- [ ] T059 [P] Crear `nginx.conf` para servir estáticos y proxy a la API
- [ ] T060 [P] Crear script/README de backups (pg_dump + rsync de `uploads/`)
- [ ] T061 [P] Escribir `README.md` raíz con instrucciones de uso y despliegue
- [ ] T062 Ejecutar `quickstart.md` de validación end-to-end
- [ ] T063 Ejecutar lint + typecheck + tests de backend y frontend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias.
- **Foundational (Fase 2)**: depende de Setup — BLOQUEA todas las historias.
- **US1–US5 (Fases 3–7)**: dependen de Foundational; US2 depende de US1 (necesita auth).
- **Polish (Fase 8)**: depende de las historias deseadas completas.

### User Story Dependencies

- **US1 (P1)**: tras Foundational. Sin dependencias entre historias.
- **US2 (P1)**: tras US1 (usuario autenticado con rol). Independiente de US3–US5.
- **US3 (P1)**: tras US2 (requiere contenido publicado para consumir).
- **US4 (P2)**: tras US3 (filtra la biblioteca).
- **US5 (P2)**: tras US1 (gestión admin), paralelizable con US2–US4.

### Parallel Opportunities

- Fase 1: T003–T007 en paralelo.
- Fase 2: T010–T012, T014–T015, T019 en paralelo.
- Dentro de cada historia: tests [P] y modelos [P] en paralelo.
- US4 y US5 pueden avanzar en paralelo tras sus dependencias.

## Implementation Strategy

### MVP First (US1)

1. Fases 1–2 (Setup + Foundational).
2. Fase 3 (US1) → login y roles.
3. **STOP y validar** US1.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → login/roles (MVP).
3. US2 → publicar contenido.
4. US3 → consumir (biblioteca/reproductor/descarga).
5. US4 → búsqueda/filtros.
6. US5 → administración.
7. Polish → despliegue y documentación.

---

## Notes

- `[P]` = archivos distintos, sin dependencias; `[Story]` mapea la tarea a su historia.
- Verificar que los tests fallan antes de implementar (si se sigue TDD).
- Commit tras cada tarea o grupo lógico.
- Detenerse en cada checkpoint para validar la historia de forma independiente.
