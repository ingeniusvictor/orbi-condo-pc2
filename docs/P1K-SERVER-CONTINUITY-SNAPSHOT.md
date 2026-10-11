# ORBI LIVING — P1K Server Continuity Snapshot

## Objetivo
Endurecer P1J moviendo la correlación de continuidad operacional desde el navegador hacia un endpoint server-side autorizado.

P1K permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1J (#38) y no modifica el estado de P1E Recovery.

## Problema resuelto
P1J ya mostraba una vista útil de continuidad, pero el cliente debía combinar por separado:
- jornada/cobertura;
- incidencias abiertas;
- bitácoras y entradas;
- rondas y checkpoints.

Eso dejaba lógica operacional duplicada en UI. P1K concentra la derivación en servidor y entrega al navegador sólo un snapshot reducido.

## Endpoint
### `GET /api/operations/continuity?date=YYYY-MM-DD`

Requiere simultáneamente permisos vigentes para:
- `view_shift_schedule`;
- `view_shift_log`;
- `view_operational_round`.

La identidad, comunidad y token se resuelven exclusivamente del lado servidor.

## Fuentes bajo RLS
Para la fecha operativa solicitada:
- `shift_assignments`;
- `shift_logs`;
- `shift_log_entries`;
- `operational_rounds`;
- `operational_round_checks`.

Además consulta incidencias abiertas de la comunidad, aunque provengan de una fecha anterior, porque una incidencia aún abierta debe conservar continuidad hasta resolución/cierre.

## Snapshot seguro
El endpoint devuelve únicamente:
- fecha y timestamp de generación;
- estado derivado;
- métricas agregadas;
- cola priorizada reducida;
- conteo de fuentes consultadas.

No devuelve:
- actor IDs;
- `assignee_staff_id`;
- `staff_private`;
- nombres de personas;
- RUT, teléfonos, correos, unidades, visitantes o patentes;
- narrativa libre adicional.

## Semántica
El único bloqueo técnico de cierre continúa siendo una ronda `open`, porque P1I protege esa regla en backend/PostgreSQL.

El resto son señales de continuidad, no bloqueos inventados:
- vacante;
- reemplazo solicitado;
- incidencia crítica/alta todavía abierta;
- entrada urgente;
- pendiente para relevo;
- cierre anterior con pendientes/escalamiento;
- checkpoint en atención sin incidencia vinculada.

Estados del snapshot:
- `blocked` — existe una ronda abierta;
- `critical` — vacante, incidencia crítica o evidencia urgente;
- `attention` — seguimiento pendiente no bloqueante;
- `clear` — sin señales prioritarias visibles.

## UI
`ConciergeContinuityBoard` deja de combinar respuestas y reglas en el navegador. Sólo consume `/api/operations/continuity` y renderiza:
- estado;
- métricas;
- cola de continuidad;
- hora de generación America/Santiago.

Mantiene refresh de sesión controlado si el access token expiró.

## Cambios de persistencia
Ninguno.

P1K no agrega:
- tablas;
- migraciones;
- triggers;
- permisos;
- mutaciones;
- datos reales.

## Gates
- Quality Gate / typecheck / build;
- Preview del head final cuando Vercel permita deployment;
- HTTP 403 sin sesión sobre el nuevo endpoint;
- E2E autenticado con cuenta sintética confirmada;
- QA visual manual 390×844, 430×932, 1440×900 y 1920×1080;
- P1E restore independiente;
- procedimiento PC2 validado antes de cualquier P2.

No fusionar automáticamente el stack ni habilitar producción/datos reales.
