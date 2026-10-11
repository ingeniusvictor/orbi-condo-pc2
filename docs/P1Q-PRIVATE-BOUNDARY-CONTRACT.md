# ORBI LIVING — P1Q Private Client/Server Boundary Contract

## Objetivo
Convertir en un contrato CI la frontera arquitectónica ya usada por `/operaciones` y `/conserjeria`: el navegador consume APIs ORBI server-side y no habla directamente con Supabase ni carga secretos/backend internals.

P1Q permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1P (#44) y no cambia P1E Recovery.

## Nuevo contrato
`scripts/test-private-boundaries.mjs` recorre el árbol fuente durante CI.

### Módulos `use client`
Todo archivo cliente dentro de `app/` o `components/` falla si contiene cualquiera de estas señales:
- import de `@supabase/*`;
- construcción directa `createClient(...)`;
- variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` o service-role;
- hostname `*.supabase.co`;
- rutas `/rest/v1/` o `/auth/v1/`;
- marcador `service_role`;
- import de `server-only`;
- import de implementaciones bajo `/server/` o `operations-auth`.

Esto permite `fetch("/api/...")`, que es la frontera esperada.

### Código fuente general
`app/`, `components/`, `data/` y `lib/` fallan si contienen:
- variable service-role;
- connection string PostgreSQL hardcodeada;
- material de private key.

### Archivos de entorno
El working tree falla si contiene `.env*` privado. `.env.example` es la única excepción documental permitida.

## Alcance
El test es preventivo y no reemplaza:
- Auth/RLS;
- secret scanning del proveedor Git;
- revisión humana;
- `qa:operations` autenticado;
- política privada de secretos de producción.

Sí evita una regresión frecuente: que una UI futura omita los endpoints ORBI y empiece a consultar Supabase directamente.

## Quality Gate
Nuevo comando:

`npm run test:private-boundaries`

Orden de `npm run check`:
1. typecheck;
2. private boundary contract;
3. continuity contract;
4. operations domain contract;
5. Next build;
6. anonymous runtime security smoke.

Sin dependencias npm nuevas, sin red y sin credenciales.

## Estado de producción
No cambia. Datos reales y producción continúan bloqueados por los gates abiertos de `PRODUCTION-READINESS-GATE.md`, en particular Auth E2E, QA visual, privacidad, P1E restore y procedimiento PC2.

No fusionar automáticamente el stack.
