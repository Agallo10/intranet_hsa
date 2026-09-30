# Feature Specification: Rol "Gestor documental" y renombrar módulo a "Documentos"

**Feature Branch**: `008-rol-gestor-documental`

**Created**: 2026-09-24

**Status**: Draft

**Input**: Nuevo rol que solo carga documentos (protocolos, formatos de calidad), similar al
comunicador; renombrar el módulo "Formatos de documentos" a "Documentos".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rol "Gestor documental" (Priority: P1)

Un usuario con rol `gestor_documental` solo puede subir documentos, sin acceso a noticias ni cursos.

**Why this priority**: Control de acceso específico para el área documental.

**Independent Test**: Crear un usuario gestor_documental y verificar que puede subir un documento
pero no videos, cursos ni noticias.

**Acceptance Scenarios**:

1. **Given** un `gestor_documental`, **When** sube un documento, **Then** se publica.
2. **Given** un `gestor_documental`, **When** intenta subir un video o crear un curso,
   **Then** el sistema se lo impide.
3. **Given** un `admin`, **When** crea un usuario, **Then** puede asignarle el rol `gestor_documental`.

---

### User Story 2 - Renombrar módulo a "Documentos" (Priority: P2)

El módulo "Formatos de documentos" pasa a llamarse "Documentos".

**Why this priority**: Claridad del menú.

**Independent Test**: Verificar que el sidebar y la página muestran "Documentos".

**Acceptance Scenarios**:

1. **Given** la navegación, **When** el usuario la ve, **Then** aparece "Documentos".

---

### Edge Cases

- ¿Un gestor_documental puede eliminar un documento propio? → Sí (como el comunicador con sus
  noticias).
- ¿Puede ver videos y noticias? → Sí, lectura general como los demás roles.

## Requirements *(mandatory)*

- **FR-001**: Debe existir el rol `gestor_documental`.
- **FR-002**: El `gestor_documental` DEBE poder subir documentos (no videos, ni cursos, ni noticias).
- **FR-003**: El `admin` DEBE poder asignar el rol.
- **FR-004**: El módulo DEBE llamarse "Documentos".

### Key Entities

- **Usuario**: nuevo rol `gestor_documental`.

## Success Criteria

- **SC-001**: El gestor_documental sube documentos y no puede subir videos/cursos/noticias.
- **SC-002**: El módulo se muestra como "Documentos".

## Assumptions

- El gestor_documental puede eliminar sus propios documentos (análogo al comunicador).
