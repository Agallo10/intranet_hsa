# Cumplimiento normativo — Intranet Hospitalaria

> **Nota**: Este documento es una guía de apoyo y **no constituye asesoría jurídica**. Valide su
> contenido y los textos legales con la oficina jurídica / responsable de datos de la ESE antes de
> producción. La intranet está pensada para contenido institucional (noticias, tutoriales,
> documentos y formatos de calidad); **no** debe almacenar datos clínicos de pacientes.

## Contexto

Hospital de segundo nivel constituido como **ESE** (Empresa Social del Estado) → entidad pública.
Esto activa, además de la normativa de salud, la de transparencia, gestión documental, accesibilidad
y protección de datos.

## Checklist por norma

### 1. Protección de datos personales — Ley 1581 de 2012 + Decreto 1377 de 2013

| # | Requisito | Estado en la intranet | Acción |
|---|-----------|------------------------|--------|
| 1.1 | Política de tratamiento de datos publicada y accesible | ☐ | Página `/privacidad` pública con el aviso de privacidad y política de tratamiento |
| 1.2 | Autorización del titular para tratar sus datos | ☐ | Aviso en el login; autorización formal por los canales institucionales |
| 1.3 | Finalidad del tratamiento claramente definida | ☐ | Redactar finalidades (gestión de usuarios y accesos) |
| 1.4 | Medidas de seguridad (confidencialidad, integridad) | ✅ | Contraseñas bcrypt, JWT, control de acceso por roles |
| 1.5 | Registro de bases de datos ante la SIC (RNBD) | ☐ | Responsabilidad del responsable de datos de la ESE |
| 1.6 | Derechos del titular (consulta, rectificación, supresión) | ☐ | Documentar el procedimiento/canal de contacto en la política |

### 2. Transparencia y acceso a la información — Ley 1712 de 2014

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 2.1 | Publicar información mínima obligatoria | ☐ | Usar la sección de Noticias para difundir información institucional |
| 2.2 | Canal de rendición de cuentas | ☐ | Coordinar con comunicaciones los contenidos a publicar |

### 3. Gestión documental — Ley 594 de 2000 y AGN

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 3.1 | Documentos con versión oficial y responsable | ☐ | Incluir versión/fecha en los formatos publicados |
| 3.2 | Tablas de Retención Documental (TRD) | ☐ | Alinear la publicación con las TRD de la ESE |
| 3.3 | Conservación y disponibilidad | ✅ | Archivos en disco + backups (`scripts/backup.sh`) |

### 4. Calidad y habilitación — Decreto 1011 de 2006 + Resolución 3100 de 2019

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 4.1 | Formatos alineados con SOGC/PAMEC | ☐ | Validar que los formatos publicados correspondan a versiones aprobadas |
| 4.2 | Control de documentos del SGC | ☐ | Control de cambios/versión en los documentos |

### 5. Historia clínica (fuera de alcance, por confirmar)

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 5.1 | No almacenar datos clínicos en la intranet | ✅ | Confirmar alcance: solo contenido institucional (Ley 23/1981, Res. 1995/1999, Ley 2015/2020 si aplica) |

### 6. Accesibilidad web — Resolución 1519 de 2020 (MinTIC) + WCAG 2.1

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 6.1 | Contraste, navegación por teclado, textos alternativos | ⚠️ | Los componentes de shadcn/ui son accesibles; auditar imágenes/contraste |
| 6.2 | Etiquetas y foco visibles en formularios | ✅ | Labels, focus y estados de error implementados |

### 7. Seguridad de la información — ISO/IEC 27001, Ley 1273 de 2009

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 7.1 | Registro de accesos y eventos (auditoría) | ⚠️ | Implementar bitácora de accesos (login, eliminaciones) — ver spec 005 |
| 7.2 | Control de acceso por roles | ✅ | RBAC: admin, editor, comunicador, lector |
| 7.3 | Contraseñas robustas y cambio forzado | ✅ | bcrypt + cambio obligatorio en primer acceso |
| 7.4 | Sesiones seguras (JWT access + refresh) | ✅ | Implementado |
| 7.5 | Respaldo y continuidad | ✅ | Backups BD + archivos |

### 8. Derechos de autor — Ley 23 de 1982 + Decisión Andina 351 de 1993

| # | Requisito | Estado | Acción |
|---|-----------|--------|--------|
| 8.1 | Contenido con licencia o autorización | ☐ | Verificar derechos de los videos/documentos publicados |

## Resumen de acciones prioritarias para la intranet

1. **Aviso de privacidad / política de tratamiento** (página `/privacidad` + enlace en login).
2. **Registro de accesos** (bitácora de login y eliminaciones, visible para admin).
3. **Contenido legal a completar por la ESE**: responsable del tratamiento, finalidades, derechos del
   titular, canal de contacto y registro RNBD (SIC).
4. **Alineación documental**: versión/fecha en formatos y control de cambios del SGC.
5. **Accesibilidad**: revisión de contraste y textos alternativos en imágenes.

*Última revisión: 2026-09-16.*
