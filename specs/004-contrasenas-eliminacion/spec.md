# Feature Specification: Eliminación de contenido y contraseñas temporales

**Feature Branch**: `004-contrasenas-eliminacion`

**Created**: 2026-09-16

**Status**: Draft

**Input**: El admin puede eliminar documentos y noticias; el comunicador elimina noticias. El admin
ve usuarios y cambia su contraseña temporalmente; el usuario nuevo o con contraseña cambiada debe
cambiar su contraseña al iniciar sesión.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eliminar contenido (Priority: P1)

El `admin` elimina documentos y noticias; el `comunicador` elimina sus propias noticias.

**Why this priority**: Gestión completa del contenido publicado.

**Independent Test**: Eliminar una noticia como comunicador y un documento como admin; verificar que
desaparecen.

**Acceptance Scenarios**:

1. **Given** un `admin`, **When** elimina un documento, **Then** el documento y su archivo se
   eliminan.
2. **Given** un `admin`, **When** elimina una noticia, **Then** la noticia desaparece.
3. **Given** un `comunicador`, **When** elimina una noticia propia, **Then** se elimina.
4. **Given** un `comunicador`, **When** intenta eliminar una noticia ajena, **Then** se le impide.

---

### User Story 2 - Contraseña temporal y cambio forzado (Priority: P1)

El `admin` cambia la contraseña de un usuario (o crea uno nuevo). Ese usuario, al iniciar sesión,
es obligado a cambiar su contraseña.

**Why this priority**: Seguridad de cuentas; evita que las contraseñas temporales queden activas.

**Independent Test**: Crear un usuario, iniciar sesión y verificar que se le exige cambiar la
contraseña; tras cambiarla, puede usar la app.

**Acceptance Scenarios**:

1. **Given** un `admin`, **When** crea un usuario, **Then** ese usuario debe cambiar su contraseña
   en el primer inicio de sesión.
2. **Given** un `admin`, **When** cambia la contraseña de un usuario, **Then** ese usuario debe
   cambiarla en su próximo inicio de sesión.
3. **Given** un usuario que debe cambiar contraseña, **When** inicia sesión, **Then** es dirigido a
   la pantalla de cambio de contraseña.
4. **Given** el usuario cambia su contraseña, **Then** accede normalmente y no se le vuelve a
   pedir.

---

### Edge Cases

- ¿Qué pasa si el usuario ignora el cambio? → No puede navegar; permanece en la pantalla de cambio.
- ¿La contraseña temporal debe cumplir requisitos mínimos? → Sí, mínimo 6 caracteres.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El `admin` DEBE poder eliminar documentos y noticias.
- **FR-002**: El `comunicador` DEBE poder eliminar sus propias noticias.
- **FR-003**: El `admin` DEBE ver la lista de usuarios.
- **FR-004**: El `admin` DEBE poder cambiar la contraseña de un usuario.
- **FR-005**: Un usuario nuevo DEBE cambiar su contraseña en el primer inicio de sesión.
- **FR-006**: Un usuario cuya contraseña fue cambiada por el admin DEBE cambiarla al iniciar sesión.
- **FR-007**: El usuario DEBE poder cambiar su propia contraseña.

### Key Entities

- **Usuario**: añade el estado "debe cambiar contraseña".

## Success Criteria *(mandatory)*

- **SC-001**: El 100% de los usuarios nuevos pasa por el cambio de contraseña.
- **SC-002**: Las contraseñas temporales no quedan activas tras el primer acceso.
- **SC-003**: El admin y el comunicador eliminan contenido sin error.

## Assumptions

- El admin inicial (seed) no es obligado a cambiar su contraseña.
- El cambio forzado se aplica a nivel de interfaz (redirección) además del flag en el backend.
