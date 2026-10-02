# Feature Specification: Editar documentos, previsualizar y modo oscuro

**Feature Branch**: `009-documentos-preview-darkmode`

**Created**: 2026-09-30

**Status**: Draft

**Input**: En documentos, editar el área y el nombre, previsualizar el documento al hacer clic, y
modo oscuro.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editar documentos (Priority: P1)

Un usuario autorizado edita el nombre (título), descripción y área (categoría) de un documento.

**Why this priority**: Corrección de metadatos de documentos ya subidos.

**Independent Test**: Editar el título y la categoría de un documento y verificar que se reflejan.

**Acceptance Scenarios**:

1. **Given** un documento, **When** se edita su nombre y área, **Then** se actualizan en el listado.
2. **Given** un usuario no autorizado, **When** intenta editar, **Then** no ve la opción.

---

### User Story 2 - Previsualizar documento (Priority: P1)

Al hacer clic en un documento se abre una vista previa (PDF en el navegador) además de poder
descargarlo.

**Why this priority**: Consultar documentos sin descargarlos.

**Independent Test**: Abrir un PDF y verificar que se previsualiza en el navegador.

**Acceptance Scenarios**:

1. **Given** un documento PDF, **When** el usuario lo abre, **Then** se muestra una vista previa.
2. **Given** un documento no previsualizable (Word/Excel), **Then** se ofrece descarga.

---

### User Story 3 - Modo oscuro (Priority: P2)

La aplicación tiene un modo oscuro que se puede alternar y se conserva entre sesiones.

**Why this priority**: Comodidad visual del personal.

**Independent Test**: Alternar a modo oscuro y recargar; verificar que se conserva.

**Acceptance Scenarios**:

1. **Given** la app en modo claro, **When** se activa el modo oscuro, **Then** cambia la interfaz.
2. **Given** modo oscuro activo, **When** se recarga, **Then** se mantiene oscuro.

---

### Edge Cases

- ¿Documento Word/Excel? → No tiene vista previa nativa; se ofrece descarga.
- ¿Preferencia de tema no guardada? → Modo claro por defecto.

## Requirements *(mandatory)*

- **FR-001**: Se DEBE poder editar el nombre, la descripción y el área de un documento.
- **FR-002**: Los documentos DEBEN poder previsualizarse (PDF) además de descargarse.
- **FR-003**: Debe existir un modo oscuro alternable y persistente.

### Key Entities

- **Contenido (documento)**: título, descripción, categoría/área.

## Success Criteria

- **SC-001**: Editar nombre/área se refleja de inmediato.
- **SC-002**: Los PDF se previsualizan en el navegador.
- **SC-003**: El modo oscuro se conserva entre sesiones.

## Assumptions

- "Área" corresponde a la categoría del documento.
- Previsualización nativa solo para PDF; Word/Excel descargan.
