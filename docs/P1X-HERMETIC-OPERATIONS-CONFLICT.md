# P1X · Hermetic Operations Conflict Contract

## Objetivo

Cerrar en CI el contrato de concurrencia optimista de los comandos operativos privados sin tocar Supabase staging, credenciales reales ni datos reales.

## Superficie cubierta

El harness `scripts/test-operations-conflict-hermetic.mjs` levanta:

- el build real de Next.js con `next start`;
- un upstream Auth/PostgREST sintético local;
- una identidad sintética `concierge` activa en `pc2`;
- un turno sintético con UUID y revisión controlados.

El endpoint ejercitado es `POST /api/operations/shifts/report-gap`.

## Casos protegidos

1. **Revisión obsoleta antes de mutar**
   - el cliente envía `expectedRevision=4`;
   - el servidor relee revisión `5`;
   - responde HTTP 409 con `currentRevision:5`;
   - no se ejecuta PATCH.

2. **Transición de lifecycle inválida**
   - el turno releído está `received`;
   - `received → vacant` no está permitido;
   - responde HTTP 409;
   - no se ejecuta PATCH.

3. **Carrera entre read y write**
   - la revisión releída coincide;
   - el PATCH conserva `revision=eq.5`, `id` y `community_id`;
   - PostgREST sintético devuelve cero filas, simulando que otro actor ganó la carrera;
   - responde HTTP 409 `Conflicto de edición`.

4. **Camino exitoso**
   - la revisión coincide y el PATCH devuelve exactamente una fila;
   - responde HTTP 200;
   - el body de mutación es estructurado: `status=vacant`, `assignee_staff_id=null`, `updated_by=<actor>`;
   - el filtro de compare-and-swap por revisión se mantiene.

## Invariantes

- Cada comando vuelve a validar identidad y membresía activa contra el upstream.
- Cada comando vuelve a leer el estado actual del turno antes de mutar.
- Sólo los escenarios `race` y `success` pueden alcanzar PATCH.
- Las respuestas privadas mantienen `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` y no habilitan CORS.
- No se añaden estados, permisos, tablas ni rutas nuevas.
- No se modifica RLS ni la base de datos.

## Alcance de seguridad

- **SYNTHETIC STAGING ONLY**.
- Sin red externa durante el harness.
- Sin secretos ni credenciales reales.
- Sin Supabase staging ni producción.
- No reemplaza el gate externo de HTTP 409 real en staging; lo complementa demostrando primero la semántica de la aplicación de forma determinista.

## Dependencia

P1X se apila sobre P1W / PR #51. No fusionar automáticamente ni invertir el orden del stack.
