# ORBI LIVING — Paquete de validación para Administración

## Estado
**PENDIENTE DE VALIDACIÓN · NO APROBADO PARA DATOS REALES · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY**

Este documento traduce los gates técnicos pendientes a decisiones que Administración puede revisar sin conocer GitHub, Supabase o Vercel. Marcar una opción en este documento o en la hoja de respuesta **no habilita Production ni datos reales por sí solo**: la respuesta debe ser revisada y luego convertida en una decisión técnica trazable.

La propuesta técnica recomendada en cada punto es una recomendación de diseño, **no una decisión ya tomada por Administración**.

## Cómo usar este paquete
1. Revisar cada decisión.
2. Elegir una opción o escribir una alternativa.
3. Dejar como `PENDIENTE` cualquier punto que necesite revisión legal, laboral, contractual o del comité.
4. No incorporar nombres, RUT, teléfonos, correos, contratos, placas, claves ni datos personales reales en esta copia del repositorio.
5. Entregar la hoja de respuesta por el canal administrativo acordado. El equipo técnico traducirá sólo las decisiones aprobadas a configuración, procedimientos y tests.

---

# BLOQUE A — Propósito y acceso a datos privados

## A1. Catálogo de personal operativo (`staff_private`)
**Propuesta de propósito:** mantener sólo nombre operativo, función, elegibilidad de cobertura y estado activo para asignación de turnos/continuidad.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** aprobar ese propósito mínimo y limitar el acceso a Administración en el cut actual.
- [ ] B — Aprobar el propósito, pero solicitar otro alcance de acceso.
- [ ] C — Modificar el propósito antes de aprobar.
- [ ] PENDIENTE.

**Retención:** PENDIENTE. Este paquete no fija días, meses ni años.

## A2. Accesos de usuarios (`memberships`)
**Propuesta de propósito:** controlar qué identidad autenticada puede acceder a la comunidad, con rol, vigencia y desactivación lógica.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** aprobar el propósito de control de acceso y conservar trazabilidad de altas/bajas sin usar credenciales como dato operacional.
- [ ] B — Solicitar otro modelo de control.
- [ ] C — No aprobar todavía.
- [ ] PENDIENTE.

**Retención:** PENDIENTE.

## A3. Turnos, eventos, bitácoras y rondas
**Propuesta de propósito:** continuidad operativa, cobertura, entrega de turno y evidencia estructurada de rondas/checkpoints.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** aprobar el uso operacional estructurado y conservar la historia como evidencia append-only cuando corresponda.
- [ ] B — Aprobar con cambios de alcance.
- [ ] C — No aprobar todavía.
- [ ] PENDIENTE.

**Retención:** PENDIENTE.

## A4. Incidentes y sus eventos
**Propuesta de propósito:** registrar estado, prioridad, área, responsable operacional y referencia privada opaca, evitando narrativa libre en el navegador.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** aprobar este propósito mínimo estructurado.
- [ ] B — Aprobar con campos adicionales, que deberán pasar nueva revisión de privacidad.
- [ ] C — No aprobar todavía.
- [ ] PENDIENTE.

**Retención:** PENDIENTE.

## A5. Auditoría (`audit_events`)
**Propuesta de propósito:** trazabilidad de mutaciones y verificación de quién ejecutó una acción, sobre qué recurso y con qué resultado.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** aprobar auditoría sólo para control operativo/seguridad y limitar su consulta a Administración en el cut actual.
- [ ] B — Solicitar otra regla de acceso.
- [ ] C — No aprobar todavía.
- [ ] PENDIENTE.

**Retención:** PENDIENTE.

## A6. Campo histórico `shift_events.note_private`
El campo existe en el esquema histórico, pero el sistema actual no lo necesita para el dashboard.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** mantenerlo **PROHIBITED NARRATIVE** para datos reales y deprecarlo o reemplazarlo por vocabulario estructurado antes de cualquier uso real.
- [ ] B — Solicitar una propuesta futura de narrativa privada gobernada.
- [ ] PENDIENTE.

---

# BLOQUE B — Corrección y desactivación

## B1. Quién autoriza cambios de datos de personal
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** Administración autoriza correcciones y desactivaciones en el cut actual.
- [ ] B — Administración requiere una segunda aprobación definida por el condominio.
- [ ] C — Otro responsable: ______________________________
- [ ] PENDIENTE.

## B2. Canal de solicitud
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** solicitud escrita por canal administrativo trazable; no aceptar cambios permanentes basados sólo en una instrucción verbal sin registro.
- [ ] B — Otro canal formal: ______________________________
- [ ] PENDIENTE.

## B3. Qué cambios se permiten sobre `staff_private`
Propuesta: corrección de `display_name`, `staff_function`, `coverage_eligible` y `active`, usando listas/campos cerrados y sin observaciones libres.

- [ ] A — Aprobar propuesta.
- [ ] B — Aprobar con cambios: ______________________________
- [ ] PENDIENTE.

## B4. Qué ocurre cuando una persona deja de estar disponible para cobertura
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** primero `coverage_eligible=false`; si ya no debe aparecer en nuevas operaciones, además `active=false`; conservar referencias históricas.
- [ ] B — Otro procedimiento: ______________________________
- [ ] PENDIENTE.

## B5. Qué ocurre cuando debe cortarse un acceso
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** desactivación lógica mediante `disabled_at`/ventana de vigencia, verificación posterior de acceso y, si se exige corte inmediato en Production, implementar revocación explícita de sesiones.
- [ ] B — Otro procedimiento: ______________________________
- [ ] PENDIENTE.

