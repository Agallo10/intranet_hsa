# Implementation Plan: Editor de noticias, categorías, medios y videos embebidos

**Branch**: `007-editor-noticias-embeds` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)

## Summary

Añadir editor enriquecido (TipTap) para el cuerpo de noticias, categorías de noticias, adjuntos
multimedia (video/audio) y soporte de videos embebidos en cursos.

## Technical Context

**Language/Version**: TypeScript (NestJS + React 19)

**Primary Dependencies**: TipTap (`@tiptap/react`, `@tiptap/starter-kit`,
`@tiptap/extension-text-align`, `@tiptap/extension-underline`), `dompurify`; backend
`sanitize-html`

**Storage**: PostgreSQL + disco local (`uploads/news-media/`)

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad | PASS: sanitización de HTML (backend + frontend) |
| II. Separación | PASS: cambios backend + frontend |
| III. Simplicidad | PASS: entidades mínimas |
| IV. Calidad | PASS: build + lint |
| V. Spec-driven | PASS: este flujo |

## Cambios

### Backend

- Nueva entidad `NewsCategory` (nombre, slug) + seed: Resoluciones, Circulares, Políticas.
- Nueva entidad `NoticiaMedia` (video/audio) — adjuntos de noticias.
- `Noticia`: `body` pasa a HTML (sanitizado con `sanitize-html`), `categoryId` FK.
- `NewsController`: subida `cover` + `media` (múltiple) con `FileFieldsInterceptor`; endpoints de
  medios.
- `Content`: campo `embedUrl` opcional para videos.

### Frontend

- Componente `RichTextEditor` (TipTap) con barra de formato.
- Formulario de noticia: editor, categoría y adjuntos multimedia.
- Detalle de noticia: HTML sanitizado (DOMPurify), categoría y reproductores.
- Cursos: opción "subir archivo" vs "pegar URL" y reproductor `<iframe>` para embeds.

## Complexity Tracking

Sin violaciones.
