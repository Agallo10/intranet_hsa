# Feature Specification: Cumplimiento normativo (privacidad y auditoría)

**Feature Branch**: `005-cumplimiento-normativo`

**Created**: 2026-09-16

**Status**: Draft

**Input**: Aviso de privacidad/política de tratamiento de datos y registro de accesos (auditoría).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aviso de privacidad y política de datos (Priority: P1)

Cualquier persona (sin iniciar sesión) puede consultar el aviso de privacidad y la política de
tratamiento de datos; desde la pantalla de login hay un enlace a esta página.

**Why this priority**: Requisito de la Ley 1581 de 2012 (habeas data) y base de la confianza del
usuario.

**Independent Test**: Abrir `/privacidad` sin autenticarse y verificar que se muestra la política;
verificar el enlace desde el login.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado, **When** abre `/privacidad`, **Then** ve el aviso de
   privacidad y la política de tratamiento de datos.
2. **Given** la pantalla de login, **When** el usuario la ve, **Then** hay un enlace a la política.

---

### User Story 2 - Registro de accesos (auditoría) (Priority: P1)

El sistema registra eventos relevantes: inicios de sesión (éxito/fallo) y eliminaciones de
contenido. El `admin` puede consultar la bitácora.

**Why this priority**: Trazabilidad y seguridad de la información (ISO 27001 / Ley 1273 de 2009).

**Independent Test**: Iniciar sesión (éxito y fallo), eliminar contenido, y verificar que el admin
ve esos eventos en la bitácora.

**Acceptance Scenarios**:

1. **Given** un intento de login (éxito o fallo), **When** ocurre, **Then** se registra el evento
   con usuario, acción y fecha.
2. **Given** un `admin`, **When** abre "Registro de accesos", **Then** ve los eventos ordenados por
   fecha, con filtros.
3. **Given** un usuario no admin, **When** intenta ver la bitácora, **Then** se le impide.

---

### Edge Cases

- ¿Login fallido con usuario inexistente? → Se registra con el nombre de usuario ingresado y sin id.
- ¿Qué se registra exactamente? → Acción, usuario, fecha; IP/agente cuando esté disponible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Debe existir una página pública de aviso de privacidad y política de datos.
- **FR-002**: La pantalla de login DEBE enlazar a esa página.
- **FR-003**: El sistema DEBE registrar los inicios de sesión (éxito y fallo).
- **FR-004**: El sistema DEBE registrar las eliminaciones de contenido (documentos, videos, noticias,
  cursos).
- **FR-005**: Solo el `admin` DEBE poder consultar la bitácora.
- **FR-006**: La bitácora DEBE permitir filtrar y paginar los eventos.

### Key Entities

- **Evento de auditoría**: acción, usuario, fecha, detalle, IP/agente (opcional).

## Success Criteria *(mandatory)*

- **SC-001**: El 100% de los login y eliminaciones queda registrado.
- **SC-002**: El aviso de privacidad es accesible sin autenticación.
- **SC-003**: Solo el admin accede a la bitácora.

## Assumptions

- El contenido legal (responsable, finalidades, contacto) lo completa la ESE; la intranet provee la
  estructura y el texto base.
- La IP se registra cuando está disponible (login); en servicios internos puede quedar vacía.
