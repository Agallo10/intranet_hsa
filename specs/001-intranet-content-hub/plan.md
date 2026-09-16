# Implementation Plan: Intranet de Contenidos Hospitalarios

**Branch**: `001-intranet-content-hub` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-intranet-content-hub/spec.md`

## Summary

Repositorio interno del hospital para publicar y consumir videos de tutoriales, documentos y
formatos de calidad. Backend NestJS (TypeORM + PostgreSQL) expone una API REST protegida con
autenticación JWT y control de acceso por roles (`admin`, `editor`, `lector`); frontend React SPA
(Vite + TypeScript + Tailwind CSS) provee la biblioteca con búsqueda/filtros, reproductor de video
con streaming y paneles de administración/edición. Los archivos se almacenan en disco local y se
sirven mediante endpoints autenticados.

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS y frontend React)

**Primary Dependencies**: NestJS, TypeORM, Passport + @nestjs/jwt, Multer, class-validator;
React, Vite, React Router, TanStack Query, Tailwind CSS

**Storage**: PostgreSQL (usuarios, categorías, metadatos de contenido) + disco local `uploads/`

**Testing**: Jest (backend unit + e2e), Vitest (frontend, opcional)

**Target Platform**: Servidor Linux on-premise (desarrollo en macOS)

**Project Type**: Aplicación web (backend API + frontend SPA)

**Performance Goals**: Video inicia reproducción en <3s en red interna; listados y búsquedas en <1s
para volúmenes típicos del hospital

**Constraints**: Acceso interno únicamente; control de acceso por rol en el backend; archivos nunca
accesibles sin autenticación

**Scale/Scope**: Decenas a cientos de usuarios; cientos a miles de contenidos; archivos de video
medianos-grandes servidos por streaming

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad y roles (no negociable) | PASS: JWT + guards RBAC en backend; bcrypt; archivos servidos solo por endpoints autenticados |
| II. Separación backend/frontend | PASS: `backend/` (NestJS) y `frontend/` (React SPA) independientes vía REST |
| III. Simplicidad (operador único) | PASS: un módulo por dominio (auth, users, categories, contents, search); sin abstracciones prematuras |
| IV. Calidad y verificación | PASS: pruebas unitarias de autorización + integración de endpoints críticos; lint/typecheck |
| V. Desarrollo guiado por especificación | PASS: flujo Spec Kit + consulta de docs con Context7 |

## Project Structure

### Documentation (this feature)

```text
specs/001-intranet-content-hub/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (API REST)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
backend/                 # NestJS + TypeORM
├── src/
│   ├── auth/            # login, JWT, guards, decorators
│   ├── users/           # entidad + CRUD (admin)
│   ├── categories/      # entidad + CRUD (admin lista/lee)
│   ├── contents/        # subida, listado, detalle, streaming, descarga
│   ├── common/          # DTOs, decorators, filtros de excepción
│   ├── app.module.ts
│   └── main.ts
├── uploads/             # (gitignored) archivos en disco
└── test/                # pruebas e2e

frontend/                # React + Vite + TS + Tailwind
├── src/
│   ├── pages/           # Login, Biblioteca, Detalle, Admin, Editor
│   ├── components/      # UI reutilizable
│   ├── features/        # auth, contents, admin
│   └── lib/             # cliente API + tipos

docker-compose.yml       # postgres (+ api/spa) en servidor
```

**Structure Decision**: Aplicación web con `backend/` y `frontend/` separados (opción 2), más
`docker-compose.yml` en la raíz para el despliegue on-premise.

## Complexity Tracking

No hay violaciones a la constitución que requieran justificación.