## B6. Corrección de evidencia histórica
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** no borrar ni reescribir silenciosamente; usar evento compensatorio estructurado o registro de corrección enlazado.
- [ ] B — Definir un procedimiento excepcional distinto, siempre con trazabilidad.
- [ ] PENDIENTE.

---

# BLOQUE C — Auditoría y exportación

## C1. Quién puede consultar auditoría
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** sólo Administración en el cut actual, con propósito concreto y filtro por comunidad/fecha/recurso.
- [ ] B — Otro alcance: ______________________________
- [ ] PENDIENTE.

## C2. Exportación de auditoría o datos privados
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** deshabilitada por defecto; habilitación excepcional sólo con autorización, campos mínimos, almacenamiento protegido y eliminación de la copia según política aprobada.
- [ ] B — Permitir exportación rutinaria bajo política definida: ______________________________
- [ ] PENDIENTE.

## C3. Copias de datos privados en canales de desarrollo
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** prohibir copiar resultados privados a GitHub, issues, PRs, logs de CI o chats de desarrollo.
- [ ] B — Definir otro repositorio/canal privado aprobado: ______________________________
- [ ] PENDIENTE.

## C4. Retención de auditoría
**Decisión requerida:** definir propósito, responsable, archivo y eliminación/anonimización con la revisión administrativa/legal correspondiente.

**Estado:** PENDIENTE. Este paquete no propone una duración concreta.

---

# BLOQUE D — Procedimiento operativo real del condominio

Estos puntos cierran el significado real de las funciones ya modeladas. No requieren activar Mayordomía/Conserjería en el sistema durante este cut.

## D1. Cobertura nocturna de domingo/feriado
Indicar el horario real que debe considerarse cobertura oficial. No asumir horarios desde conversaciones o prácticas informales.

**Respuesta:** ________________________________________________

**Estado:** PENDIENTE.

## D2. Quién puede activar un reemplazo
- [ ] **A — RECOMENDADA PARA EL PILOTO ADMINISTRATIVO:** Administración.
- [ ] B — Administración y una delegación futura formalmente definida.
- [ ] C — Otro responsable: ______________________________
- [ ] PENDIENTE.

## D3. Canal para solicitar y confirmar un reemplazo
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** un canal institucional definido por Administración donde quede constancia de solicitud y aceptación.
- [ ] B — Otro canal: ______________________________
- [ ] PENDIENTE.

## D4. Cuándo un reemplazo se considera confirmado
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** sólo después de aceptación explícita de la persona y confirmación administrativa; una llamada sin confirmación no cambia automáticamente el estado a `confirmed`.
- [ ] B — Otro criterio: ______________________________
- [ ] PENDIENTE.

## D5. Pool autorizado de reemplazos
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** sólo personal vigente y marcado como elegible para cobertura; no seleccionar automáticamente a una persona sólo por haber cubierto antes.
- [ ] B — Otro criterio: ______________________________
- [ ] PENDIENTE.

## D6. Entrega de turno
- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** checklist estructurado + pendientes + incidentes abiertos + rondas; confirmación explícita de recepción.
- [ ] B — Otro procedimiento: ______________________________
- [ ] PENDIENTE.

## D7. Bitácora
Confirmar que una entrada de bitácora debe representar hechos operativos estructurados y pendientes de turno, no comentarios personales libres.

- [ ] A — Sí.
- [ ] B — Requiere otro alcance: ______________________________
- [ ] PENDIENTE.

## D8. Rondas
Confirmar que una ronda representa un conjunto definido de checkpoints y que una ronda abierta impide técnicamente cerrar la bitácora del turno correspondiente.

- [ ] A — Sí.
- [ ] B — Debe cambiar: ______________________________
- [ ] PENDIENTE.

## D9. Incidentes críticos y vacancias
La implementación actual los trata como señales críticas de continuidad, pero **no inventa** un bloqueo técnico de cierre de bitácora por esos eventos; sólo una ronda abierta bloquea el cierre.

- [ ] **A — RECOMENDADA · PROPUESTA TÉCNICA, NO APROBACIÓN:** mantener esta semántica.
- [ ] B — Solicitar otra regla: ______________________________
- [ ] PENDIENTE.

## D10. Escalamiento de emergencias fuera de horario
Definir responsable/canal real de escalamiento y cómo se confirma recepción.

**Responsable/rol:** __________________________________________

**Canal:** ____________________________________________________

**Criterio de confirmación:** __________________________________

**Estado:** PENDIENTE.

---

# BLOQUE E — Decisiones deliberadamente fuera de este paquete

Este paquete **no** solicita ni autoriza:
- crear Production Supabase;
- promover la aplicación a Production;
- activar la regla Vercel Firewall sobre tráfico Production;
- definir MFA/password policy de Production;
- crear identidades live de Mayordomía, Conserjería, Committee o Resident;
- cargar información real del condominio;
- reabrir P1E backup/restore;
- activar P2 notificaciones/escalamiento automático.

Esos gates se trabajan por separado cuando exista autorización explícita.

---

# Resultado esperado

Una vez que Administración responda:
1. se registra qué puntos quedaron **APROBADOS**, **MODIFICADOS** o **PENDIENTES**;
2. sólo las decisiones aprobadas se convierten en cambios técnicos;
3. se agregan pruebas que congelen esas decisiones y eviten drift;
4. los gates de Production Readiness se cierran únicamente con evidencia correspondiente;
5. cualquier punto pendiente mantiene bloqueados los datos reales cuando sea un requisito obligatorio.

**ESTADO ACTUAL: PENDIENTE DE VALIDACIÓN · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · NO REAL PII · PRODUCTION BLOCKED · P1E FROZEN**
