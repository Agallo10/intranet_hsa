# Tasks: Cumplimiento normativo (privacidad y auditoría)

## Phase 1: Backend — bitácora de auditoría

- [ ] T001 [P] [US2] Crear entidad `AuditLog` en `backend/src/audit/audit-log.entity.ts`
- [ ] T002 [US2] Crear `AuditModule` + `AuditService.record()` en `backend/src/audit/`
- [ ] T003 [US2] Crear `AuditLogsController` (`GET /audit-logs`, admin, filtros + paginación)
- [ ] T004 [US2] Registrar login éxito/fallo en `backend/src/auth/auth.controller.ts`
- [ ] T005 [US2] Registrar eliminación de contenido/noticia/curso en los servicios
- [ ] T006 Registrar módulo en `backend/src/app.module.ts`

## Phase 2: Backend — verificación

- [ ] T007 Ejecutar build + typecheck + lint + tests

## Phase 3: Frontend — aviso de privacidad

- [ ] T008 [US1] Crear página pública `frontend/src/pages/Privacidad.tsx`
- [ ] T009 [US1] Añadir ruta pública `/privacidad` en `App.tsx`
- [ ] T010 [US1] Enlazar desde `Login.tsx`

## Phase 4: Frontend — bitácora

- [ ] T011 [US2] Crear página admin `frontend/src/pages/admin/Auditoria.tsx`
- [ ] T012 [US2] Añadir ruta + enlace en sidebar (`Layout.tsx`, `App.tsx`)

## Phase 5: Verificación

- [ ] T013 build + lint frontend
- [ ] T014 smoke test end-to-end
