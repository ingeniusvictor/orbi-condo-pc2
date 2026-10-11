# ORBI LIVING — P1M Operations Domain Contracts

## Objetivo
Extender el Quality Gate para proteger las fronteras puras de autorización y estado que sostienen P1C–P1I, sin tocar Supabase ni depender de credenciales.

P1M permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1L (#40) y no cambia P1E Recovery.

## Nuevo contrato ejecutable
`scripts/test-operations-domain.mjs` valida directamente los módulos TypeScript de dominio con Node 22 `--experimental-strip-types`.

### Permisos
Se protege que:
- `resident` no tenga permisos operativos;
- `committee` permanezca en lectura de turnos/revisión de funciones y sin comandos privados;
- `concierge` pueda reportar/recibir y operar bitácora/rondas, pero no solicitar reemplazo, administrar calendario, administrar incidencias, residentes o contratos;
- `mayordomo` pueda administrar la operación y revisar funciones, pero no reciba automáticamente administración de residentes ni contratos;
- `administrator` conserve el set amplio declarado.

Estos tests no reemplazan RLS ni autorización server-side; previenen regresiones accidentales en la matriz de aplicación.

### Turnos
Se congela la matriz actual:
- `planned → vacant | received`;
- `vacant → requested | confirmed | planned`;
- `requested → confirmed | vacant`;
- `confirmed → received | vacant`;
- `received` terminal;
- transición al mismo estado permitida por el helper actual.

También se protege que `confirmed` y `received` requieran responsable asignado.

### Incidencias
Se valida exhaustivamente la matriz actual entre:
`reported`, `acknowledged`, `assigned`, `in_progress`, `resolved`, `closed`.

Incluye invariantes explícitas:
- `in_progress → closed` directo es inválido;
- `reported → closed` directo es inválido;
- `closed` es terminal, salvo no-op al mismo estado.

### Validación estructurada
Se protegen:
- UUID y revisión positiva;
- enums de estado;
- vocabularios cerrados de bitácora;
- `pendingItemsCount` 0..99;
- `caseReference` restringida a `[A-Za-z0-9._-]`, longitud 1..80;
- fecha ISO real `YYYY-MM-DD`;
- tipos/checkpoints/resultados de rondas;
- referencias estructuradas de ronda.

Los tests incluyen valores que simulan texto libre/campos ajenos para comprobar que los vocabularios sigan cerrados.

## Quality Gate
Nuevo comando:

`npm run test:operations-domain`

`npm run check` ejecuta ahora:
1. TypeScript;
2. contrato de continuidad P1L;
3. contrato operacional P1M;
4. build Next.js.

Sin dependencias npm nuevas.

## Límites
- No prueba RLS real: eso permanece cubierto por staging/probes.
- No prueba HTTP autenticado: permanece en `qa:operations`.
- No valida procedimiento humano PC2: sigue pendiente con administración.
- No habilita P2, datos reales ni producción.

## Gates externos
- Preview Vercel del head final;
- QA HTTP autenticado;
- E2E UI Conserjería/Mayordomía;
- QA visual manual;
- conflicto HTTP 409 autenticado;
- P1E restore independiente.

No fusionar automáticamente el stack.
