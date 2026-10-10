# ORBI LIVING — Roadmap operativo PC2

## Objetivo
Construir un MVP que resuelva continuidad operativa sin duplicar innecesariamente ComunidadFeliz ni publicar datos personales. La prioridad es saber qué turno debe estar cubierto, qué cobertura falta, qué incidencia está abierta y quién debe asumir el siguiente paso.

## P0 — Prototipo seguro (rama actual)
- Calendario por fecha con turnos habituales y especiales.
- Vacante, reemplazo solicitado, reemplazo confirmado y turno recibido.
- Roles genéricos: conserje fijo, part-time y suplente; sin nombres.
- Advertencia de asignación duplicada, sin bloquear coberturas extraordinarias.
- Bitácora ficticia y entrega de turno.
- Centro de incidencias ficticias por prioridad/estado/rol.
- Panel operativo integrado.
- Persistencia solo local en navegador para demos que la requieren.
- Base institucional con procedencia documental y estados de verificación.

## P1 — Backend privado y control de acceso
Antes de ingresar datos reales:
1. Autenticación real y sesión segura.
2. Autorización del lado servidor por rol.
3. Separación entre datos operativos y personales.
4. Auditoría inmutable de cambios de turno y estados de incidentes.
5. Timestamps de servidor y zona horaria America/Santiago.
6. Protección contra edición de eventos históricos.
7. Validación de conflictos y doble asignación entre fechas contiguas.
8. Copias de seguridad y procedimiento de recuperación.

## P2 — Notificaciones y escalamiento
Solo después de validar el procedimiento con administración:
- Aviso de turno próximo sin confirmar.
- Escalamiento de turno vacante al responsable autorizado.
- Solicitud de reemplazo a lista privada de suplentes autorizados.
- Confirmación explícita del reemplazo.
- Aviso de incidencia crítica al rol responsable.
- Canal alternativo obligatorio para urgencias si la app falla.

No automatizar llamadas ni contactar terceros sin autorización y procedimiento aprobado.

## P3 — Convivencia con ComunidadFeliz
- Identificar módulos realmente activos.
- Confirmar exportaciones oficiales o API.
- Evitar replicar recaudación, contabilidad y remuneraciones.
- Priorizar interoperabilidad o exportación manual antes de doble digitación.
- Mantener el módulo de turnos/continuidad como diferenciador de ORBI LIVING.

## P4 — Gestión administrativa
- Seguimiento de contratos y vencimientos.
- Recordatorios de rendición mensual y anual.
- Catálogo privado de proveedores.
- Matriz de emergencias y responsables.
- Documentos protegidos con metadatos; nunca originales sensibles en GitHub público.

## Gates de producción
No desplegar con datos reales mientras falte cualquiera de los siguientes:
- permisos efectivos;
- almacenamiento privado;
- auditoría;
- política de respaldo;
- procedimiento de incidentes y cobertura aprobado;
- revisión de privacidad;
- pruebas de build/typecheck y QA responsive;
- validación del horario nocturno especial y de las asignaciones reales.

## Fuera de alcance del MVP
- cálculo de remuneraciones y horas extra;
- control de asistencia laboral;
- evaluación disciplinaria de trabajadores;
- fiscalización de arriendos o condiciones DS19;
- conclusiones jurídicas automáticas sobre contratos;
- reemplazo del sistema contable o financiero vigente.
