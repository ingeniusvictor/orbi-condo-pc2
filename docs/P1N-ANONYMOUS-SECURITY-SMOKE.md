# ORBI LIVING — P1N Anonymous Security Smoke

## Objetivo
Añadir al Quality Gate una prueba runtime local que demuestre que el build falla cerrado cuando no existe configuración Supabase ni sesión autenticada.

P1N permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1M (#41) y no cambia P1E Recovery.

## Ejecución
Después de `next build`, `scripts/test-anonymous-security-smoke.mjs` levanta `next start` en `127.0.0.1` y elimina explícitamente del proceso hijo:
- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `ORBI_COMMUNITY_ID`.

No utiliza red externa, credenciales ni staging.

## Contratos verificados
### Sesión sin backend
`GET /api/auth/session` debe responder:
- HTTP 200;
- `configured:false`;
- `authenticated:false`;
- `communityId:null`;
- `role:null`;
- `permissions:[]`;
- `Cache-Control` con `no-store`.

### Lecturas privadas anónimas
Deben responder HTTP 403 + `No autorizado` + `no-store`:
- `/api/operations/dashboard`;
- `/api/operations/shift-log`;
- `/api/operations/rounds`;
- `/api/operations/continuity`.

### Escrituras privadas anónimas
Se prueban representativamente:
- reporte de vacante;
- recepción de relevo;
- reporte de incidencia;
- apertura de bitácora;
- inicio de ronda.

Todas deben rechazar con HTTP 403 antes de cualquier mutación.

### Superficies privadas
`/operaciones` y `/conserjeria` deben renderizar HTTP 200 pero conservar metadata `noindex`.

## Quality Gate
Nuevo comando:

`npm run test:anonymous-security`

Orden final:
1. typecheck;
2. contrato continuidad;
3. contrato dominio operativo;
4. build;
5. smoke runtime anónimo.

## Límites
Este smoke prueba fail-closed sin backend/sesión. No reemplaza:
- Auth real;
- RLS staging;
- QA HTTP autenticado;
- E2E UI por rol;
- restore P1E;
- procedimiento operativo real.

No habilita datos reales, P2 ni producción. No fusionar automáticamente el stack.
