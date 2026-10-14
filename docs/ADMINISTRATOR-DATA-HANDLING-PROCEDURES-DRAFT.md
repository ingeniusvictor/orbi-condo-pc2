# ORBI LIVING — Administrator data-handling procedures

## Status
**BORRADOR TÉCNICO · NO APROBADO PARA DATOS REALES · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY**

Este documento propone el procedimiento operativo para corrección/desactivación de registros privados y acceso a evidencia de auditoría. Su existencia no autoriza datos reales, no fija plazos legales de retención y no convierte ninguna decisión pendiente de Administración en una decisión aprobada.

El inventario de campos de referencia es `docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md`.

## Principios de control
1. Corrección no significa borrar historia. Los registros actuales de estado pueden corregirse cuando corresponda, pero la evidencia histórica append-only no debe reescribirse silenciosamente.
2. Desactivar es preferible a eliminar una identidad operativa que ya tenga historia asociada. El objetivo es cortar uso futuro sin romper trazabilidad pasada.
3. Ningún dato privado debe copiarse a GitHub, issues, PRs, chat, logs de CI o documentación pública para solicitar una corrección.
4. Toda futura mutación de datos reales debe pasar por una superficie administrativa controlada, autenticada y auditable. No se aprueba el uso del editor SQL como procedimiento operacional cotidiano.
5. Un UUID interno puede identificar el registro dentro del sistema; no debe transformarse en identificador público/person-facing.
6. Los eventos/auditoría no son un lugar para guardar RUT, teléfono, correo personal, dirección, imágenes, documentos, salud o narrativa libre.
7. Si una corrección requiere modificar una categoría no contemplada por el inventario actual, se detiene y se abre una revisión de alcance/privacidad antes de agregar campos.

## A. Corrección de `staff_private`
### Uso permitido en el diseño actual
`staff_private` contiene únicamente el catálogo laboral mínimo: `display_name`, `staff_function`, `coverage_eligible`, `active` y metadatos técnicos.

### Flujo propuesto
1. La solicitud se recibe por un canal administrativo aprobado fuera de GitHub/chat de desarrollo.
2. Administración verifica que quien solicita el cambio tiene autoridad y que el registro corresponde a la persona correcta.
3. Se clasifica el cambio como uno de:
   - corrección de nombre operativo;
   - corrección de función;
   - cambio de elegibilidad para cobertura;
   - activación/desactivación del registro.
4. Antes de aplicar, se revisa el valor actual y el nuevo valor; no se agregan observaciones narrativas.
5. En una futura implementación con datos reales, el cambio deberá realizarse mediante un comando administrativo server-side que:
   - exija sesión Administrator;
   - valide la comunidad `pc2`;
   - valide un conjunto cerrado de campos modificables;
   - use control de concurrencia/revisión si aplica;
   - registre actor, acción, recurso, resultado y correlación en `audit_events` sin copiar PII innecesaria a `metadata`.
6. Se verifica el resultado en lectura posterior.

### Estado técnico actual
La base tiene campos suficientes para corrección/desactivación, pero **no se declara aquí que exista un endpoint de producción aprobado para editar `staff_private`**. Antes de datos reales debe existir y probarse una superficie controlada o, alternativamente, debe documentarse formalmente otro mecanismo seguro.

## B. Desactivación de personal
Para una persona que deja de ser elegible o deja de trabajar en el condominio, el comportamiento preferido es conservar la referencia histórica y cortar la selección futura.

Flujo propuesto:
1. `coverage_eligible=false` cuando la persona deja de pertenecer al pool de cobertura pero el registro sigue vigente para otros fines operativos permitidos.
2. `active=false` cuando el registro deja de ser utilizable para nuevas operaciones.
3. No borrar en cascada asignaciones, eventos, bitácoras, rondas o auditoría histórica.
4. Las asignaciones futuras que aún apunten a una persona desactivada deben ser revisadas por Administración antes del corte operacional; este documento no autoriza reasignaciones automáticas.
5. La fecha, responsable y motivo operacional de la desactivación deben quedar representados mediante el mecanismo de auditoría aprobado, sin narrativa privada innecesaria.

## C. Corrección/desactivación de acceso (`memberships`)
`memberships` controla la vinculación del usuario autenticado con comunidad, rol y ventana de vigencia.

Flujo propuesto para cortar acceso futuro:
1. Verificar el usuario y la comunidad por identificadores internos; no copiar credenciales ni tokens.
2. Definir el momento efectivo de corte.
3. Usar `disabled_at` o `active_until` como mecanismo de desactivación lógica según el procedimiento que finalmente se apruebe.
4. No borrar el membership si ya existe historia atribuida al usuario, salvo una decisión de gobierno de datos excepcional y documentada.
5. Verificar que una nueva resolución de sesión falla cerrada después del corte.
6. Si en producción se requiere revocación inmediata de sesiones ya emitidas, ese control debe implementarse/probarse de forma explícita; este borrador no presume que la actualización del membership por sí sola invalide instantáneamente todos los tokens existentes.

