# Implementation Plan: Rediseño de UI/UX de la Intranet

**Branch**: `002-ui-ux-redesign` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

## Summary

Rediseño visual del frontend con shadcn/ui + Tailwind CSS v4, aplicando la paleta del hospital
(verde `#038b25`, lima `#afd818`, amarillo `#f2e206`), el logo en cabecera y login, formularios con
React Hook Form + Zod, y tablas de administración con TanStack Table. Sin cambios funcionales en el
backend.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend React 19 + Vite 8)

**Primary Dependencies**: shadcn/ui, Tailwind CSS v4, @tanstack/react-table, react-hook-form,
zod, @hookform/resolvers, lucide-react, class-variance-authority, clsx, tailwind-merge

**Storage**: N/A (solo frontend)

**Testing**: build + lint (tsc -b, oxlint); sin tests nuevos requeridos

**Target Platform**: Web (desktop)

**Project Type**: Frontend SPA

## Constitution Check

| Principio | Cumplimiento |
|-----------|--------------|
| I. Seguridad | PASS: sin cambios en auth/roles; el frontend sigue consumiendo la API protegida |
| II. Separación | PASS: cambios solo en `frontend/` |
| III. Simplicidad | PASS: componentes shadcn estándar; sin abstracciones extra |
| IV. Calidad | PASS: build + lint verdes al final |
| V. Spec-driven | PASS: este flujo Spec Kit |

## Project Structure (cambios en frontend)

```text
frontend/
├── components.json            # config shadcn/ui
├── src/
│   ├── lib/utils.ts           # cn()
│   ├── components/ui/         # componentes shadcn generados
│   ├── components/data-table/ # tabla genérica con TanStack Table
│   ├── components/            # Layout, ContentCard, RequireAuth
│   └── pages/                 # Login, Biblioteca, Detalle, Editor, admin/*
└── public/logo_hs.png
```

## Tema (paleta del hospital)

- primary: verde `hsl(135 85% 24%)` (verde hospital oscuro para contraste AA)
- primary-foreground: blanco
- accent: lima `hsl(73 80% 90%)`
- ring: verde primario
- destructive: rojo estándar
- fondo: blanco; muted: gris/verde muy claro

## Complexity Tracking

Sin violaciones.
