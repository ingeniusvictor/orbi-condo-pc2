# ORBI LIVING — P1H Structured Shift Handover

## Objetivo

Agregar una superficie privada de preparación de relevo para Conserjería, Mayordomía y Administración sin introducir texto libre, PII, estados nuevos ni tablas nuevas.

P1H se apila sobre P1G (#34). P1E Recovery continúa congelado/pending y no se modifica en este corte.

## Ruta

### `/conserjeria/relevo`

La vista reutiliza únicamente:
- `/api/auth/session` y `/api/auth/refresh`;
- `/api/operations/dashboard?date=YYYY-MM-DD` bajo las mismas políticas RLS;
- `/api/operations/shifts/handoff` para la recepción ya autorizada de un turno `confirmed` con responsable.

No existe acceso directo del navegador a Supabase.

## Checklist derivado

La pantalla calcula cuatro verificaciones a partir de datos ya autorizados:
1. cobertura de la jornada (`vacant` / `requested`);
2. incidencias `critical` abiertas;
3. incidencias `high` abiertas;
4. existencia de un turno candidato a relevo y su estado.

El checklist no se persiste. Es una proyección de la jornada, por lo que no crea una segunda fuente de verdad.

## Estado de preparación

La UI comunica uno de los siguientes estados derivados:
- `Atención prioritaria`: existe una incidencia crítica o una vacante;
- `Preparado con observaciones`: existen solicitudes de cobertura o incidencias altas;
- `Listo para recibir`: existe un relevo confirmado con responsable sin señales críticas de cobertura;
- `Relevo recibido`: el turno candidato ya está en `received`;
- `Preparación incompleta`: no hay un relevo confirmado listo.

Estos estados son informativos. No reemplazan la máquina de estados del dominio ni agregan reglas de persistencia.

## Acción de recepción

El botón `Recibir relevo` sólo aparece cuando simultáneamente:
- el usuario posee `confirm_shift_handoff`;
- el turno está `confirmed`;
- existe responsable asignado.

La mutación sigue enviando `assignmentId + expectedRevision` al endpoint controlado existente. Después de la respuesta se recarga el dashboard para evitar trabajar con una revisión obsoleta.

## Privacidad

- SYNTHETIC STAGING ONLY;
- sin nombres de residentes, teléfonos, RUT, patentes, contratos ni narrativa privada;
- sin campo de observaciones libre;
- las incidencias mostradas se limitan a área, prioridad y estado ya visibles por RLS;
- no se expone `staff_private`;
- tokens continúan en cookies HttpOnly;
- no se crea Supabase producción.

## Navegación privada

`PrivateOperationsViewport` y `FloatingNav` tratan `/conserjeria/*` como superficie privada. La navegación flotante pública permanece oculta también en `/conserjeria/relevo`.

Desde `/operaciones` se agrega un acceso `Preparar relevo` junto a `Abrir Conserjería`.

## Responsive

P1H reutiliza la safe-area de Conserjería y añade layout propio para checklist/relevo con objetivos de QA:
- 390×844;
- 430×932;
- 1440×900;
- 1920×1080.

## Gates

Antes de considerar P1H completo:
- `npm run check` GREEN;
- Preview Vercel READY cuando la cuota externa permita generar un nuevo Preview;
- acceso anónimo sin filtración de datos;
- E2E de rol Conserjería/Mayordomía cuando sus cuentas Auth estén confirmadas por flujo soportado;
- E2E de `expectedRevision`/409 cuando existan credenciales sintéticas seguras;
- QA visual manual en los cuatro viewports;
- P1E sigue pendiente;
- producción sigue fuera de alcance.
