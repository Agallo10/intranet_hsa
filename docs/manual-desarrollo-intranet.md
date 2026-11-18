# Manual de desarrollo de la Intranet Hospitalaria

Este manual explica cómo está organizada la intranet y cómo continuar su desarrollo. Está dirigido a desarrolladores y personal técnico que necesiten comprender el proyecto, ejecutarlo localmente y verificar cambios. Describe el estado visible en este repositorio; no pretende reconstruir cada decisión histórica ni afirmar que todas las especificaciones estén desplegadas.

## 1. Propósito

La intranet centraliza contenidos internos del hospital: noticias, documentos y formatos de calidad, tutoriales y cursos, además de herramientas de administración y comunicación. El acceso se controla mediante autenticación y roles.

## 2. Arquitectura

La solución está dividida en una aplicación web, una API y servicios de persistencia y archivos:

| Parte | Tecnología | Responsabilidad |
|---|---|---|
| Interfaz web | React, TypeScript, Vite y Tailwind CSS | Presentar las secciones, formularios y paneles según el acceso del usuario. |
| API | NestJS y TypeScript | Exponer las funciones de autenticación, usuarios, contenidos, noticias, cursos, áreas, auditoría y chat. |
| Base de datos | PostgreSQL con TypeORM | Persistir los datos de la aplicación. |
| Archivos | Disco local en el despliegue | Almacenar documentos y videos; la API controla el acceso y transmite video por HTTP Range. |
| Despliegue | Docker Compose | Ejecutar la aplicación en infraestructura on-premise. |

En el backend, `backend/src/app.module.ts` conecta los módulos funcionales y registra los guardas globales de autenticación JWT y autorización por roles. En el frontend, `frontend/src/App.tsx` define las rutas y aplica `RequireAuth` para las páginas que requieren sesión o roles específicos.

## 3. Roles y acceso

Los permisos se aplican tanto en la interfaz como en la API. Ocultar una opción en pantalla no reemplaza la validación del backend.

| Rol | Alcance principal |
|---|---|
| `admin` | Administración de usuarios, categorías, áreas, auditoría y contenido. |
| `editor` | Gestión de documentos y cursos. |
| `comunicador` | Publicación y gestión de noticias. |
| `gestor_documental` | Carga de documentos, sin permisos para noticias, cursos o videos. |
| `lector` | Consulta de noticias, documentos y tutoriales; acceso al chat. |

La definición funcional vigente de permisos debe verificarse en el código y en las especificaciones de cada función antes de hacer cambios.

## 4. Organización del repositorio

```text
backend/     API NestJS, pruebas y configuración del backend
frontend/    Aplicación React
specs/       Especificaciones y artefactos de funcionalidades
docs/        Documentación del proyecto
scripts/     Tareas operativas, incluido el respaldo
docker-compose.yml  Servicios para despliegue
README.md    Instalación, verificación, despliegue y restauración
```

El backend se organiza en módulos (`auth`, `users`, `contents`, `news`, `courses`, `areas`, `audit`, `chat`, entre otros). El frontend separa páginas, componentes reutilizables, funcionalidades y utilidades dentro de `frontend/src/`.

## 5. Evolución documentada

El repositorio conserva especificaciones funcionales por tema en `specs/`. Su secuencia muestra una ampliación iterativa del alcance:

1. **Base de la intranet**: biblioteca de contenidos, autenticación, roles, búsqueda y administración (`001-intranet-content-hub`).
2. **Experiencia y secciones**: rediseño visual; noticias, cursos y rol comunicador (`002`, `003`).
3. **Administración y seguridad funcional**: eliminación de contenido, contraseñas temporales, privacidad y auditoría (`004`, `005`).
4. **Comunicación y gestión documental**: chat interno y rol gestor documental (`006`, `008`).
5. **Edición y consulta de contenidos**: editor de noticias, previsualización de documentos, modo oscuro y galería (`007`, `009`, `010`).
6. **Ajustes y metadatos documentales**: mejoras de noticias, documentos y login; código, versión y fechas de documentos (`011`, `012`).
7. **Clasificación y tipos documentales**: áreas y panel de administración; documentos editables y columna Tipo (`013`, `014`).

Esta lista resume los nombres y el orden de las especificaciones, no certifica por sí sola qué cambios llegaron a producción. Las especificaciones consultadas indican estado `Draft`; antes de usar una como evidencia de comportamiento implementado, hay que contrastarla con el código y sus pruebas.

## 6. Flujo recomendado para desarrollar una función

1. **Entender el requisito**: revisar la especificación relacionada en `specs/` y precisar escenarios, permisos, validaciones y resultado esperado.
2. **Ubicar la implementación**: identificar la página o componente del frontend y el módulo del backend que participan. Mantener las reglas de autorización en el servidor.
3. **Probar el comportamiento**: cuando exista una prueba determinista aplicable, definir primero el resultado esperado, observar que la prueba falla antes del cambio y volver a ejecutarla después de implementarlo.
4. **Actualizar el alcance relacionado**: añadir o ajustar pruebas y documentación cuando el comportamiento, los comandos o la configuración cambien.
5. **Verificar antes de integrar**: ejecutar las comprobaciones del backend y frontend indicadas en la sección siguiente y revisar los cambios.

## 7. Desarrollo local y verificación

Los pasos completos y las variables de entorno están en el [`README.md`](../README.md). Resumen:

1. Instalar Node.js 20 o superior y disponer de PostgreSQL local.
2. Crear la base de datos `intranet`.
3. En `backend/`, instalar dependencias, preparar `.env` a partir de `.env.example`, ejecutar el seed y levantar NestJS en modo desarrollo.
4. En otra terminal, instalar dependencias en `frontend/` y ejecutar Vite.

Para verificar los cambios:

```bash
cd backend && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run build
```

Ejecutar las pruebas desde la carpeta indicada. Si una comprobación no puede ejecutarse, registrar cuál falló o quedó pendiente y por qué; no asumir que una compilación reemplaza las pruebas.

## 8. Despliegue, datos y seguridad

- El despliegue previsto es on-premise mediante Docker Compose. Seguir el procedimiento actualizado del [`README.md`](../README.md) y revisar `.env.example` antes de configurar el entorno.
- En producción, usar secretos propios y cambiar la contraseña inicial del administrador. No incorporar credenciales reales al repositorio.
- Los archivos se sirven mediante endpoints autenticados; no exponer el directorio de cargas como acceso público.
- En producción, configurar `DB_SYNCHRONIZE=false` y gestionar cambios de esquema con migraciones de TypeORM.
- Respaldar tanto PostgreSQL como los archivos subidos. El repositorio incluye `scripts/backup.sh`; las instrucciones de restauración están en el README.
- Revisar `docs/cumplimiento-normativo.md` y las reglas de auditoría y privacidad al cambiar manejo de datos personales.

## 9. Referencias

- [`README.md`](../README.md): requisitos, inicio local, comandos de verificación, despliegue, backup y restauración.
- [`specs/`](../specs/): especificaciones funcionales por área.
- [`backend/src/app.module.ts`](../backend/src/app.module.ts): composición de módulos y guardas globales del backend.
- [`frontend/src/App.tsx`](../frontend/src/App.tsx): rutas y controles de acceso de la interfaz.
- [`docs/cumplimiento-normativo.md`](cumplimiento-normativo.md): documentación relacionada con privacidad y cumplimiento.
