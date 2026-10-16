# Feature Specification: Ajustes de noticias, documentos y login

**Feature Branch**: `011-ajustes-noticias-docs-login`

**Created**: 2026-10-16

**Status**: Draft

**Input**: (1) Video de YouTube embebido en noticias como en tutoriales; marcar el resumen como
opcional. (2) Marcar la descripción de documentos como opcional y permitir solo PDF. (3) Mejorar el
diseño del login.

## User Scenarios & Testing

### User Story 1 - Video de YouTube en noticias (Priority: P1)

Al crear/editar una noticia se puede pegar una URL de YouTube (u otra plataforma) que se reproduce
embebida en el detalle. El campo "Resumen" indica que es opcional.

**Acceptance Scenarios**:

1. **Given** el formulario de noticia, **When** se pega una URL de YouTube, **Then** se guarda y se
   ve embebida en el detalle.
2. **Given** el formulario, **Then** el campo "Resumen" dice "(opcional)".

### User Story 2 - Documentos solo PDF y descripción opcional (Priority: P1)

Al subir un documento solo se aceptan archivos PDF, y la descripción es opcional.

**Acceptance Scenarios**:

1. **Given** el diálogo de subir documento, **Then** la descripción dice "(opcional)" y el selector
   solo acepta PDF.
2. **Given** un archivo que no es PDF, **Then** el sistema lo rechaza.

### User Story 3 - Mejorar el login (Priority: P2)

La pantalla de inicio de sesión tiene un diseño más atractivo y acorde a la identidad del hospital.

**Acceptance Scenarios**:

1. **Given** la pantalla de login, **Then** muestra un diseño moderno con el logo y la paleta.

## Requirements

- **FR-001**: Las noticias DEBEN admitir un video embebido (YouTube/otras plataformas).
- **FR-002**: El campo Resumen de la noticia DEBE indicarse como opcional.
- **FR-003**: El campo Descripción del documento DEBE indicarse como opcional.
- **FR-004**: Los documentos DEBEN aceptar únicamente PDF.
- **FR-005**: El login DEBE tener un diseño mejorado.

## Success Criteria

- **SC-001**: El video de YouTube se muestra embebido en la noticia.
- **SC-002**: Solo se pueden subir documentos PDF.
- **SC-003**: El login se ve moderno y coherente con la marca.
