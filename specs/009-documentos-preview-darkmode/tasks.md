# Tasks: Editar documentos, previsualizar y modo oscuro

## Backend

- [ ] T001 [US2] `GET /contents/:id/file?preview=1` → disposición `inline` (PDF) en
  `contents.controller.ts`

## Frontend

- [ ] T002 [US1] `Documentos.tsx`: diálogo "Editar" (título, descripción, categoría) con PATCH
- [ ] T003 [US2] `Documentos.tsx`: diálogo "Ver" (previsualizar PDF en iframe / descargar otros)
- [ ] T004 [US3] Personalizar `.dark` en `index.css` (paleta verde oscura)
- [ ] T005 [US3] `ThemeProvider` + toggle en `Layout` + script anti-FOUC en `index.html`

## Verificación

- [ ] T006 build + lint backend y frontend
