# ORBI LIVING — Contrato P1 de backend privado

## Propósito
Definir el límite entre el prototipo público actual y una futura operación con datos reales. Este documento es deliberadamente independiente del proveedor de backend: puede implementarse sobre PostgreSQL/Supabase u otra plataforma, pero las garantías de seguridad y auditoría no cambian.

## Regla de activación
No conectar las pantallas públicas actuales a datos reales hasta que autenticación, autorización server-side, almacenamiento privado, auditoría, respaldo y procedimiento operativo hayan sido probados y aprobados.

## Principios no negociables
1. **Identidad verificada en servidor.** El cliente nunca decide `actorId`, rol, comunidad ni permisos.
2. **Scope por comunidad.** Cada consulta y mutación se restringe a una membresía válida de la comunidad.
3. **Mínimo privilegio.** El permiso se verifica para cada acción y recurso; ocultar un botón no es autorización.
4. **Datos personales separados.** Contactos, patentes, contratos individuales y referencias de personal viven en almacenamiento privado y no se serializan hacia páginas públicas.
5. **Auditoría append-only.** Todo cambio operativo relevante produce un evento de auditoría generado por servidor.
6. **Tiempo de servidor.** `created_at`, `updated_at`, confirmaciones y relevos se generan en servidor. Guardar timestamp UTC y fecha operacional derivada para `America/Santiago`.
7. **Sin borrado silencioso.** Turnos, incidentes y eventos históricos no se sobrescriben para ocultar cambios; las correcciones producen nuevos eventos.
8. **Concurrencia explícita.** Las mutaciones usan versión/revisión o condición equivalente para evitar que dos operadores sobrescriban cambios simultáneos.
9. **Idempotencia.** Solicitudes sensibles a duplicación (confirmaciones, relevos, escalamiento) aceptan una clave de idempotencia.
10. **No automatizar emergencias críticas sin canal alternativo.** La aplicación complementa, no sustituye, los procedimientos aprobados.

## Entidades privadas propuestas

### `communities`
- `id`
- `display_name`
- `timezone`
- `active`

### `memberships`
Relación entre identidad autenticada y comunidad.
- `user_id`
- `community_id`
- `operations_role`
- `active_from`
- `active_until`
- `disabled_at`

### `staff_private`
Catálogo privado de personas habilitadas para cobertura.
- `id`
- `community_id`
- `display_name`
- `staff_function`
- `coverage_eligible`
- datos de contacto solo cuando exista base y finalidad autorizada

No incluir remuneraciones en el MVP operativo.

### `shift_assignments`
Estado vigente de una cobertura planificada.
- `id`
- `community_id`
- `service_date`
- `slot_code`
- `starts_at`
- `ends_at`
- `assignee_staff_id` nullable
- `status`: `planned | vacant | requested | confirmed | received`
- `revision`
- `created_at`
- `updated_at`

### `shift_events`
Historial inmutable de cambios.
- `id`
- `shift_assignment_id`
- `event_type`
- `from_status`
- `to_status`
- `from_assignee_staff_id`
- `to_assignee_staff_id`
- `reason_code`
- `note_private` opcional
- `actor_user_id`
- `created_at`

### `incidents`
- `id`
- `community_id`
- `service_date`
- `area`
- `priority`
- `state`
- `assigned_role`
- `private_case_reference` opcional
- `revision`
- timestamps de servidor

### `incident_events`
Historial inmutable de prioridad, estado, asignación y escalamiento.

### `audit_events`
Bitácora técnica transversal.
- actor autenticado
- comunidad
- acción
- tipo/id de recurso
- resultado
- timestamp de servidor
- correlación/idempotencia
- metadata técnica mínima, sin copiar narrativas personales innecesarias

## Comandos server-side mínimos

### Turnos
- consultar cobertura por fecha/rango;
- reportar vacante;
- solicitar reemplazo;
- asignar o cambiar responsable autorizado;
- confirmar reemplazo;
- confirmar recepción/relevo;
- corregir una asignación mediante nuevo evento, no borrando el historial.

### Incidencias
- registrar;
- reconocer;
- asignar;
- cambiar prioridad/estado;
- resolver/cerrar;
- registrar escalamiento.

## Permisos propuestos
La matriz TypeScript en `data/operations-permissions.ts` es documentación ejecutable de intención, no control efectivo. En producción el backend debe verificar, como mínimo:
- `view_shift_schedule`
- `report_shift_gap`
- `request_shift_replacement`
- `manage_shift_schedule`
- `confirm_shift_handoff`
- `report_incident`
- `manage_incident`
- accesos restringidos a contactos, estacionamientos y antecedentes de personal.

## Validaciones de dominio antes de mutar
- fecha y slot válidos;
- asignado habilitado para la comunidad;
- no aceptar transición imposible de estado;
- detectar doble asignación incompatible considerando turnos que cruzan medianoche;
- distinguir advertencia de conflicto de un bloqueo absoluto, porque puede existir cobertura extraordinaria autorizada;
- no aceptar timestamps, rol ni identidad de actor enviados como autoridad por el cliente;
- requerir razón para cambios extraordinarios definidos por el procedimiento.

## Lecturas públicas vs privadas
**Público/demo:** solo información sintética, institucional no sensible o agregada.

**Privado autenticado:** turnos reales, personas habilitadas, incidencias reales, contactos autorizados y documentos protegidos según rol y finalidad.

Nunca exponer contratos individuales, RUT, teléfonos, patentes o archivos privados mediante bundles estáticos, repositorio público o logs de cliente.

## Backups y recuperación
Antes de producción debe existir:
- backup automático del almacenamiento operativo;
- política de retención documentada;
- prueba periódica de restauración;
- responsable del procedimiento;
- registro de la última restauración de prueba.

Un backup no probado no cuenta como gate cumplido.

## Gate P1
P1 solo puede considerarse terminado cuando:
- autenticación real funciona;
- permisos se validan en servidor;
- dos usuarios de roles diferentes fueron probados;
- auditoría registra cada mutación sensible;
- una edición concurrente es rechazada o reconciliada de forma segura;
- backup/restauración fue ensayado;
- QA responsive y build/typecheck están GREEN;
- no existe PII en GitHub público ni en páginas demo.
