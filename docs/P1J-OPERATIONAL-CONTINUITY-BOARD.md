# ORBI LIVING — P1J Operational Continuity Board

## Objetivo

Unificar en una sola vista de solo lectura las señales que no deben perderse entre turnos: cobertura, incidencias prioritarias, bitácoras con seguimiento y rondas operativas.

P1J permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1I (#36) y no cambia el estado de P1E Recovery.

## Motivación

P1G/P1H/P1I ya separan correctamente jornada, bitácora y rondas. La operación diaria todavía obligaba al usuario a revisar esas superficies por separado para responder una pregunta simple:

> ¿Qué debe continuar visible cuando cambia el turno?

P1J resuelve esa lectura sin crear una segunda fuente de verdad.

## Implementación

### `ConciergeContinuityBoard`

Componente integrado en `/conserjeria` que consume únicamente endpoints ya autorizados:
- dashboard diario ya cargado por la página;
- `GET /api/operations/shift-log?date=YYYY-MM-DD`;
- `GET /api/operations/rounds?date=YYYY-MM-DD`.

No crea endpoint nuevo, tabla nueva, permiso nuevo ni mutación.

## Señales derivadas

### Bloqueo técnico de cierre
Sólo se marca cuando existe una ronda `open`.

Esto refleja una regla real de P1I: una bitácora no puede cerrarse mientras tenga una ronda abierta. El board no inventa otros bloqueos.

### Cobertura
- `vacant`: señal crítica de continuidad;
- `requested`: seguimiento pendiente de confirmación.

Conserjería continúa sin adquirir permiso para confirmar reemplazos.

### Incidencias
- `critical`: continuidad crítica;
- `high`: continuidad con seguimiento.

Una incidencia prioritaria se mantiene visible, pero no se presenta como bloqueo técnico del cierre de bitácora porque el dominio no define esa regla.

### Bitácora
Se destacan:
- bitácoras cerradas con `pending_followup` o `escalated`;
- cierres con `pendingItemsCount > 0`;
- entradas `handoff_pending` de una bitácora abierta;
- entradas `urgent` de una bitácora abierta.

### Rondas
Se destacan:
- rondas abiertas como bloqueo real de cierre;
- checkpoints `attention` sin incidencia vinculada como evidencia operativa que requiere visibilidad.

Cuando el checkpoint ya está vinculado a una incidencia, el board evita duplicar esa misma señal como observación independiente.

## Estados informativos del board

- **Cierre bloqueado**: existe una ronda abierta.
- **Continuidad crítica**: no hay ronda abierta, pero existe vacante, incidencia crítica o entrada urgente.
- **Continuidad con pendientes**: existen reemplazos solicitados, incidencias altas, cierres con seguimiento, pendientes de relevo o checkpoints en atención.
- **Sin señales pendientes**: ninguna de las condiciones anteriores está presente en la información visible.

Estos estados son derivados y no se persisten.

## Privacidad y seguridad

- no agrega PII;
- no muestra actor IDs;
- no consulta `staff_private`;
- no habilita contactos, unidades, residentes, visitantes, patentes ni datos de ComunidadFeliz;
- no introduce texto libre;
- conserva RLS y permisos existentes en cada endpoint;
- si la sesión expira, reutiliza el único refresh soportado antes de reintentar las lecturas;
- no modifica Supabase staging ni crea Supabase producción.

## UX

El board incluye:
- estado derivado de continuidad;
- métricas de bloqueos, cobertura, incidencias prioritarias y entregas con seguimiento;
- cola priorizada de señales;
- actualización manual;
- timestamp local America/Santiago;
- responsive para escritorio y móvil.

## Relación con P2

P1J **no envía notificaciones** ni contacta personal. El roadmap establece que avisos y escalamiento P2 sólo deben habilitarse después de validar el procedimiento con administración. P1J deja la información preparada sin cruzar ese gate.

## Gates abiertos

- Quality Gate del head P1J;
- Preview Vercel cuando la cuota de deployment lo permita;
- QA visual manual 390×844, 430×932, 1440×900 y 1920×1080;
- E2E autenticado con cuentas sintéticas de Conserjería/Mayordomía cuando estén confirmadas mediante flujo Auth soportado;
- conflicto HTTP 409 autenticado concurrente;
- P1E backup + restore independiente;
- procedimiento operativo PC2 validado antes de P2;
- producción fuera de alcance.

No fusionar automáticamente el stack.
