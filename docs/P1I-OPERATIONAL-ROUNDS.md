# ORBI LIVING — P1I Operational Rounds

## Objetivo
Añadir rondas/checklists estructurados a la operación diaria de Conserjería, siempre ligados a una bitácora de turno abierta y sin introducir narrativa libre o datos personales.

P1I permanece **SYNTHETIC STAGING ONLY** y se apila sobre P1H (#35). P1E Recovery sigue pendiente.

## Modelo

### `operational_rounds`
Representa una ronda dentro de una `shift_log`.

Tipos:
- `opening`;
- `routine`;
- `exception`.

Estados:
- `open`;
- `completed`.

Reglas:
- solo puede iniciarse con bitácora de turno abierta;
- solo una ronda puede permanecer abierta por bitácora a la vez;
- una ronda completada es inmutable;
- completar exige al menos un checkpoint;
- una ronda solo puede completarse mientras la bitácora padre permanezca abierta;
- la revisión se incrementa mediante el trigger operacional existente.

### `operational_round_checks`
Checkpoints append-only ligados a una ronda.

Checkpoints permitidos:
- `access_control`;
- `common_areas`;
- `safety_equipment`;
- `utilities`;
- `perimeter`;
- `handoff_readiness`;
- `other`.

Resultados:
- `ok`;
- `attention`;
- `not_applicable`.

Cada checkpoint puede registrarse una sola vez por ronda.

Un resultado `attention` exige evidencia estructurada:
- una incidencia de la misma comunidad; o
- una referencia sintética corta restringida.

Una incidencia solo puede vincularse a un resultado `attention`.

## Integración con cierre de turno
P1I añade una barrera adicional a P1H:

> una `shift_log` no puede pasar a `closed` mientras tenga una ronda `open`.

La regla está protegida en PostgreSQL mediante trigger y también se consulta en el endpoint de cierre para devolver HTTP 409 con un mensaje claro antes del PATCH.

## Permisos
Los roles `administrator`, `mayordomo` y `concierge` reciben:
- `view_operational_round`;
- `write_operational_round`;
- `complete_operational_round`.

`committee` y `resident` no reciben acceso a rondas privadas.

P1I no amplía los privilegios administrativos de Conserjería sobre cobertura, reemplazos o gestión de incidencias.

## Endpoints

### `GET /api/operations/rounds?date=YYYY-MM-DD`
Requiere `view_operational_round`.

Devuelve rondas/checkpoints de la fecha solicitada bajo RLS, sin actor IDs.

### `POST /api/operations/rounds/start`
Requiere `write_operational_round`.

Entrada:
- `shiftLogId`;
- `roundType`.

Valida:
- bitácora abierta;
- jornada Santiago actual;
- ausencia de otra ronda abierta.

### `POST /api/operations/rounds/check`
Requiere `write_operational_round`.

Valida:
- ronda abierta;
- checkpoint y resultado permitidos;
- no duplicación de checkpoint;
- incidencia de la misma comunidad cuando se vincula;
- evidencia obligatoria para `attention`.

### `POST /api/operations/rounds/complete`
Requiere `complete_operational_round`.

Entrada:
- `roundId`;
- `expectedRevision`.

Valida revisión optimista, estado abierto y existencia de al menos un checkpoint. Un conflicto devuelve 409.

## UI `/conserjeria`
Nueva sección **Rondas operativas — Checkpoints del turno** integrada a la misma fecha operativa del dashboard.

Incluye:
- inicio de ronda desde bitácora abierta;
- tipo apertura/rutina/excepción;
- listado de rondas históricas y en curso;
- checkpoints disponibles sin duplicados;
- resultado OK / Atención / N/A;
- vínculo opcional con incidencia;
- referencia sintética restringida;
- completar ronda y sellar evidencia;
- responsive móvil/escritorio.

## Evidencia staging
Migraciones aplicadas solo a `orbi-living-pc2-staging`:
- `p1i_operational_rounds`;
- `p1i_round_concurrency`.

Fixtures para `2026-10-10`, sobre la bitácora sintética `Conserjería AM`:
- ronda `opening`: `completed`, revisión 2, dos checkpoints, uno en `attention` con referencia sintética;
- ronda `routine`: `open`, revisión 1, un checkpoint `safety_equipment = ok`.

RLS:
- Conserjería: 2 rondas / 3 checkpoints visibles;
- Comité: 0 rondas / 0 checkpoints visibles.

Invariantes negativas ejecutadas con rollback bajo rol Conserjería:
- segunda ronda abierta sobre la misma bitácora: RECHAZADA;
- cierre de bitácora con ronda abierta: RECHAZADO;
- modificación/reapertura de ronda completada: RECHAZADA;
- nuevo checkpoint sobre ronda completada: RECHAZADO;
- `attention` sin incidencia ni referencia: RECHAZADO.

## Advisors
Después de DDL:
- sin nuevos avisos RLS;
- sin foreign keys nuevas sin índice;
- permanecen únicamente avisos `unused_index`, esperables con el dataset sintético mínimo;
- permanece el warning conocido de Auth `Leaked Password Protection Disabled`, reservado para el gate de seguridad/producción.

## Gates abiertos
- QA visual manual 390×844, 430×932, 1440×900 y 1920×1080;
- E2E UI con Auth confirmado de Conserjería/Mayordomía;
- E2E HTTP autenticado de start/check/complete;
- conflicto HTTP 409 autenticado concurrente;
- P1E backup + restore independiente;
- rate limiting / MFA / password policy de producción;
- procedimiento PC2 validado;
- Supabase producción.

No fusionar automáticamente el stack ni declarar P1E/producción completos.
