# P1Y · Hermetic Operations Role HTTP Contract

## Objetivo

Proteger en CI la matriz de permisos operativos a través de los Route Handlers reales, no sólo mediante funciones puras de dominio.

## Entorno

El harness `scripts/test-operations-role-http-hermetic.mjs` levanta:

- el build real de Next.js con `next start`;
- un upstream Auth/PostgREST sintético local;
- identidades sintéticas para `administrator`, `mayordomo`, `concierge`, `committee` y `resident`;
- ninguna red externa, credencial real ni dato real.

## Fronteras protegidas

### Conserjería

Puede:
- reportar una brecha de turno mediante `POST /api/operations/shifts/report-gap`;
- conservar permisos declarados de relevo, bitácora, ronda y reporte de incidencia.

No puede:
- acceder a `POST /api/operations/shifts/command` (`manage_shift_schedule`);
- acceder a `POST /api/operations/incidents/command` (`manage_incident`);
- solicitar reemplazo ni revisar contratos de personal.

Las denegaciones deben ocurrir antes de cualquier lectura o PATCH del recurso.

### Mayordomía

Puede:
- administrar el lifecycle de turnos;
- administrar el lifecycle de incidencias;
- solicitar reemplazos y revisar funciones de personal.

No obtiene:
- `manage_resident`;
- `review_staff_contract`.

### Comité

Permanece limitado a lectura/revisión declarada y no puede reportar brechas ni administrar operaciones.

### Residente

Su sesión operativa contiene permisos vacíos y ninguna mutación puede alcanzar recursos.

### Administración

La sesión expone la superficie administrativa completa declarada, incluida administración de turnos, incidencias, residentes y revisión contractual.

## Invariantes HTTP

- La identidad siempre se verifica contra `/auth/v1/user`.
- El rol se resuelve desde la membresía server-side de `pc2`.
- Ningún rol se toma del body ni del cliente.
- Las denegaciones devuelven HTTP 403 `No autorizado` antes de acceso al recurso.
- Las respuestas privadas mantienen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` y ausencia de CORS opt-in.

## Seguridad

- **SYNTHETIC STAGING ONLY**.
- Sin cambios de permisos, tablas, RLS, Auth o producción.
- Este contrato complementa, pero no reemplaza, el Auth E2E real de staging.

## Dependencia

P1Y se apila sobre P1X / PR #52. No fusionar automáticamente ni invertir el orden del stack.