### Alcance actual
Sólo existe una identidad live QA autorizada: Administrator. Este procedimiento no autoriza crear ni activar otros roles.

## D. Correcciones de registros operacionales históricos
Las tablas de eventos, entradas de bitácora, checkpoints y auditoría están diseñadas como evidencia estructurada/append-only. Una equivocación histórica no debe corregirse mediante `DELETE` o edición silenciosa de la fila original como práctica operacional normal.

Antes de datos reales debe definirse una de estas vías controladas para cada familia que pueda necesitar rectificación:
- evento compensatorio estructurado;
- registro de corrección enlazado al recurso original;
- procedimiento excepcional aprobado con trazabilidad completa.

Mientras esa decisión no exista, **no hay procedimiento aprobado para reescribir evidencia histórica real**.

## E. Acceso a `audit_events`
### Límite técnico actual
La lectura de `audit_events` está restringida técnicamente a Administrator en el modelo actual.

### Flujo propuesto de consulta
1. Debe existir un propósito operacional concreto: investigar una mutación, verificar trazabilidad, revisar un incidente técnico o soportar una auditoría autorizada.
2. La consulta debe limitarse a comunidad, ventana temporal, tipo de recurso/acción y el mínimo de filas necesario.
3. No se debe usar auditoría como buscador general de información sobre personas.
4. Si se requiere exportación, ésta debe tener autorización específica; la exportación no se considera aprobada por este borrador.
5. No copiar resultados de auditoría a GitHub, issues, PRs o chats de desarrollo.
6. El acceso/exportación debería quedar registrado cuando exista una superficie de auditoría operacional suficientemente madura para ello.

## F. Exportación de datos privados
**No aprobada por defecto.**

Antes de habilitar CSV/PDF/JSON u otra descarga con datos privados deben definirse:
- quién puede solicitarla;
- propósito permitido;
- campos permitidos;
- mecanismo de autorización;
- ubicación de almacenamiento temporal;
- cifrado/protección;
- plazo de eliminación de la copia;
- registro de quién exportó y cuándo.

La ausencia de esta definición es un bloqueo, no una invitación a exportar manualmente desde la base.

## G. Retención — matriz pendiente de aprobación
Este borrador **no fija días, meses ni años**. La retención técnica de una tabla no equivale a una obligación/permiso legal de conservar datos indefinidamente.

Administración deberá decidir, con la revisión legal/privacidad que corresponda, el tratamiento de cada familia:

| Familia | Propósito a aprobar | Retención a aprobar | Archivo a aprobar | Eliminación/anonimización a aprobar |
| --- | --- | --- | --- | --- |
| `staff_private` | Pendiente | Pendiente | Pendiente | Pendiente |
| `memberships` | Pendiente | Pendiente | Pendiente | Pendiente |
| turnos / `shift_assignments` | Pendiente | Pendiente | Pendiente | Pendiente |
| eventos de turno/incidente | Pendiente | Pendiente | Pendiente | Pendiente |
| incidentes | Pendiente | Pendiente | Pendiente | Pendiente |
| bitácoras/entradas | Pendiente | Pendiente | Pendiente | Pendiente |
| rondas/checkpoints | Pendiente | Pendiente | Pendiente | Pendiente |
| `audit_events` | Pendiente | Pendiente | Pendiente | Pendiente |

## H. `shift_events.note_private`
Este campo histórico sigue clasificado como **PROHIBITED NARRATIVE para datos reales** en el cut actual.

No debe utilizarse para guardar comentarios de personas/incidentes mientras no exista una decisión explícita de:
- eliminar/deprecar el campo;
- reemplazarlo por vocabulario estructurado;
- o gobernar formalmente narrativa privada.

## I. Evidencia mínima para cerrar estos procedimientos en el futuro
El borrador podrá pasar a “aprobado” sólo cuando exista evidencia explícita de:
- responsable administrativo que aprueba corrección/desactivación;
- canal de solicitud y verificación de autoridad;
- mecanismo técnico controlado para la mutación;
- audit trail de la mutación;
- política para sesiones cuando se corta acceso;
- matriz de retención aprobada;
- reglas de exportación aprobadas;
- procedimiento para rectificar evidencia histórica sin borrar trazabilidad;
- decisión sobre `note_private`.

Hasta entonces:

**BORRADOR NO APROBADO · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · NO REAL PII · PRODUCTION BLOCKED**
