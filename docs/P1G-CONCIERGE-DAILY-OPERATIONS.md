# ORBI LIVING — P1G Concierge Daily Operations

## Objetivo
Crear una superficie privada enfocada en la operación cotidiana de Conserjería sin duplicar backend, ampliar permisos ni introducir datos reales.

P1G permanece **SYNTHETIC STAGING ONLY** y se apila sobre P1F (#33). P1E Recovery continúa pendiente y no se considera resuelto por este trabajo.

## Nueva superficie

### `/conserjeria`
Workspace diario que reutiliza exclusivamente:
- `/api/auth/session` y `/api/auth/refresh` para identidad/sesión;
- `/api/operations/dashboard?date=YYYY-MM-DD` para lectura privada bajo RLS;
- `/api/operations/shifts/report-gap` para reportar ausencia/vacante;
- `/api/operations/shifts/handoff` para registrar recepción de relevo confirmado;
- `/api/operations/incidents/report` para registrar una novedad estructurada.

No introduce escrituras directas a Supabase desde el navegador.

## Alcance funcional
- fecha operativa seleccionable, con acceso rápido a Hoy;
- resumen de turnos, vacantes, reemplazos solicitados e incidencias abiertas;
- identificación del turno actual para la fecha de hoy;
- identificación del próximo relevo;
- alerta de cobertura pendiente para estados `vacant`/`requested`;
- lista de turnos del día con revisión visible;
- lista de incidencias abiertas;
- reporte de vacante cuando el rol posee `report_shift_gap`;
- recepción de relevo únicamente sobre turno `confirmed` con responsable y permiso `confirm_shift_handoff`;
- registro estructurado de incidencia cuando el rol posee `report_incident`.

### Cola de atención operativa
El segundo incremento P1G agrega una cola derivada **sin tablas, estados ni privilegios nuevos**. Se calcula únicamente con el dashboard ya autorizado y prioriza:
1. incidencias `critical`;
2. turnos `vacant`;
3. incidencias `high`;
4. turnos `requested`;
5. relevos `confirmed` con responsable asignado.

La cola muestra como máximo seis señales y sólo expone datos ya visibles para el rol. Para un relevo confirmado, la acción `Recibir` aparece únicamente cuando el permiso `confirm_shift_handoff` ya está presente. Una incidencia de alta prioridad no obtiene controles administrativos adicionales.

## Roles
La UI privada admite `administrator`, `mayordomo` y `concierge`.

Conserjería mantiene un rol operativo, no administrativo:
- puede informar una vacante;
- puede registrar recepción de un relevo ya confirmado;
- puede registrar una incidencia;
- no recibe catálogo `staff_private`;
- no confirma reemplazos ni gestiona el calendario;
- no cambia estado/prioridad/responsable de incidencias.

Mayordomía y Administración conservan sus permisos existentes de P1F, pero P1G no agrega privilegios nuevos.

## Privacidad y seguridad
- staging sintético solamente;
- sin contactos, RUT, patentes, contratos ni narrativas privadas;
- tokens permanecen en cookies HttpOnly del backend;
- toda mutación usa endpoints server-side existentes;
- los turnos continúan protegidos por RLS, transición de dominio y `expectedRevision`;
- el catálogo privado de personal permanece fuera de la vista de Conserjería;
- la cola de atención es una proyección cliente de datos ya autorizados, no una nueva fuente de datos;
- la navegación pública flotante se excluye de `/conserjeria`.

## Responsive
La nueva vista tiene estilos propios y safe-area inferior. Objetivos de QA:
- 390×844;
- 430×932;
- 1440×900;
- 1920×1080.

## Gates antes de considerar el corte completo
- `npm run check` GREEN en el head actual;
- Preview Vercel READY en el head actual;
- acceso sin sesión deriva al acceso privado sin filtrar datos;
- sesión Administración/Mayordomía/Conserjería resuelve correctamente la vista;
- acciones operativas permitidas funcionan con `expectedRevision`;
- acciones administrativas no aparecen para Conserjería;
- QA visual responsive manual;
- no cerrar P1E ni crear Supabase producción.
