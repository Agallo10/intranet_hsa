# Feature Specification: Intranet de Contenidos Hospitalarios

**Feature Branch**: `001-intranet-content-hub`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Construir una intranet para el hospital donde se publican videos de
tutoriales para plataformas, documentos y formatos de calidad."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Autenticación y acceso por roles (Priority: P1)

Un empleado del hospital ingresa a la intranet con su usuario y contraseña. Según su rol
(`admin`, `editor`, `lector`), el sistema le muestra únicamente las funciones que le corresponden.

**Why this priority**: Es la base de todo el sistema. Sin autenticación no se puede controlar quién
ve o publica contenido, ni proteger los archivos internos del hospital.

**Independent Test**: Crear usuarios de los tres roles y verificar que cada uno inicia sesión, recibe
una sesión válida y solo accede a las pantallas permitidas.

**Acceptance Scenarios**:

1. **Given** un usuario registrado y activo, **When** ingresa usuario y contraseña correctos,
   **Then** inicia sesión y accede a la biblioteca de contenidos.
2. **Given** un usuario con contraseña incorrecta, **When** intenta iniciar sesión,
   **Then** el sistema rechaza el acceso con un mensaje genérico de error.
3. **Given** un usuario con rol `lector`, **When** navega por la aplicación,
   **Then** no ve opciones de publicación ni de administración.
4. **Given** un usuario con rol `admin`, **When** navega por la aplicación,
   **Then** ve las opciones de gestión de usuarios, categorías y contenido.

---

### User Story 2 - Publicar y gestionar contenido (Priority: P1)

Un usuario con rol `editor` o `admin` sube un video de tutorial o un documento/formatos de calidad,
le asigna un título, descripción, categoría y lo publica para que el resto del personal lo vea.

**Why this priority**: Sin contenido publicado la intranet no tiene valor. Publicar es la acción que
alimenta el repositorio que los lectores van a consumir.

**Independent Test**: Con un usuario editor, subir un video y un documento, asignarles metadatos y
verificarlos listados y accesibles en la biblioteca.

**Acceptance Scenarios**:

1. **Given** un usuario `editor`, **When** sube un video con título, descripción y categoría,
   **Then** el contenido queda publicado y visible en la biblioteca.
2. **Given** un usuario `editor`, **When** sube un documento de un tipo permitido,
   **Then** el documento queda publicado y es descargable.
3. **Given** un archivo de tipo no permitido o que excede el tamaño máximo, **When** se intenta subir,
   **Then** el sistema rechaza la subida con un mensaje claro.
4. **Given** un usuario `lector`, **When** intenta publicar contenido,
   **Then** el sistema se lo impide.
5. **Given** un autor (editor/admin), **When** edita o elimina un contenido propio,
   **Then** el cambio se refleja en la biblioteca.

---

### User Story 3 - Explorar, reproducir y descargar contenido (Priority: P1)

Un usuario autenticado navega la biblioteca, ve las tarjetas de contenido (videos y documentos),
reproduce los videos en línea y descarga o consulta los documentos y formatos de calidad.

**Why this priority**: Es el objetivo principal del usuario final: encontrar y consumir los
tutoriales, documentos y formatos.

**Independent Test**: Con contenido ya publicado, un usuario lector busca un video, lo reproduce sin
interrupciones y descarga un documento.

**Acceptance Scenarios**:

1. **Given** contenido publicado, **When** el usuario abre la biblioteca,
   **Then** ve las tarjetas con título, tipo y categoría.
2. **Given** un video publicado, **When** el usuario abre su detalle,
   **Then** puede reproducirlo en línea con controles (pausa, avance) sin descargarlo completo.
3. **Given** un documento publicado, **When** el usuario abre su detalle,
   **Then** puede previsualizarlo y descargarlo.
4. **Given** un usuario no autenticado, **When** intenta acceder a un archivo,
   **Then** el sistema lo redirige al inicio de sesión.

---

### User Story 4 - Buscar y filtrar contenido (Priority: P2)

Un usuario encuentra contenido rápidamente buscando por título o descripción y filtrando por
categoría, tipo y rango de fechas.

**Why this priority**: A medida que crece el repositorio, la búsqueda y los filtros son esenciales
para encontrar el tutorial, documento o formato correcto sin recorrer toda la lista.

**Independent Test**: Con varios contenidos publicados, buscar una palabra del título y filtrar por
categoría/tipo devuelve únicamente los resultados relevantes.

**Acceptance Scenarios**:

1. **Given** contenido publicado, **When** el usuario escribe un término de búsqueda,
   **Then** ve únicamente los contenidos cuyo título o descripción coinciden.
2. **Given** contenido de varias categorías y tipos, **When** el usuario filtra por categoría o tipo,
   **Then** la lista se reduce a los contenidos que cumplen el filtro.
3. **Given** filtros combinados sin resultados, **When** se aplican,
   **Then** el sistema muestra un estado vacío claro.

---

### User Story 5 - Administración de usuarios y categorías (Priority: P2)

