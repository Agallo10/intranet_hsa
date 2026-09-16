<!--
Sync Impact Report
- Version change: (initial) → 1.0.0
- Modified principles: none (initial constitution)
- Added sections: Core Principles, Security & Data Handling, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: none
-->

# Intranet Hospitalaria Constitution

## Core Principles

### I. Seguridad y control de acceso por roles (NO NEGOCIABLE)
Toda funcionalidad y endpoint debe respetar el modelo de roles `admin`, `editor` y `lector`.
- La autorización se aplica en el backend (guards), nunca solo en el frontend.
- Las contraseñas se almacenan con bcrypt (nunca en texto plano).
- La sesión usa JWT: access token de corta duración + refresh token.
- Los archivos (videos y documentos) solo se sirven mediante endpoints autenticados y
  autorizados; el acceso directo al directorio `uploads/` queda prohibido.
- Ningún secreto, clave o credencial puede exponerse en logs ni commitearse al repositorio.

### II. Separación backend/frontend con contrato de API claro
El backend (NestJS) y el frontend (React SPA) se mantienen como proyectos independientes
que se comunican exclusivamente vía API REST JSON.
- Los DTOs y la validación (class-validator) definen el contrato de entrada/salida.
- Las respuestas de error siguen un formato consistente (código, mensaje, detalles).
- El frontend consume la API mediante un cliente tipado; los tipos compartidos viven en un
  módulo común del frontend.

### III. Simplicidad y mantenibilidad (operador único)
El proyecto es mantenido por una sola persona, por lo que prima la simplicidad.
- Evitar abstracciones prematuras; añadir complejidad solo cuando el requisito la justifique (YAGNI).
- Un módulo de NestJS por dominio (auth, users, categories, contents, search).
- El código sigue las convenciones existentes del framework y del proyecto.
- El nombre de archivos, variables y funciones debe ser descriptivo y consistente.

### IV. Calidad y verificación
Todo cambio debe ser verificable antes de considerarse terminado.
- El backend incluye pruebas unitarias para lógica de negocio y de autorización.
- Los endpoints críticos (login, subida de archivo, acceso a contenido) tienen pruebas de integración.
- Se ejecutan lint y typecheck del backend y del frontend antes de dar por terminada una tarea.
- Las validaciones de negocio (tipos de archivo, tamaño máximo, roles) viven en el backend.

### V. Desarrollo guiado por especificación
El trabajo se organiza mediante Spec-Driven Development (Spec Kit).
- Cada funcionalidad relevante pasa por: especificación → plan → tareas → implementación.
- Los artefactos (`specs/`) se versionan junto al código y son la fuente de verdad de requisitos.
- Durante la implementación se consulta documentación actualizada (Context7) para librerías y
  frameworks, en lugar de asumir APIs por memoria.

## Security & Data Handling

- Autenticación local (usuario/contraseña) con JWT access + refresh.
- Roles: `admin` (gestión total), `editor` (publicar/editar contenido), `lector` (solo lectura).
- Almacenamiento de archivos en disco local (`uploads/`), fuera del control de versiones.
- Streaming de video con soporte HTTP Range para reproducción fluida.
- Validación de tipo MIME y límite de tamaño en la subida de archivos.
- Backups: volcado de PostgreSQL + copia de `uploads/`.

## Development Workflow

- Stack: NestJS + TypeORM + PostgreSQL (backend); React + Vite + TypeScript + Tailwind CSS (frontend).
- Entorno local: PostgreSQL nativo (Postgres.app). Despliegue: Linux on-premise con Docker Compose + Nginx.
- Flujo Spec Kit: `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`.
- Antes de dar por terminada una tarea: lint + typecheck + pruebas relevantes pasan.

## Governance

- Esta constitución tiene prioridad sobre cualquier práctica de desarrollo ad-hoc.
- Las enmiendas requieren documentación y justificación explícita; siguen versionado semántico:
  MAJOR (cambio de principios), MINOR (principio nuevo), PATCH (aclaraciones).
- Todo PR o cambio debe ser consistente con los principios aquí definidos.
- La complejidad introducida debe estar justificada por un requisito concreto.

**Version**: 1.0.0 | **Ratified**: 2026-09-15 | **Last Amended**: 2026-09-15
