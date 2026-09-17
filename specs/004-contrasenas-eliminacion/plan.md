# Implementation Plan: Eliminación de contenido y contraseñas temporales

**Branch**: `004-contrasenas-eliminacion` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

Añadir borrado de noticias/documentos en la UI (el backend ya soporta los permisos) y el flujo de
contraseña temporal con cambio forzado: flag `mustChangePassword` en el usuario, endpoint de cambio
de contraseña propio y redirección del frontend.

## Technical Context

**Language/Version**: TypeScript (NestJS + React 19)

**Primary Dependencies**: NestJS + TypeORM; React + shadcn/ui + RHF/Zod

**Storage**: PostgreSQL

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad | PASS: contraseñas con bcrypt; cambio forzado; permisos por rol en DELETE |
| II. Separación | PASS: cambios backend + frontend |
| III. Simplicidad | PASS: flag booleano + un endpoint |
| IV. Calidad | PASS: build + lint + tests |
| V. Spec-driven | PASS: este flujo |

## Cambios

### Backend

- `User`: añadir `mustChangePassword` (default `true`).
- `UsersService`: create/update setean el flag; nuevo `changePassword` y `clearMustChangePassword`.
- `Auth`: login/me exponen `mustChangePassword`; nuevo `POST /auth/change-password`.
- `seed`: admin con `mustChangePassword=false`.

### Frontend

- `UserDto` con `mustChangePassword`.
- Login redirige a `/cambiar-contrasena` si corresponde.
- Nueva página `CambiarContrasena`.
- Admin de usuarios: acción "cambiar contraseña" + indicador.
- Noticias y Formatos: botones de eliminar.

## Complexity Tracking

Sin violaciones.