Un usuario `admin` crea, edita y desactiva usuarios, asigna roles y administra las categorías del
contenido (crear, renombrar, ordenar y desactivar).

**Why this priority**: Permite que el sistema sea operado por el hospital sin intervención técnica:
altas/bajas de personal y ajuste de la organización del contenido.

**Independent Test**: Con un usuario admin, crear un usuario editor, desactivar un lector y agregar
una categoría, verificando que los cambios se reflejan en el sistema.

**Acceptance Scenarios**:

1. **Given** un usuario `admin`, **When** crea un usuario con un rol,
   **Then** el nuevo usuario puede iniciar sesión con ese rol.
2. **Given** un usuario `admin`, **When** desactiva un usuario,
   **Then** ese usuario ya no puede iniciar sesión.
3. **Given** un usuario `admin`, **When** crea, edita o desactiva una categoría,
   **Then** la categoría se refleja en los formularios y filtros de contenido.

---

### Edge Cases

- ¿Qué pasa cuando se sube un archivo que excede el tamaño máximo o tiene una extensión/MIME no
  permitida? → El sistema lo rechaza con un mensaje claro y sin guardar archivos parciales.
- ¿Qué ocurre si un usuario con sesión caducada intenta reproducir un video? → Se renueva la sesión
  de forma transparente o se redirige al inicio de sesión sin interrumpir la reproducción en curso.
- ¿Qué sucede si se intenta acceder a un contenido desactivado o eliminado? → Se muestra un error de
  "no encontrado" y no se filtra el archivo.
- ¿Cómo se comporta la reproducción de un video grande en una red interna lenta? → Debe iniciar
  rápido y permitir avanzar sin esperar la descarga completa.
- ¿Qué pasa si dos usuarios editan el mismo contenido a la vez? → La última edición válida prevalece;
  no se corrompen los datos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir el inicio de sesión con usuario y contraseña locales.
- **FR-002**: El sistema DEBE mantener una sesión con token de acceso y renovación automática.
- **FR-003**: El sistema DEBE restringir cada función según el rol (`admin`, `editor`, `lector`).
- **FR-004**: El sistema DEBE permitir a `admin` crear, editar y desactivar usuarios y asignar roles.
- **FR-005**: El sistema DEBE permitir a `admin` crear, editar, ordenar y desactivar categorías.
- **FR-006**: El sistema DEBE permitir a `editor` y `admin` publicar contenido (video o documento)
  con título, descripción, tipo y categoría.
- **FR-007**: El sistema DEBE validar el tipo de archivo y un tamaño máximo en la subida.
- **FR-008**: El sistema DEBE permitir a `editor` y `admin` editar y eliminar contenido.
- **FR-009**: El sistema DEBE mostrar a todos los usuarios autenticados la biblioteca de contenido
  publicado.
- **FR-010**: El sistema DEBE reproducir videos en línea permitiendo pausa y avance sin descarga
  completa.
- **FR-011**: El sistema DEBE permitir la descarga de documentos.
- **FR-012**: El sistema DEBE permitir buscar por título y descripción.
- **FR-013**: El sistema DEBE permitir filtrar por categoría, tipo y rango de fechas.
- **FR-014**: El sistema DEBE impedir el acceso directo a los archivos sin autenticación.
- **FR-015**: El sistema DEBE mostrar contenido en un listado paginado.

### Key Entities *(include if feature involves data)*

- **Usuario**: identifica a un miembro del personal; tiene nombre, usuario, contraseña cifrada, rol
  y estado activo/inactivo.
- **Categoría**: agrupa el contenido (por ejemplo "Tutoriales en video", "Documentos", "Formatos de
  calidad"); tiene nombre, orden y estado activo.
- **Contenido**: representa un video o documento publicado; tiene título, descripción, tipo,
  categoría, archivo asociado, autor y estado (borrador/publicado).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario autorizado puede iniciar sesión y ver la biblioteca en menos de 5 segundos
  en la red interna.
- **SC-002**: Un editor puede publicar un video o documento en menos de 2 minutos.
- **SC-003**: Un video empieza a reproducirse en menos de 3 segundos en la red interna del hospital.
- **SC-004**: El 90% de las búsquedas devuelve resultados relevantes en la primera página de
  resultados.
- **SC-005**: Un usuario encuentra un tutorial, documento o formato específico en menos de 1 minuto.
- **SC-006**: Ningún usuario sin rol autorizado puede acceder a contenido o funciones restringidas.

## Assumptions

- Los usuarios pertenecen al personal del hospital y acceden desde la red interna.
- El acceso es solo en español; no se requiere internacionalización en esta versión.
- Los formatos de archivo aceptados para documentos incluyen PDF, DOC/DOCX, XLS/XLSX y hojas de
  cálculo; los videos en formatos comunes de navegador (MP4, WebM).
- La gestión de notificaciones o correos está fuera del alcance de esta versión.
- El tamaño máximo de subida se define por configuración y puede ajustarse.
- Las categorías vienen predefinidas pero son configurables por el admin.
- El soporte móvil no es un requisito de esta versión (uso desde equipos de escritorio).
