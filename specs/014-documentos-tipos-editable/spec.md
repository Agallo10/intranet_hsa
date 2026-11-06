# Feature Specification: Documentos editables y columna Tipo

**Feature Branch**: `014-documentos-tipos-editable`

**Created**: 2026-10-16

**Status**: Draft

**Input**: Permitir subir Word, Excel y PowerPoint (documentos editables) además de PDF, y añadir una
columna "Tipo" que indique el tipo de archivo.

## User Scenarios & Testing

### User Story 1 - Subir documentos editables (Priority: P1)

Se pueden subir documentos PDF, Word (.doc/.docx), Excel (.xls/.xlsx) y PowerPoint (.ppt/.pptx).

**Acceptance Scenarios**:

1. **Given** el formulario, **When** se sube un .docx, **Then** se acepta.
2. **Given** el formulario, **When** se sube un .xlsx o .pptx, **Then** se acepta.
3. **Given** un tipo no soportado, **Then** se rechaza.

### User Story 2 - Columna Tipo (Priority: P1)

La tabla de documentos muestra una columna "Tipo" con PDF / Word / Excel / PowerPoint.

**Acceptance Scenarios**:

1. **Given** un documento, **Then** la columna Tipo muestra su tipo según el archivo.

## Requirements

- **FR-001**: Aceptar PDF, Word, Excel y PowerPoint.
- **FR-002**: Validar la firma del archivo por familia (PDF, Office legado, OOXML).
- **FR-003**: Mostrar una columna "Tipo" derivada del archivo.

## Success Criteria

- **SC-001**: Los 4 tipos se suben y se identifican por su Tipo.
