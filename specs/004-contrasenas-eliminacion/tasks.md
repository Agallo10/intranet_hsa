# Tasks: Eliminación de contenido y contraseñas temporales

## Phase 1: Backend — contraseña temporal

- [ ] T001 [P] [US2] Añadir `mustChangePassword` a `backend/src/users/user.entity.ts`
- [ ] T002 [US2] Actualizar `UsersService` (create/update/changePassword/clear) en
  `backend/src/users/users.service.ts`
- [ ] T003 [US2] Añadir `ChangePasswordDto` en `backend/src/auth/dto/`
- [ ] T004 [US2] Implementar `POST /auth/change-password` + exponer flag en login/me en
  `backend/src/auth/auth.controller.ts` y `auth.service.ts`
- [ ] T005 [US2] Actualizar `backend/src/seed.ts` (admin sin cambio forzado)

## Phase 2: Backend — verificación

- [ ] T006 Ejecutar build + typecheck + lint + tests

## Phase 3: Frontend — contraseña temporal

- [ ] T007 [US2] Añadir `mustChangePassword` a `frontend/src/lib/types.ts`
- [ ] T008 [US2] Login redirige si debe cambiar contraseña (`Login.tsx` + `AuthContext.tsx`)
- [ ] T009 [US2] Crear página `CambiarContrasena.tsx` + ruta en `App.tsx`
- [ ] T010 [US2] Admin de usuarios: cambiar contraseña + indicador (`admin/Users.tsx`)

## Phase 4: Frontend — eliminación

- [ ] T011 [US1] Botón eliminar noticia en `NoticiaDetalle.tsx`
- [ ] T012 [US1] Acción eliminar documento en `Formatos.tsx`

## Phase 5: Verificación

- [ ] T013 build + lint frontend
- [ ] T014 smoke test end-to-end
