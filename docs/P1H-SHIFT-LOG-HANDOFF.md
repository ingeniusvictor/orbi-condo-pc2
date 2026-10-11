# ORBI LIVING — P1H Shift Log + Structured Handoff

## Objetivo
Convertir la superficie privada de Conserjería en una bitácora operativa de turno real, manteniendo el entorno en **SYNTHETIC STAGING ONLY**.

P1H se apila sobre P1G (#34) y no cambia el estado de P1E Recovery: backup + restore independiente continúa pendiente.

## Modelo

### `shift_logs`
Una bitácora por `shift_assignment`.

Estados:
- `open`
- `closed`

Apertura:
- actor autenticado;
- turno de la jornada Santiago actual;
- turno con responsable;
- no permite apertura sobre `vacant` o `requested`;
- una sola bitácora por turno.

Cierre:
- transición única `open → closed`;
- un registro cerrado es inmutable;
- cierre con revisión optimista;
- checklist estructurado obligatorio;
- `revision` incrementa mediante trigger.

Checklist de cierre:
- resultado `normal | pending_followup | escalated`;
- estado de control de acceso `normal | attention`;
- estado de equipos/puesto `normal | attention`;
- incidencias abiertas revisadas: obligatorio `true`;
- cantidad de pendientes `0..99`.

Semántica protegida también en PostgreSQL:
- `normal` exige 0 pendientes + acceso normal + equipos normales;
- `pending_followup` exige al menos un pendiente;
- `escalated` exige pendiente o una condición en atención.

### `shift_log_entries`
Entradas append-only, sin UPDATE ni DELETE.

Tipos estructurados:
- ronda / chequeo;
- flujo de visitas;
- recepción / entrega;
- chequeo de equipos;
- aviso de mantención;
- seguimiento de incidencia;
- pendiente para relevo;
- otro registro estructurado.

Categorías:
- acceso;
- seguridad;
- mantención;
- servicios;
- atención residente;
- recepción;
- otro.

Severidad:
- informativo;
- atención;
- urgente.

No existe narrativa libre en este corte. La referencia opcional acepta únicamente una clave corta sintética con caracteres restringidos.

## Endpoints server-side

### `GET /api/operations/shift-log?date=YYYY-MM-DD`
Requiere `view_shift_log`.

Devuelve solo bitácoras y entradas de la comunidad autenticada bajo RLS. No devuelve actor IDs.

### `POST /api/operations/shift-log/open`
Requiere `write_shift_log`.

Entrada:
- `assignmentId`;
- `expectedAssignmentRevision`.

Valida estado, responsable, fecha operativa Santiago y conflicto de revisión antes de crear.

### `POST /api/operations/shift-log/entry`
Requiere `write_shift_log`.

Solo permite escribir sobre bitácora abierta. Un `incident_followup` exige incidencia vinculada de la misma comunidad.

### `POST /api/operations/shift-log/close`
Requiere `close_shift_log`.

Entrada:
- `logId`;
- `expectedRevision`;
- checklist estructurado.

La escritura usa filtro por revisión y estado `open`; un conflicto devuelve HTTP 409.

## Permisos
`administrator`, `mayordomo` y `concierge` reciben:
- `view_shift_log`;
- `write_shift_log`;
- `close_shift_log`.

`committee` y `resident` no reciben acceso a la bitácora privada.

Esto no otorga a Conserjería permisos para administrar cobertura, confirmar reemplazos o modificar incidencias fuera de sus acciones existentes.

## RLS y evidencia staging
Migraciones aplicadas únicamente en `orbi-living-pc2-staging`:
- `p1h_shift_log_handoff`;
- `p1h_shift_log_closure_invariants`;
- `p1h_shift_log_fk_indexes`.

Pruebas RLS:
- Conserjería: puede ver las 2 bitácoras sintéticas y sus 2 entradas;
- Comité: ve 0 bitácoras y 0 entradas;
- los inserts y el cierre fueron ejecutados bajo rol `authenticated`, no como bypass de RLS.

Fixtures sintéticos actuales para `2026-10-10`:
- `Conserjería AM`: bitácora `open`, revisión 1, una entrada `routine_check`;
- `Cobertura especial`: bitácora `closed`, revisión 2, una entrada `equipment_check`, cierre `pending_followup`, equipos `attention`, un pendiente.

El cierre de `Cobertura especial` valida:
- RLS de UPDATE;
- trigger de transición;
- trigger de revisión;
- constraint semántico;
- auditoría.

## UI `/conserjeria`
Nueva sección **Bitácora de turno — Apertura, novedades y entrega**.

Incluye:
- listado de turnos con estado `SIN ABRIR / ABIERTA / CERRADA`;
- apertura sobre turnos elegibles de hoy;
- timeline de entradas;
- alta estructurada de novedades;
- vínculo opcional con incidencia abierta;
- checklist de cierre;
- resumen de entrega histórica cerrada;
- responsive específico para móvil/escritorio.

## Performance / security advisors
Después de DDL:
- no existen nuevos avisos de RLS;
- los 4 FKs de actor incorporados por P1H quedaron cubiertos por índices;
- permanecen avisos `unused_index`, esperables en staging con dataset mínimo;
- permanece el aviso conocido `Leaked Password Protection Disabled`, reservado para el gate de Auth/producción.

## Gates que siguen abiertos
- QA visual manual 390×844, 430×932, 1440×900 y 1920×1080;
- login/UI por cuenta Auth confirmada de Conserjería y Mayordomía;
- ejecución autenticada de los nuevos endpoints a través del navegador/harness;
- P1F HTTP 409 concurrente con credenciales sintéticas seguras;
- P1E backup + restore independiente;
- rate limiting / MFA / password policy de producción;
- procedimiento PC2 validado;
- Supabase producción.

No marcar P1E ni producción como completos por este corte.
