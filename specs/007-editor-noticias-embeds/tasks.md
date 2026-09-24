# Tasks: Editor de noticias, categorías, medios y videos embebidos

## Phase 1: Backend — categorías de noticias

- [ ] T001 [P] [US2] Entidad `NewsCategory` en `backend/src/news/news-category.entity.ts`
- [ ] T002 [US2] Servicio + controlador (`GET/POST/PATCH /news-categories`) en `backend/src/news/`
- [ ] T003 [US2] Seed de categorías (Resoluciones, Circulares, Políticas) en `seed.ts`

## Phase 2: Backend — noticias (HTML + categoría + medios)

- [ ] T004 [US1/US3] `Noticia`: `body` HTML + `categoryId` + entidad `NoticiaMedia`
- [ ] T005 [US1] Sanitizar `body` con `sanitize-html` en `NewsService`
- [ ] T006 [US3] Subida `cover` + `media` (FileFieldsInterceptor) y endpoints de medios
- [ ] T007 Registrar `sanitize-html` (dependencia) y ajustes en `NewsModule`

## Phase 3: Backend — videos embebidos

- [ ] T008 [US4] `Content`: `embedUrl` opcional + `filePath` nullable
- [ ] T009 [US4] `ContentsService/Controller`: video por archivo o URL

## Phase 4: Frontend — editor enriquecido

- [ ] T010 [US1] Instalar TipTap + DOMPurify
- [ ] T011 [US1] Componente `RichTextEditor.tsx` (barra de formato + ortografía)

## Phase 5: Frontend — noticias

- [ ] T012 [US1/US2/US3] `NoticiaForm`: editor + categoría + adjuntos multimedia
- [ ] T013 [US1/US2/US3] `NoticiaDetalle`: HTML + categoría + reproductores

## Phase 6: Frontend — embeds en cursos

- [ ] T014 [US4] `CursoDetalle`/`AddVideoDialog`: modo "subir" vs "URL"
- [ ] T015 [US4] Reproductor `<iframe>` para embeds (YouTube/Vimeo)

## Phase 7: Verificación

- [ ] T016 build + lint backend y frontend
- [ ] T017 smoke test end-to-end
