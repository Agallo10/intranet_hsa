# Feature Specification: Galería de imágenes (carrusel) en noticias

**Feature Branch**: `010-noticias-galeria`

**Created**: 2026-10-14

**Status**: Draft

**Input**: En noticias, permitir varias imágenes en un carrusel (después del título, con formato
adaptado a las dimensiones), combinar imágenes y video, y poder quitar fotos/videos al editar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adjuntar varias imágenes (Priority: P1)

Al crear/editar una noticia se pueden adjuntar varias imágenes (galería), además de videos y audios.

**Independent Test**: Subir 3 imágenes y verificar que se listan como adjuntos.

**Acceptance Scenarios**:

1. **Given** el formulario, **When** se adjuntan varias imágenes, **Then** quedan asociadas.
2. **Given** una noticia con imágenes y un video, **Then** ambos se conservan.

---

### User Story 2 - Carrusel en el detalle (Priority: P1)

Al abrir la noticia, las imágenes se muestran en un carrusel (después del título) con formato
adaptado a sus dimensiones (sin recortes), y se puede pasar una a una.

**Why this priority**: Mejora la lectura y evita el recorte de la imagen.

**Acceptance Scenarios**:

1. **Given** una noticia con varias imágenes, **When** se abre, **Then** se ven en un carrusel.
2. **Given** una imagen horizontal o vertical, **Then** se muestra completa (sin recorte).
3. **Given** una noticia con video, **Then** el video se reproduce aparte.

---

### User Story 3 - Quitar fotos/videos al editar (Priority: P1)

Al editar la noticia se pueden eliminar las imágenes y videos adjuntos.

**Acceptance Scenarios**:

1. **Given** una noticia con adjuntos, **When** se edita, **Then** se pueden quitar.

---

### Edge Cases

- ¿Noticia sin imágenes? → No se muestra el carrusel.
- ¿Se elimina la imagen principal? → La portada (miniatura del listado) se recalcula.

## Requirements

- **FR-001**: Se DEBEN poder adjuntar varias imágenes a una noticia.
- **FR-002**: Las imágenes DEBEN mostrarse en un carrusel después del título, sin recortes.
- **FR-003**: Se DEBEN poder combinar imágenes con videos/audios.
- **FR-004**: Al editar se DEBEN poder quitar imágenes y videos.
- **FR-005**: La miniatura del listado DEBE usar la primera imagen.

## Success Criteria

- **SC-001**: Varias imágenes se muestran en carrusel y se navegan.
- **SC-002**: Las imágenes no se recortan.
- **SC-003**: Se pueden eliminar adjuntos al editar.

## Assumptions

- Las imágenes se guardan en el mismo modelo de medios (`type: image`).
- La portada del listado es la primera imagen.
