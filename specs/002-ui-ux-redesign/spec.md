# Feature Specification: Rediseño de UI/UX de la Intranet

**Feature Branch**: `002-ui-ux-redesign`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "Mejorar el UX/UI de la plataforma usando la paleta de colores y el logo
del hospital, con shadcn/ui + Tailwind + TanStack Table + React Hook Form/Zod."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identidad visual del hospital (Priority: P1)

Toda la aplicación refleja la identidad del hospital: el logo aparece en la cabecera y la pantalla
de acceso, y la paleta (verde/lima/amarillo) se aplica de forma coherente a botones, enlaces,
acentos y fondos.

**Why this priority**: Es la base visual; sin identidad consistente el rediseño no tiene coherencia.

**Independent Test**: Abrir la app y verificar que el logo y los colores de la paleta aparecen en el
login, la navegación y los componentes principales.

**Acceptance Scenarios**:

1. **Given** la app abierta, **When** el usuario ve la pantalla de acceso,
   **Then** se muestra el logo del hospital y los colores de la paleta.
2. **Given** un usuario autenticado, **When** navega por la app,
   **Then** la cabecera muestra el logo y los enlaces usan los colores de la marca.

---

### User Story 2 - Formularios accesibles y validados (Priority: P1)

Los formularios (login, subida de contenido, crear usuario, crear categoría) usan componentes
accesibles con validación de datos y mensajes de error claros e inline.

**Why this priority**: Los formularios son el principal punto de interacción; una validación clara
reduce errores del usuario.

**Independent Test**: Enviar un formulario con datos inválidos y verificar que se muestran errores
inline claros y que no se envía el formulario.

**Acceptance Scenarios**:

1. **Given** el formulario de login, **When** se envían campos vacíos,
   **Then** se muestran mensajes de error por campo sin hacer la petición.
2. **Given** el formulario de subida de contenido, **When** falta el título o el archivo,
   **Then** se muestra el error correspondiente junto al campo.

---

### User Story 3 - Tablas de administración consistentes (Priority: P2)

Las tablas de usuarios, contenidos y categorías usan un componente de tabla con encabezados,
ordenamiento, búsqueda local y acciones por fila, en lugar de tablas HTML simples.

**Why this priority**: Mejora la usabilidad y consistencia del panel de administración.

**Independent Test**: En la gestión de usuarios, verificar que la tabla permite ordenar por columnas
y muestra las acciones por fila.

**Acceptance Scenarios**:

1. **Given** la pantalla de usuarios, **When** el usuario hace clic en un encabezado,
   **Then** la tabla se ordena por esa columna.
2. **Given** una tabla con muchas filas, **When** se usa la búsqueda,
   **Then** las filas se filtran.

---

### User Story 4 - Navegación y disposición clara (Priority: P2)

La navegación y la disposición de las páginas (biblioteca, detalle, editor, administración) se
organizan con componentes consistentes (tarjetas, botones, separadores) para una experiencia clara.

**Why this priority**: Consistencia visual y jerarquía clara en toda la aplicación.

**Independent Test**: Recorrer biblioteca, detalle, editor y administración y verificar que usan los
mismos componentes y estilos.

**Acceptance Scenarios**:

1. **Given** la biblioteca, **When** se listan contenidos, **Then** se muestran en tarjetas
   uniformes con iconos de tipo y estado.
2. **Given** el editor, **When** se sube contenido, **Then** el formulario y la tabla de contenidos
   son consistentes con el resto de la app.

---

### Edge Cases

- ¿Qué pasa si el usuario redimensiona la ventana? → Las tablas deben ser responsivas con scroll
  horizontal; las tarjetas se reordenan en grilla.
- ¿Qué sucede con nombres de contenido muy largos? → Se truncan con ellipsis y tooltip/título.
- ¿Cómo se ve la app en pantallas pequeñas? → La navegación colapsa de forma legible (móvil no es
  objetivo, pero no debe romperse).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La app DEBE aplicar la paleta del hospital (verde/lima/amarillo) como tema de UI.
- **FR-002**: La cabecera DEBE mostrar el logo del hospital.
- **FR-003**: La pantalla de login DEBE mostrar el logo y usar la paleta.
- **FR-004**: Los formularios DEBEN validar con esquemas (Zod) y mostrar errores inline.
- **FR-005**: Las tablas de administración DEBEN soportar ordenamiento y búsqueda.
- **FR-006**: Los componentes DEBEN ser accesibles (labels, focus, estados de error).
- **FR-007**: La app DEBE mantener la funcionalidad existente sin regresiones.

### Key Entities

- **Tema**: paleta de colores del hospital aplicada a componentes.
- **Componentes UI**: botones, inputs, tarjetas, tablas, selectores (shadcn/ui).

## Success Criteria *(mandatory)*

- **SC-001**: El 100% de las pantallas usa componentes de la librería y la paleta del hospital.
- **SC-002**: Todos los formularios validan y muestran errores inline antes de enviar.
- **SC-003**: Las tablas de administración permiten ordenar y buscar.
- **SC-004**: La funcionalidad existente sigue operativa tras el rediseño (sin regresiones).

## Assumptions

- Se usa shadcn/ui (estilo new-york) sobre Tailwind CSS v4.
- TanStack Table para tablas, React Hook Form + Zod para formularios.
- El logo (`logo_hs.png`) y la paleta (`paleta_hs.jpeg`) están en `frontend/public`.
- No se introduce modo oscuro en esta iteración (solo tema claro).
