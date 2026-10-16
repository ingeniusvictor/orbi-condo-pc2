# ORBI LIVING — Administrator Readiness Handoff

## Estado de corte

**ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · NO REAL DATA · PRODUCTION BLOCKED · P1E FROZEN · P2 BLOCKED**

Este documento separa lo que ORBI ya puede cerrar por ingeniería de las decisiones que todavía requieren validación humana. La ausencia temporal de respuestas de Administración **no bloquea trabajo técnico independiente**, pero ninguna decisión pendiente se presume, inventa ni marca como aprobada.

Baseline técnico inmediatamente anterior a esta reconciliación: `main@087745e3d314c984530b207c49deedd2e5b0394e` (PR #89).

## 1. Ingeniería cerrada en el corte Administrator-only

A esta fecha ya existe evidencia técnica para:

- ciclo de autenticación Administrator: login → session → refresh → logout;
- permisos exactos y aislamiento por comunidad/rol;
- operaciones controladas, revisión optimista y conflictos HTTP `409`;
- write lifecycle de bitácora y rondas en staging;
- QA responsive, teclado/foco y límites de interfaz de Administración;
- minimización de payloads privados y contrato de privacidad del dashboard;
- correlación técnica `x-orbi-request-id` y observabilidad de Preview sin payloads/PII;
- error boundaries y referencias técnicas seguras en la interfaz;
- protección ante resultados ambiguos y creación idempotente de incidencias;
- cookies de sesión con scope mínimo;
- origin/CSRF guard para mutaciones privadas;
- autorización obligatoria antes del primer acceso de datos en APIs operativas;
- límite de tamaño y `Content-Type` para requests privados;
- CSP estructural compatible con Next.js;
- refresh temporal fail-closed sin destruir una sesión válida;
- gate visual de sesión que no monta workspace/login frente a estados ambiguos;
- Next.js `16.4.1` y React/ReactDOM `19.2.8` en baseline revisado;
- dependencias directas fijadas, transitivos Motion críticos fijados y `package-lock.json` reproducible;
- GitHub Quality Gate con `npm ci` en Node 22 y Node 24;
- rehearsal read-only de release recovery en Preview;
- recomendación técnica de región/residencia sin aplicar configuración de Production.

Estos cierres **no equivalen** a autorización para cargar datos reales ni promover el stack privado a Production.

## 2. Decisiones que sí deben venir de Administración

Administración sólo necesita responder cuestiones operativas que conoce desde su trabajo diario. El cuestionario vigente es `docs/ADMINISTRATOR-OPERATIONS-QUESTIONNAIRE.md`.

Continúan pendientes, entre otras:

- horario real de cobertura domingo/feriado nocturno;
- quién puede activar un reemplazo;
- canal y criterio de aceptación/confirmación del reemplazo;
- procedimiento de entrega de turno;
- contactos/canal y ruta fuera de horario para emergencias;
- regla del pool autorizado de reemplazo;
- significado práctico de bitácora, rondas y estados de continuidad.

Estas respuestas cierran G7 cuando exista evidencia suficiente. **No se provisionan Mayordomía, Conserjería, Committee ni Resident para obtenerlas.**

## 3. Decisiones de privacidad/gobierno que no se delegan como preguntas técnicas

El inventario técnico ya existe, pero G5 de uso real permanece pendiente. Antes de datos reales debe aprobarse en lenguaje comprensible:

- finalidad real de cada familia de datos privados;
- quién puede acceder y para qué;
- procedimiento de corrección/desactivación;
- acceso y retención de auditoría;
- política de exportación;
- enfoque para documentos privados si entran en alcance;
- aviso/procedimiento interno aplicable a operación chilena.

**No se inventan plazos de retención.** Los documentos técnicos actuales son propuestas/borradores hasta aprobación expresa.

## 4. Decisiones futuras de Production

También permanecen fuera del alcance staging-only actual:

- proyecto/plan Supabase Production y secretos independientes;
- MFA/password policy de Production;
- leaked-password protection o controles compensatorios;
- región/residencia final y revisión legal/contractual;
- responsable de alertas, retención de logs, SLO/umbrales y eventual proveedor/drain;
- activación de Vercel Firewall para login cuando sea seguro afectar tráfico Production;
- aprobación del procedimiento real de rollback de aplicación;
- recuperación de base de datos, que continúa separada bajo P1E.

La recomendación técnica regional y el rehearsal de release recovery **no son aprobaciones de Production**.

## 5. P1E sigue congelado

No se reabre backup/restore por este handoff. Para uso real seguirá siendo obligatorio completar, cuando el usuario lo autorice expresamente:

- backup lógico y hashes;
- copia cifrada fuera del proyecto;
- target independiente;
- restore completo;
- validación de filas/invariantes/RLS;
- tiempo de recuperación y procedimiento operativo.

Hasta entonces no se afirma recovery de base de datos probado.

## 6. Cómo procesar respuestas cuando lleguen

Cuando Administración responda, ORBI debe:

1. registrar únicamente la **decisión operativa**, sin copiar PII, teléfonos, secretos ni datos reales a GitHub/PRs;
2. mapear cada respuesta al gate G5/G7 correspondiente;
3. convertir sólo decisiones confirmadas en reglas/configuración/tests;
4. mantener cualquier punto ambiguo en `PENDIENTE`;
5. repetir la certificación Administrator-only necesaria antes de cambiar el estado del gate.

Los nombres, teléfonos, documentos o contactos reales que eventualmente sean necesarios deberán manejarse por un canal privado aprobado, nunca como contenido del repositorio.

## Regla de avance

Mientras las respuestas estén pendientes, ORBI puede continuar con ingeniería independiente que no invente reglas del condominio y no toque Production, P1E ni roles diferidos. Cuando ya no queden cierres técnicos independientes útiles, el proyecto debe esperar las decisiones reales en vez de fabricar supuestos.

**ENGINEERING EVIDENCE CONSOLIDATED · ADMINISTRATION DECISIONS PENDING · PRODUCTION REMAINS BLOCKED**
