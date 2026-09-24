# Feature Specification: Editor de noticias, categorías, medios y videos embebidos

**Feature Branch**: `007-editor-noticias-embeds`

**Created**: 2026-09-22

**Status**: Draft

**Input**: Editor enriquecido (negrita, centrar, justificar, ortografía), categorías de noticias
(resoluciones, circulares, políticas), subir videos/audios en noticias, y embeder videos de
YouTube/otras plataformas en cursos.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor enriquecido de noticias (Priority: P1)

Al crear/editar una noticia, el usuario usa un editor con formato (negrita, cursiva, alineación
centrar/justificar, títulos, listas) y corrección ortográfica del navegador.

**Why this priority**: Mejora central de la redacción de noticias.

**Independent Test**: Crear una noticia con texto en negrita, centrado y una lista; verificar que se
guarda y se muestra con el formato.

**Acceptance Scenarios**:

1. **Given** el formulario de noticia, **When** el usuario escribe, **Then** puede aplicar negrita,
   cursiva, alinear (centrar/justificar) y crear listas.
2. **Given** una noticia con formato, **When** se guarda, **Then** el detalle muestra el formato.

---

### User Story 2 - Categorías de noticias (Priority: P1)

Las noticias se clasifican en categorías: Resoluciones, Circulares y Políticas (configurables).

**Why this priority**: Organización de noticias por tipo de documento.

**Independent Test**: Crear una noticia con categoría "Circulares" y verificar que se muestra.

**Acceptance Scenarios**:

1. **Given** el formulario de noticia, **When** el usuario crea, **Then** selecciona una categoría.
2. **Given** una noticia con categoría, **When** se lista, **Then** se muestra su categoría.

---

### User Story 3 - Videos y audios en noticias (Priority: P1)

El usuario adjunta videos y audios a una noticia y se reproducen en el detalle.

**Why this priority**: Noticias con contenido multimedia.

**Independent Test**: Adjuntar un video y un audio a una noticia; verificar que se reproducen.

**Acceptance Scenarios**:

1. **Given** el formulario, **When** se adjunta un video, **Then** se reproduce en el detalle.
2. **Given** el formulario, **When** se adjunta un audio, **Then** se reproduce en el detalle.

---

### User Story 4 - Videos embebidos en cursos (Priority: P1)

Al subir un video a un curso, se puede pegar un enlace de YouTube (u otra plataforma) en lugar de
subir el archivo, para ahorrar espacio.

**Why this priority**: Ahorro de almacenamiento.

**Independent Test**: Crear un video de curso con URL de YouTube; verificar que se reproduce embebido.

**Acceptance Scenarios**:

1. **Given** el diálogo de agregar video, **When** se pega una URL de YouTube,
   **Then** el video se reproduce embebido en el curso.

---

### Edge Cases

- ¿HTML con scripts o estilos peligrosos? → Se sanitiza (se eliminan scripts y estilos no permitidos).
- ¿Video de curso sin archivo y sin URL? → Se rechaza.
- ¿URL de plataforma no reconocida? → Se guarda y se muestra como enlace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El editor de noticias DEBE permitir negrita, cursiva, subrayado, títulos y listas.
- **FR-002**: El editor DEBE permitir alinear texto (izquierda, centrar, derecha, justificar).
- **FR-003**: El editor DEBE tener corrección ortográfica.
- **FR-004**: El contenido HTML DEBE sanitizarse antes de guardarse.
- **FR-005**: Las noticias DEBEN tener categoría (Resoluciones, Circulares, Políticas).
- **FR-006**: Las noticias DEBEN poder adjuntar videos y audios.
- **FR-007**: Los videos de cursos DEBEN poder definirse por URL embebida.

### Key Entities

- **Noticia**: cuerpo enriquecido (HTML), categoría, medios adjuntos.
- **Categoría de noticia**: nombre y slug.
- **Medio de noticia**: video o audio adjunto.
- **Contenido (video)**: URL embebida opcional.

## Success Criteria *(mandatory)*

- **SC-001**: El formato del editor se conserva al guardar y mostrar.
- **SC-002**: Las noticias tienen categoría y medios reproducibles.
- **SC-003**: Los videos embebidos se reproducen sin consumir almacenamiento local.

## Assumptions

- Editor: TipTap (HTML). Almacena HTML sanitizado con `sanitize-html` (backend) y DOMPurify (frontend).
- Medios: múltiples archivos (video/audio) por noticia.
- Embeds: se detectan YouTube y Vimeo; otras URLs se muestran como enlace.
