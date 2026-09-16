# Implementation Plan: Secciones de contenido, noticias, cursos y rol comunicador

**Branch**: `003-secciones-contenido` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

Reorganizar la intranet en un sidebar con tres secciones (Noticias, Formatos de documentos,
Tutoriales). Añadir el rol `comunicador` (publica solo noticias), una entidad `Noticia` (con imagen
de portada opcional) y una entidad `Curso` que agrupa videos ordenados. Los documentos siguen siendo
`Content(type=document)` y los videos pasan a pertenecer a un curso.

## Technical Context

**Language/Version**: TypeScript (NestJS backend + React 19 frontend)

**Primary Dependencies**: NestJS + TypeORM (backend); React + shadcn/ui + TanStack Query/Table +
RHF/Zod (frontend)

**Storage**: PostgreSQL + disco local (uploads de documentos, videos y portadas)

**Testing**: build + lint; pruebas unitarias de roles

**Target Platform**: Web (desktop, on-premise)

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad/roles | PASS: nuevo rol `comunicador` integrado en guards RBAC |
| II. Separación | PASS: cambios en backend y frontend, contrato REST claro |
| III. Simplicidad | PASS: entidades mínimas; reutiliza Content para docs/videos |
| IV. Calidad | PASS: build + lint + pruebas de rol |
| V. Spec-driven | PASS: este flujo |

## Data model (cambios)

- `User.role`: enum ampliado con `comunicador`.
- **Nueva `Noticia`**: id, title, summary?, body, coverImagePath?, isPublished, publishedAt?,
  authorId (FK user), timestamps.
- **Nueva `Curso`**: id, title, description?, isPublished, createdById (FK user), timestamps.
- `Content`: `categoryId` pasa a nullable; se añaden `cursoId` (FK Curso, nullable) y `position`
  (int) para videos.

## API (nuevos endpoints)

- `GET/POST /news`, `GET/PATCH/DELETE /news/:id`, `GET /news/:id/cover`
  (comunicador/admin escriben; lectura general).
- `GET/POST /courses`, `GET/PATCH/DELETE /courses/:id` (editor/admin escriben).
- `POST /contents`: video requiere `cursoId`; documento no requiere categoría.

## Frontend (cambios)

- `Layout` con sidebar (Noticias, Formatos, Tutoriales, admin: Usuarios/Categorías).
- Páginas: Noticias (lista + detalle + formulario), Formatos (lista + subir), Tutoriales (cursos +
  detalle de curso + crear curso/videos).
- Se elimina la "Biblioteca" general y el "Editor" genérico; las acciones se integran por sección.

## Complexity Tracking

Sin violaciones.
