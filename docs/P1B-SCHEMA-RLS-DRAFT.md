# ORBI LIVING — P1B · Esquema privado y RLS (borrador)

## Estado
**Borrador no ejecutado.** La migración `supabase/migrations/20261010_p1b_operations_schema.sql` se mantiene en GitHub como diseño revisable. El build de Next.js no valida sintaxis ni comportamiento PostgreSQL/RLS.

No aplicar sobre una base con datos reales hasta disponer de:
- proyecto Supabase dedicado;
- entorno de staging separado;
- backup previo y procedimiento de rollback;
- usuarios de prueba de varios roles;
- revisión SQL/RLS en una instancia real.

## Objetivo
Convertir el contrato P1 en una base multiusuario y scoped por comunidad sin introducir todavía datos reales ni endpoints de mutación operativa.

## Entidades del corte
- `communities`
- `memberships`
- `staff_private`
- `shift_assignments`
- `shift_events`
- `incidents`
- `incident_events`
- `audit_events`

## Límites de privacidad
`staff_private` es una tabla privada. Aunque en este corte solo contempla `display_name`, función y elegibilidad de cobertura, se trata como información protegida. Teléfonos, RUT, contratos, patentes y contactos de residentes **no forman parte de P1B**.

Las tablas de eventos no deben copiar narrativas personales innecesarias. `audit_events.metadata` registra únicamente metadata técnica mínima del cambio automático actual.

## Tenant / comunidad
Las referencias de turnos, personal, incidentes y sus eventos incluyen `community_id`. Los eventos usan claves foráneas compuestas para impedir que un evento de una comunidad apunte a un turno, incidente o persona de otra comunidad.

P1A resuelve `ORBI_COMMUNITY_ID` en servidor; el navegador no debe decidir el tenant autoritativo.

## Roles y lectura propuesta
- `administrator`: operación amplia y lectura de auditoría.
- `mayordomo`: gestión operacional de personal, turnos e incidencias.
- `concierge`: lectura operacional de personal/turnos, reporte de incidencias y lectura de eventos que necesita para relevo.
- `committee`: lectura del estado vigente de turnos, sin acceso directo a `staff_private`, eventos privados ni auditoría.
- `resident`: sin acceso al backend operacional P1B.

La matriz sigue siendo una propuesta y debe validarse con la operación real antes de producción.

## Escrituras directas deliberadamente limitadas
En P1B:
- administrador/mayordomo pueden insertar/actualizar `staff_private` y `shift_assignments` bajo RLS;
- conserjería puede registrar incidentes;
- administrador/mayordomo pueden actualizar incidentes;
- no existe `DELETE` para tablas operativas/históricas;
- `shift_events`, `incident_events` y `audit_events` no reciben INSERT directo desde `authenticated`.

Los eventos de dominio quedan reservados para P1C mediante comandos server-side/RPC controlados, con validación de transición, razón, revisión e idempotencia.

## Auditoría automática inicial
Cambios en `shift_assignments` e `incidents` generan `audit_events` mediante triggers `SECURITY DEFINER`. La metadata automática evita copiar campos narrativos privados.

Esto no sustituye los eventos de dominio. Por ejemplo, un `replacement_requested` debe quedar como evento explícito en P1C y no inferirse solo de una actualización genérica.

## Revisión / concurrencia
`shift_assignments` e `incidents` tienen `revision`. Un trigger incrementa la revisión en cada UPDATE y fija `updated_at` en servidor.

**P1B todavía no resuelve por sí solo la concurrencia.** P1C debe exigir que la mutación use la revisión esperada (`WHERE revision = expectedRevision` o mecanismo equivalente) y rechazar conflicto cuando no haya coincidencia.

## Matriz mínima de pruebas RLS antes de aplicar
Usar una base de staging vacía y al menos dos comunidades ficticias.

### Anónimo
- [ ] no puede seleccionar ninguna tabla privada;
- [ ] no puede insertar/actualizar/borrar registros.

### Resident
- [ ] puede resolver únicamente su propia membresía si corresponde;
- [ ] no puede leer turnos, personal, incidentes ni auditoría.

### Concierge
- [ ] puede leer turnos de su comunidad;
- [ ] puede leer personal operativo necesario de su comunidad;
- [ ] no puede actualizar turnos;
- [ ] puede insertar incidencia de su comunidad con `created_by=auth.uid()` y `updated_by=auth.uid()`;
- [ ] no puede actualizar una incidencia después del reporte;
- [ ] no puede leer auditoría.

### Mayordomo
- [ ] puede gestionar `staff_private`, turnos e incidentes de su comunidad;
- [ ] no puede operar recursos de otra comunidad;
- [ ] no puede insertar directamente eventos históricos.

### Administrator
- [ ] puede realizar las gestiones autorizadas de su comunidad;
- [ ] puede leer `audit_events` de su comunidad;
- [ ] no puede cruzar a otra comunidad sin membresía administrativa allí.

### Committee
- [ ] puede leer el estado vigente de `shift_assignments`;
- [ ] no puede leer `staff_private`, eventos privados ni auditoría;
- [ ] no puede mutar turnos.

## Pruebas de integridad
- [ ] no se acepta un `assignee_staff_id` perteneciente a otra comunidad;
- [ ] no se acepta un `shift_event` cuyo `community_id` no coincida con el turno;
- [ ] no se acepta un `incident_event` cuyo `community_id` no coincida con el incidente;
- [ ] `ends_at` debe ser posterior a `starts_at`;
- [ ] la combinación `(community_id, service_date, slot_code)` es única;
- [ ] cada UPDATE incrementa `revision` una sola vez;
- [ ] no existe DELETE concedido a `authenticated`.

## Seed inicial permitido
La creación de la comunidad `pc2` y de la primera membresía administradora debe hacerse por un canal administrativo confiable en staging. No crear un endpoint público de bootstrap.

## Relación con OC-PC2-40
La migración financiera de PR #25 utiliza `community_members`; P1B propone `memberships`. Antes de fusionar o ejecutar ambos diseños debe existir una consolidación única. No aplicar ambas migraciones de manera independiente.

## Gate de P1B
P1B no puede pasar a Ready hasta que:
1. la migración se aplique sobre Supabase staging vacío;
2. la matriz RLS anterior se ejecute con usuarios reales de prueba;
3. se documente rollback y se pruebe restauración;
4. no exista secreto/PII en GitHub;
5. P1A siga GREEN;
6. se confirme que PR #25 fue consolidado o descartado, evitando dos modelos de membresía.
