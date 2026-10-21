# Feature Specification: Metadatos de documentos (código, versión y fechas)

**Feature Branch**: `012-documentos-metadatos`

**Created**: 2026-10-16

**Status**: Draft

**Input**: Los documentos deben llevar código, área, versión, fecha de elaboración y fecha de
actualización.

## User Scenarios & Testing

### User Story 1 - Metadatos de control documental (Priority: P1)

Al subir y editar un documento se registran: código, área (categoría), versión, fecha de
elaboración y fecha de actualización.

**Acceptance Scenarios**:

1. **Given** el diálogo de subir documento, **When** se completa el código, la versión y las fechas,
   **Then** quedan guardados y visibles.
2. **Given** un documento, **When** se edita, **Then** se pueden modificar estos campos.

## Requirements

- **FR-001**: El documento DEBE poder tener un código.
- **FR-002**: El documento DEBE poder tener una versión.
- **FR-003**: El documento DEBE poder tener fecha de elaboración y de actualización.
- **FR-004**: El "área" corresponde a la categoría existente.

## Success Criteria

- **SC-001**: El código, la versión y las fechas se guardan y se muestran.

## Assumptions

- "Área" se refiere a la categoría existente del documento (según aclaración previa).
- Las fechas se capturan como cadenas ISO `YYYY-MM-DD`.
