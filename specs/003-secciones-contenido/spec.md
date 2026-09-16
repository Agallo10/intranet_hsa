# Feature Specification: Secciones de contenido, noticias, cursos y rol comunicador

**Feature Branch**: `003-secciones-contenido`

**Created**: 2026-09-16

**Status**: Draft

**Input**: Sidebar con menús (Noticias, Formatos de documentos, Tutoriales), cursos de videos,
nuevo rol `comunicador`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sidebar de navegación (Priority: P1)

La aplicación pasa a tener un sidebar (menú lateral) con las secciones: Noticias, Formatos de
documentos y Tutoriales, más las secciones de administración y publicación según el rol.

**Why this priority**: Es la estructura sobre la que se organiza todo el contenido.

**Independent Test**: Autenticarse con cada rol y verificar que el sidebar muestra solo las secciones
correspondientes.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado, **When** abre la app, **Then** ve un sidebar con Noticias,
   Formatos y Tutoriales.
2. **Given** un `comunicador`, **When** ve el sidebar, **Then** ve la opción de publicar noticias y
   no las de cursos/formatos.
3. **Given** un `editor`, **When** ve el sidebar, **Then** ve opciones de formatos y tutoriales pero
   no de noticias.

---

### User Story 2 - Noticias (Priority: P1)

Un `comunicador` (o `admin`) publica noticias con título, resumen, contenido y una imagen de portada
opcional. Todos los usuarios autenticados leen las noticias publicadas.

**Why this priority**: Es una de las secciones principales solicitadas.

**Independent Test**: Con un comunicador publicar una noticia y verificar que aparece en el listado
para otros usuarios.

**Acceptance Scenarios**:

1. **Given** un `comunicador`, **When** crea una noticia con título y contenido,
   **Then** la noticia queda publicada y visible para todos.
2. **Given** un `comunicador`, **When** crea una noticia con imagen,
   **Then** la imagen de portada se muestra en el listado y detalle.
3. **Given** un `editor`, **When** intenta crear una noticia, **Then** el sistema se lo impide.
4. **Given** un `lector`, **When** abre una noticia, **Then** ve título, contenido e imagen.

---

### User Story 3 - Formatos de documentos (Priority: P1)

La sección muestra una lista de documentos descargables. Un `editor` (o `admin`) sube documentos y
todos los autenticados pueden descargarlos.

**Why this priority**: Sección principal para distribuir formatos y documentos de calidad.

**Independent Test**: Subir un documento y verificar que aparece en la lista y es descargable.

**Acceptance Scenarios**:

1. **Given** un `editor`, **When** sube un documento, **Then** aparece en la lista de formatos.
2. **Given** un usuario autenticado, **When** abre un formato, **Then** puede descargarlo.

---

### User Story 4 - Tutoriales en cursos (Priority: P1)

La sección muestra cursos. Cada curso agrupa varios videos ordenados. Un `editor` (o `admin`) crea
cursos y les agrega videos.

**Why this priority**: Los tutoriales se organizan por tema mediante cursos.

**Independent Test**: Crear un curso, agregar videos y verificar que se listan en orden y se
reproducen.

**Acceptance Scenarios**:

1. **Given** un `editor`, **When** crea un curso con título,
   **Then** el curso aparece en la sección de tutoriales.
2. **Given** un curso, **When** se le agregan videos,
   **Then** los videos se muestran ordenados dentro del curso.
3. **Given** un video dentro de un curso, **When** el usuario lo abre, **Then** se reproduce en
   línea.

---

### User Story 5 - Rol comunicador (Priority: P1)

Existe un nuevo rol `comunicador` que solo puede publicar y gestionar noticias. El `admin` puede
hacer todo, incluido publicar noticias.

**Why this priority**: Control de acceso específico para el área de comunicaciones.

**Independent Test**: Crear un usuario con rol comunicador y verificar permisos (noticias sí, cursos
y formatos no).

**Acceptance Scenarios**:

1. **Given** un `admin`, **When** crea un usuario con rol `comunicador`,
   **Then** ese usuario puede iniciar sesión y publicar noticias.
2. **Given** un `comunicador`, **When** intenta crear un curso o subir un documento,
   **Then** el sistema se lo impide.

---

### Edge Cases

- ¿Qué pasa al eliminar un curso que tiene videos? → Se impide o se desasocian los videos (no se
  borran los archivos sin confirmación).
- ¿Qué ocurre si se intenta subir un video sin curso? → Se rechaza (todo video pertenece a un curso).
- ¿Cómo se muestra una noticia sin imagen? → Se muestra un placeholder o solo texto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE usar un sidebar con las secciones Noticias, Formatos y Tutoriales.
- **FR-002**: El sistema DEBE tener el rol `comunicador` (además de admin, editor, lector).
- **FR-003**: El `comunicador` DEBE poder crear, editar y eliminar noticias (solo las propias).
- **FR-004**: El `admin` DEBE poder gestionar noticias, formatos y cursos.
- **FR-005**: El `editor` DEBE poder subir documentos y crear cursos, pero NO publicar noticias.
- **FR-006**: Las noticias DEBEN tener título y contenido, y una imagen de portada opcional.
- **FR-007**: La sección de formatos DEBE listar documentos descargables.
- **FR-008**: Los tutoriales DEBEN organizarse en cursos; cada curso agrupa videos ordenados.
- **FR-009**: Todo video DEBE pertenecer a un curso.
- **FR-010**: Los lectores DEBEN poder leer noticias, descargar formatos y ver videos de cursos.

### Key Entities

- **Noticia**: título, resumen, contenido, imagen de portada (opcional), autor, estado
  publicado/borrador.
- **Curso**: título, descripción, lista ordenada de videos, estado publicado/borrador.
- **Contenido (video/documento)**: ahora un video pertenece a un curso (con posición); un documento
  es un formato descargable.

## Success Criteria *(mandatory)*

- **SC-001**: Cada rol ve en el sidebar solo las secciones permitidas.
- **SC-002**: Un comunicador publica una noticia en menos de 2 minutos.
- **SC-003**: Un editor crea un curso y agrega videos sin fricción.
- **SC-004**: Los documentos y videos siguen siendo accesibles y descargables/reproducibles.

## Assumptions

- Se mantiene el rol `editor` (publica formatos y cursos); `comunicador` es adicional.
- Todo video pertenece a un curso.
- Las noticias tienen imagen de portada opcional.
- Las categorías existentes se conservan como metadato opcional de los documentos.
