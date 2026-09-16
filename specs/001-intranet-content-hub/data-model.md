# Data Model: Intranet de Contenidos Hospitalarios

Base de datos: PostgreSQL. ORM: TypeORM (DataMapper). Tres entidades principales.

## Entidades

### User
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | uuid | PK, generado |
| username | varchar | unique, not null |
| passwordHash | varchar | not null (bcrypt) |
| fullName | varchar | not null |
| role | enum | `admin` \| `editor` \| `lector`, default `lector` |
| isActive | boolean | default `true` |
| createdAt | timestamptz | auto |
| updatedAt | timestamptz | auto |

Relaciones: `contents` (1:N, contenido subido por el usuario).

### Category
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | uuid | PK, generado |
| name | varchar | unique, not null |
| slug | varchar | unique, not null |
| description | text | nullable |
| order | int | default 0 (para ordenar en UI) |
| isActive | boolean | default `true` |
| createdAt | timestamptz | auto |
| updatedAt | timestamptz | auto |

Relaciones: `contents` (1:N). Seed inicial: "Tutoriales en video", "Documentos", "Formatos de
calidad".

### Content
| Campo | Tipo | Restricciones |
|-------|------|---------------|
| id | uuid | PK, generado |
| title | varchar | not null |
| description | text | nullable |
| type | enum | `video` \| `document` |
| filePath | varchar | not null (ruta relativa en `uploads/`) |
| originalName | varchar | nombre original saneado |
| mimeType | varchar | not null |
| sizeBytes | bigint | not null |
| isPublished | boolean | default `false` (borrador/publicado) |
| categoryId | uuid | FK → Category |
| uploadedById | uuid | FK → User |
| createdAt | timestamptz | auto |
| updatedAt | timestamptz | auto |

Relaciones: `category` (N:1), `uploadedBy` (N:1).

## Reglas de validación (derivadas de la especificación)

- `username`: obligatorio, único.
- `passwordHash`: nunca nulo; las contraseñas se validan en el DTO (mín. longitud) antes de hashear.
- `Content.type`: `video` o `document`.
- Tipos de archivo permitidos:
  - video: `video/mp4`, `video/webm`
  - documento: `application/pdf`, `application/msword`,
    `application/vnd.openxmlformats-officedocument.wordprocessingml.document`,
    `application/vnd.ms-excel`,
    `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Tamaño máximo: configurable por variable de entorno (default, p. ej., 2 GB para video).

## Estados y transiciones

- **User**: `active` → `inactive` (desactivación por admin). Un usuario inactivo no inicia sesión.
- **Content**: `draft` (`isPublished=false`) → `published` (`isPublished=true`). Los lectores solo
  ven contenido publicado; editores/admin ven también sus borradores.

## Índices

- `contents(title)`, `contents(description)` (o GIN/trigram si se habilita búsqueda avanzada).
- `contents(category_id)`, `contents(type)`, `contents(created_at)` para filtros.
- `users(username)` (unique ya cubierto), `categories(slug)` (unique).
