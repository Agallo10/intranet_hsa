# Feature Specification: Áreas de documentos + panel de administración

**Feature Branch**: `013-areas-documentos`

**Created**: 2026-10-16

**Status**: Draft

**Input**: Agregar "área" a la que pertenecen los documentos, con un panel de administración de
áreas (como las categorías).

## User Scenarios & Testing

### User Story 1 - Área del documento (Priority: P1)

Al subir/editar un documento se selecciona el **área** a la que pertenece (independiente de la
categoría).

**Acceptance Scenarios**:

1. **Given** el formulario, **When** se elige un área, **Then** se guarda y se muestra en el listado.
2. **Given** la tabla de documentos, **Then** aparece la columna "Área".

### User Story 2 - Panel de administración de áreas (Priority: P1)

El `admin` puede crear, renombrar y activar/desactivar áreas.

**Acceptance Scenarios**:

1. **Given** un admin, **When** crea un área, **Then** aparece disponible en el formulario.
2. **Given** un admin, **When** desactiva un área, **Then** deja de ofrecerse en el formulario.

## Requirements

- **FR-001**: Debe existir la entidad Área (nombre, slug, activa).
- **FR-002**: Los documentos DEBEN tener un área opcional.
- **FR-003**: El admin DEBE poder administrar áreas.
- **FR-004**: Las áreas NO se mezclan con las categorías.

## Success Criteria

- **SC-001**: El área se guarda y se muestra en documentos.
- **SC-002**: El admin gestiona las áreas.
