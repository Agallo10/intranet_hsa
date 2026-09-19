# Implementation Plan: Cumplimiento normativo (privacidad y auditoría)

**Branch**: `005-cumplimiento-normativo` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

Añadir una página pública de aviso de privacidad/política de datos (enlazada desde el login) y una
bitácora de auditoría (login y eliminaciones) consultable por el admin.

## Technical Context

**Language/Version**: TypeScript (NestJS + React 19)

**Primary Dependencies**: NestJS + TypeORM; React + shadcn/ui + TanStack Query/Table

**Storage**: PostgreSQL (nueva tabla `audit_logs`)

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad | PASS: bitácora de eventos + acceso solo admin |
| II. Separación | PASS: cambios backend + frontend |
| III. Simplicidad | PASS: entidad simple + endpoints mínimos |
| IV. Calidad | PASS: build + lint |
| V. Spec-driven | PASS: este flujo |

## Cambios

### Backend

- Nueva entidad `AuditLog` (action, userId?, username, details?, ip?, userAgent?, createdAt).
- Nuevo módulo `AuditModule` con `AuditService.record(...)` y `AuditLogsController` (`GET
  /audit-logs`, solo admin, con filtros y paginación).
- Registrar eventos en: login (éxito/fallo), eliminar contenido/noticia/curso.

### Frontend

- Página pública `/privacidad` + enlace desde login.
- Página admin "Registro de accesos" (DataTable) + enlace en sidebar.

## Complexity Tracking

Sin violaciones.
