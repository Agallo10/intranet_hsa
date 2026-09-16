# Tasks: Rediseño de UI/UX de la Intranet

## Phase 1: Setup de shadcn/ui y dependencias

- [ ] T001 Instalar dependencias: `@tanstack/react-table`, `react-hook-form`, `zod`,
  `@hookform/resolvers`, `lucide-react`
- [ ] T002 Inicializar shadcn/ui (`components.json`, `src/lib/utils.ts`, base en `index.css`)
- [ ] T003 Añadir componentes shadcn: button, input, label, card, select, table, dialog, textarea,
  checkbox, badge, separator, skeleton, alert

## Phase 2: Tema con paleta del hospital

- [ ] T004 Configurar variables CSS del tema con la paleta (verde/lima/amarillo) en `index.css`

## Phase 3: Identidad visual

- [ ] T005 [US1] Mostrar logo en la cabecera (`components/Layout.tsx`)
- [ ] T006 [US1] Mostrar logo en la pantalla de login (`pages/Login.tsx`)

## Phase 4: Formularios con RHF + Zod

- [ ] T007 [US2] Login con RHF + Zod (`pages/Login.tsx`)
- [ ] T008 [US2] Formulario de subida con RHF + Zod (`pages/Editor.tsx`)
- [ ] T009 [US2] Crear usuario con RHF + Zod (`pages/admin/Users.tsx`)
- [ ] T010 [US2] Crear categoría con RHF + Zod (`pages/admin/Categories.tsx`)

## Phase 5: Tablas con TanStack Table

- [ ] T011 [US3] Crear tabla genérica `components/data-table/`
- [ ] T012 [US3] Tabla de usuarios con ordenamiento + búsqueda (`pages/admin/Users.tsx`)
- [ ] T013 [US3] Tabla de categorías con ordenamiento (`pages/admin/Categories.tsx`)
- [ ] T014 [US3] Tabla de contenidos en el editor (`pages/Editor.tsx`)

## Phase 6: Disposición y consistencia

- [ ] T015 [US4] Biblioteca con tarjetas y filtros consistentes (`pages/Biblioteca.tsx`)
- [ ] T016 [US4] Detalle con componentes shadcn (`pages/Detalle.tsx`)
- [ ] T017 [US4] Navegación con estados activos y responsive (`components/Layout.tsx`)

## Phase 7: Verificación

- [ ] T018 Ejecutar `npm run build` y `npm run lint` en `frontend/`

## Notas

- Sin cambios en el backend; la funcionalidad debe mantenerse.
