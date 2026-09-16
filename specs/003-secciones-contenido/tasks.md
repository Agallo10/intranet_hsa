# Tasks: Secciones de contenido, noticias, cursos y rol comunicador

## Phase 1: Backend — rol y modelo de datos

- [ ] T001 [P] Ampliar enum `Role` con `comunicador` en `backend/src/common/role.enum.ts`
- [ ] T002 [P] Crear entidad `Noticia` en `backend/src/news/noticia.entity.ts`
- [ ] T003 [P] Crear entidad `Curso` en `backend/src/courses/curso.entity.ts`
- [ ] T004 Modificar `Content` (`categoryId` nullable, `cursoId`, `position`) en
  `backend/src/contents/content.entity.ts`

## Phase 2: Backend — módulos news y courses

- [ ] T005 [US2] Implementar `NewsService` + `NewsController` (CRUD + cover) en `backend/src/news/`
- [ ] T006 [US3/US4] Implementar `CoursesService` + `CoursesController` en `backend/src/courses/`
- [ ] T007 Modificar `ContentsService`/`Controller` para video-requiere-curso y documento sin
  categoría
- [ ] T008 Actualizar `app.module.ts` (registrar NewsModule, CoursesModule)
- [ ] T009 Actualizar seed (categorías siguen, opcional) en `backend/src/seed.ts`

## Phase 3: Backend — verificación

- [ ] T010 Prueba unitaria de permisos por rol en `backend/src/common/guards/roles.guard.spec.ts`
- [ ] T011 Ejecutar build + lint + tests de backend

## Phase 4: Frontend — sidebar y rutas

- [ ] T012 [US1] Reemplazar `Layout` por sidebar en `frontend/src/components/Layout.tsx`
- [ ] T013 [US1] Actualizar rutas en `frontend/src/App.tsx`
- [ ] T014 [US1] Actualizar tipos y cliente en `frontend/src/lib/types.ts`

## Phase 5: Frontend — secciones

- [ ] T015 [US2] Página Noticias (lista) en `frontend/src/pages/Noticias.tsx`
- [ ] T016 [US2] Detalle + formulario de noticia (RHF+Zod) en `frontend/src/pages/Noticia*.tsx`
- [ ] T017 [US3] Página Formatos (lista + subir documento) en `frontend/src/pages/Formatos.tsx`
- [ ] T018 [US4] Página Tutoriales (cursos) en `frontend/src/pages/Tutoriales.tsx`
- [ ] T019 [US4] Detalle de curso + gestionar videos en `frontend/src/pages/CursoDetalle.tsx`
- [ ] T020 [US4] Crear/editar curso (RHF+Zod) en `frontend/src/pages/CursoForm.tsx`

## Phase 6: Verificación

- [ ] T021 Ejecutar build + lint de frontend
- [ ] T022 Smoke test end-to-end (roles, noticias, formatos, cursos)

## Notas

- La "Biblioteca" y el "Editor" genéricos se retiran; sus funciones se integran en las secciones.
