# ORBI LIVING — Release / Recovery Runbook

## Estado
**BORRADOR TÉCNICO · NO APROBADO PARA PRODUCTION · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY**

Este runbook permite preparar y ensayar recuperación de releases sin esperar las decisiones operativas del condominio. No habilita Production, no reabre P1E y no autoriza datos reales.

## Principio principal

La recuperación de la **aplicación** y la recuperación de la **base de datos** son dos problemas distintos.

- Una falla exclusivamente de aplicación puede resolverse volviendo a un deployment de aplicación previamente verificado.
- Una falla de esquema/datos no se resuelve automáticamente haciendo rollback de la aplicación.
- Una restauración de base de datos pertenece a **P1E**, que continúa congelado/pending.

Nunca asumir que “volver el frontend” revierte una migración ya aplicada.

---

# A. Recuperación de aplicación

## A1. Condiciones antes de considerar rollback

1. Identificar el deployment afectado por **deployment ID + Git SHA**, no sólo por un alias mutable.
2. Confirmar que el incidente corresponde a la aplicación y no a datos/esquema incompatibles.
3. Identificar un deployment conocido-bueno que haya pasado los gates exigidos para ese ambiente.
4. Verificar que el deployment conocido-bueno corresponde al mismo proyecto ORBI LIVING y a un commit revisado.
5. No usar un deployment histórico de Production como evidencia de aprobación del stack privado actual.

## A2. Ensayo permitido hoy — Preview solamente

Durante el cut actual se permite un **recovery rehearsal sin mutación**:

- listar deployments Preview READY;
- seleccionar uno por deployment ID y Git SHA;
- verificar que su metadata corresponde al repo/proyecto esperados;
- consultar una ruta privada no destructiva como `/api/auth/session`;
- comprobar status HTTP, headers privados y que no existe exposición de tokens;
- revisar Runtime Logs de Preview cuando sea necesario;
- guardar evidencia no sensible del resultado.

El ensayo actual **no** ejecuta `rollback`, `promote`, asignación de alias Production ni creación de un deployment Production.

## A3. Procedimiento futuro de Production — bloqueado hoy

Cuando Production esté explícitamente autorizada, un rollback de aplicación deberá seguir esta secuencia:

1. Confirmar el incidente mediante health checks/logs.
2. Congelar nuevas promociones mientras se evalúa el incidente.
3. Identificar el deployment Production actual y el deployment conocido-bueno permitido por el plan vigente.
4. Verificar deployment ID, SHA, estado y compatibilidad de esquema.
5. Obtener autorización explícita del responsable definido para Production.
6. Ejecutar el rollback de Vercel al deployment aprobado.
7. Verificar rutas críticas, autenticación, errores 5xx y correlación de requests.
8. Registrar deployment origen, deployment destino, SHA, hora, motivo y resultado sin copiar PII.
9. Corregir la causa en una rama/PR; el rollback no reemplaza la corrección permanente.

**Limitación actual verificada:** el equipo `orbi4` está en plan Hobby. La documentación de Vercel consultada el 2026-10-16 indica que Hobby limita rollback al deployment Production inmediatamente anterior. Esta condición debe volver a comprobarse antes de habilitar Production porque plan y producto pueden cambiar.

---

# B. Compatibilidad aplicación ↔ base de datos

Antes de cualquier rollback de aplicación, clasificar el cambio:

### Clase 1 — Sólo aplicación, esquema compatible
Puede ser candidato a rollback de aplicación, sujeto a aprobación y verificación.

### Clase 2 — Aplicación + migración compatible hacia atrás
El rollback de aplicación sólo es candidato si la versión anterior entiende el esquema actual y esa compatibilidad está demostrada.

### Clase 3 — Migración incompatible o cambio destructivo
**No hacer rollback ciego de la aplicación.** Preparar una corrección forward-compatible o escalar al procedimiento de recuperación de datos correspondiente.

La ausencia de una prueba de compatibilidad se trata como **incompatible hasta demostrar lo contrario**.

---

# C. Recuperación de base de datos

## C1. Caso normal: corrección forward

Si el problema es una migración lógica pero no existe pérdida/corrupción que exija restore:

1. detener nuevas mutaciones relacionadas si corresponde;
2. reproducir el problema con datos sintéticos;
3. preparar una **migración compensatoria/forward-fix** en una rama;
4. pasar revisión, contratos y staging;
5. aplicar únicamente después del gate correspondiente.

No usar como procedimiento de emergencia genérico:

- `DROP TABLE`;
- `TRUNCATE`;
- borrado masivo para “volver atrás”;
- edición directa de tablas internas de Supabase Auth;
- SQL manual no registrado como sustituto de una migración revisada.

## C2. Caso de pérdida/corrupción que requiere restore

Si la recuperación exige restaurar un backup, **detener este runbook** y pasar a P1E.

Estado actual:

- P1E está congelado/pending por decisión del proyecto;
- no existe evidencia de restore independiente certificado;
- por tanto, este runbook **no puede declarar recuperación de datos restaurable** todavía.

No se debe maquillar esta limitación haciendo una migración destructiva ni convirtiendo staging en Production.

---

# D. Evidencia mínima de una recuperación

La evidencia técnica debe registrar sólo:

- ambiente (`preview` / futura `production`);
- project ID/nombre;
- deployment ID origen/destino;
- Git SHA origen/destino;
- resultado de health checks;
- Quality Gate asociado;
- timestamps técnicos;
- resultado final (`restored`, `failed`, `escalated`).

No registrar bodies privados, correos, nombres, RUT, teléfonos, tokens, cookies, incident narratives ni datos de residentes/personal.

---

# E. Stop conditions

Detener cualquier acción y escalar si ocurre cualquiera de estas condiciones:

- no se puede demostrar qué SHA corresponde al deployment;
- el candidato conocido-bueno no pasó gates requeridos;
- existe duda de compatibilidad de esquema;
- el incidente implica pérdida/corrupción de datos;
- la recuperación exigiría P1E mientras P1E siga congelado;
- la acción tocaría Production sin autorización explícita;
- la única salida propuesta requiere secretos compartidos en chat/logs o SQL destructivo no revisado.

---

# F. Estado del rehearsal actual

La evidencia del rehearsal read-only de staging se conserva en:

`docs/evidence/STAGING-RELEASE-RECOVERY-REHEARSAL-2026-10-16.json`

Ese archivo prueba que podemos identificar y verificar un deployment Preview conocido-bueno por ID/SHA. **No prueba ni afirma que Production rollback esté aprobado.**

## Estado de cierre

- Diseño técnico de application recovery: **PREPARADO**.
- Rehearsal Preview read-only: **PREPARADO / sujeto al evidence contract**.
- Production rollback approval: **PENDIENTE**.
- Database forward-fix procedure: **PREPARADO**.
- Database restore: **P1E FROZEN / NO PROBADO**.

**NO PRODUCTION MUTATION · NO REAL DATA · NO P1E REOPENING**
