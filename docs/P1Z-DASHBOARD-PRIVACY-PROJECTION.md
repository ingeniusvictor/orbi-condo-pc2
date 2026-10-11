# P1Z · Dashboard Privacy Projection Contract

## Objetivo

Proteger en CI la minimización de datos del dashboard privado por rol, comprobando tanto qué recursos consulta el servidor como qué campos entrega al cliente.

## Contrato por rol

### Conserjería
- puede recibir turnos, incidencias y actividad operativa estructurada;
- **no consulta `staff_private`**;
- recibe `staff: []`;
- nunca recibe `assignee_staff_id` ni el UUID privado de la persona asignada;
- sólo recibe `hasAssignee` como señal booleana.

### Mayordomía
- puede consultar el catálogo privado de personal elegible para cobertura;
- recibe únicamente la proyección `id + displayName + staffFunction` ya declarada;
- el turno sigue sin exponer `assignee_staff_id`.

### Comité
- puede recibir el resumen de turnos permitido por su rol;
- no consulta `staff_private`;
- no consulta `shift_events` ni `incident_events`;
- recibe `staff: []` y `recentActivity: []`;
- tampoco recibe IDs privados de asignación.

### Residente
- no puede alcanzar `/api/operations/dashboard`;
- el HTTP 403 ocurre antes de cualquier consulta de recurso.

## Invariantes
- El filtro se aplica server-side a partir de la identidad verificada.
- La ausencia de datos privados no depende de ocultamiento CSS ni de lógica cliente.
- Las respuestas privadas mantienen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` y no habilitan CORS.
- No se modifica la matriz de permisos, RLS ni el esquema.

## Seguridad
- **SYNTHETIC STAGING ONLY**.
- El harness usa IDs, nombres, tokens y registros exclusivamente sintéticos.
- Sin red externa, secretos, PII real, Supabase staging ni producción.

## Dependencia

P1Z se apila sobre P1Y / PR #53. No fusionar automáticamente ni invertir el orden del stack.
