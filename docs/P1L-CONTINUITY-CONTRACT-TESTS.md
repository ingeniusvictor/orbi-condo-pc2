# ORBI LIVING — P1L Continuity Contract Tests

## Objetivo
Convertir las reglas derivadas de continuidad operacional en un contrato ejecutable dentro del Quality Gate, sin depender de Supabase, credenciales o navegador.

P1L permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1K (#39) y no modifica P1E Recovery.

## Refactor
La lógica pura se extrae a `data/continuity-model.ts` mediante `deriveContinuityModel()`.

El endpoint `/api/operations/continuity` conserva exclusivamente la responsabilidad de:
- autenticar y autorizar;
- consultar datos bajo RLS;
- validar la fecha;
- mapear respuestas de PostgREST;
- añadir timestamp de generación.

La clasificación operacional se realiza en el modelo testeable compartido.

## Casos protegidos por CI
`scripts/test-continuity-model.mjs` valida:
1. jornada sin señales → `clear`;
2. ronda abierta → `blocked` y único bloqueo técnico de cierre;
3. incidencia crítica → `critical`, pero no bloqueo técnico;
4. vacante → `critical`, sin inventar bloqueo de cierre;
5. reemplazo solicitado + incidencia alta → `attention`;
6. entrada urgente de bitácora abierta → `critical`;
7. cierre con pendientes → `attention`;
8. checkpoint `attention` con incidencia vinculada no duplica señal; sin vínculo sí genera seguimiento;
9. el modelo no expone IDs internos de recursos;
10. la cola se limita a 24 ítems sin alterar métricas totales.

## Ejecución
Nuevo comando:

`npm run test:continuity`

Usa Node 22 `--experimental-strip-types` para ejecutar la función TypeScript sin introducir dependencias nuevas.

`npm run check` pasa a ejecutar:
1. `typecheck`;
2. `test:continuity`;
3. `build`.

Por lo tanto, todo PR futuro que altere accidentalmente la semántica de continuidad rompe el Quality Gate antes de merge.

## Seguridad
- sin datos reales;
- sin red;
- sin secretos;
- sin conexión a Supabase;
- sin mutaciones;
- sin dependencias npm adicionales.

## Gates externos que continúan abiertos
- Preview Vercel del head correspondiente;
- `qa:operations` HTTP autenticado con credenciales sintéticas seguras;
- QA visual manual;
- P1E restore independiente;
- procedimiento operativo PC2 antes de P2;
- producción.

No fusionar automáticamente el stack.
