# Feature Specification: Chat interno (1 a 1)

**Feature Branch**: `006-chat-interno`

**Created**: 2026-09-16

**Status**: Draft

**Input**: Chat interno 1 a 1 con historial persistido, no-leídos, presencia (online), adjuntos e
indicador de "escribiendo".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conversación 1 a 1 con historial (Priority: P1)

Un usuario autenticado inicia una conversación con otro y envía/recibe mensajes de texto. El
historial se conserva y se puede consultar al volver a entrar.

**Why this priority**: Es la base del chat.

**Independent Test**: Dos usuarios se envían mensajes; al recargar, ambos ven el historial.

**Acceptance Scenarios**:

1. **Given** dos usuarios autenticados, **When** uno envía un mensaje al otro,
   **Then** el otro lo recibe en tiempo real.
2. **Given** una conversación previa, **When** un usuario abre el chat,
   **Then** ve el historial de mensajes.

---

### User Story 2 - Presencia en línea (Priority: P2)

El sistema indica quién está conectado en el momento.

**Why this priority**: Mejora la comunicación interna.

**Independent Test**: Conectar/desconectar a un usuario y verificar que su estado cambia.

**Acceptance Scenarios**:

1. **Given** un usuario conectado, **When** el otro abre el chat, **Then** ve que está en línea.
2. **Given** un usuario se desconecta, **When** ocurre, **Then** su estado pasa a "desconectado".

---

### User Story 3 - No leídos (Priority: P1)

El sistema muestra cuántos mensajes no leídos hay por conversación y un total global.

**Why this priority**: Prioridad indicada por el usuario.

**Independent Test**: Enviar mensajes a un usuario desconectado; al entrar, ve los no-leídos y, al
abrir la conversación, se marcan como leídos.

**Acceptance Scenarios**:

1. **Given** mensajes recibidos sin leer, **When** el usuario ve su chat,
   **Then** se muestra el contador de no-leídos.
2. **Given** el usuario abre la conversación, **When** la lee, **Then** los mensajes se marcan como
   leídos y el contador se actualiza.

---

### User Story 4 - Adjuntos (Priority: P2)

El usuario puede enviar archivos/imágenes en el chat y el receptor puede descargarlos.

**Why this priority**: Requisito indicado por el usuario.

**Independent Test**: Enviar un archivo y verificar que el receptor lo descarga.

**Acceptance Scenarios**:

1. **Given** un usuario, **When** envía un archivo, **Then** el receptor lo ve y puede descargarlo.

---

### User Story 5 - Indicador de "escribiendo" (Priority: P2)

Cuando un usuario está escribiendo, el otro lo ve.

**Why this priority**: UX solicitada.

**Independent Test**: Escribir en una conversación y verificar que el otro ve el indicador.

**Acceptance Scenarios**:

1. **Given** un usuario escribiendo, **When** teclea, **Then** el receptor ve "escribiendo...".

---

### Edge Cases

- ¿Mensaje a un usuario desconectado? → Se persiste y se entrega al reconectar (no-leído).
- ¿Enviar a un usuario inexistente/inactivo? → Se rechaza.
- ¿Archivo que excede el límite? → Se rechaza con mensaje claro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los usuarios autenticados DEBEN poder enviar mensajes 1 a 1.
- **FR-002**: El historial DEBE persistir en la base de datos.
- **FR-003**: El sistema DEBE mostrar presencia (en línea / desconectado).
- **FR-004**: El sistema DEBE contar los mensajes no leídos por conversación y global.
- **FR-005**: Al abrir una conversación, los mensajes DEBEN marcarse como leídos.
- **FR-006**: El usuario DEBE poder enviar adjuntos y descargarlos.
- **FR-007**: El sistema DEBE mostrar el indicador de "escribiendo".
- **FR-008**: La entrega de mensajes DEBE ser en tiempo real (WebSocket).

### Key Entities

- **Mensaje**: emisor, receptor, contenido, adjunto (opcional), leído, fecha.

## Success Criteria *(mandatory)*

- **SC-001**: Los mensajes se entregan en tiempo real (< 1s).
- **SC-002**: El 100% de los mensajes queda persistido.
- **SC-003**: Los contadores de no-leídos son correctos.
- **SC-004**: Los adjuntos se envían y descargan sin error.

## Assumptions

- El chat es interno, entre usuarios activos de la intranet.
- Se usa Socket.IO para tiempo real y HTTP (multipart) para enviar mensajes con adjuntos.
- El directorio de usuarios está disponible para todos los autenticados (nombre y rol).
