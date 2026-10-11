# ORBI LIVING — Límites de datos PC2

## Regla principal
El repositorio es público. Por lo tanto, el código, fixtures, documentación y capturas incorporadas al repositorio no deben contener datos personales ni documentos originales sensibles.

## Permitido en demo pública
- Identificadores genéricos: Conserje fijo 1, Part-time 1, Suplente 1.
- Horarios operativos reportados, claramente marcados como pendientes de validación cuando corresponda.
- Datos institucionales mínimos derivados de documentos: nombre del condominio, 278 unidades como referencia contractual, dos subadministraciones, obligación administrativa de atención 24/7.
- Incidencias completamente ficticias sin referencias identificables.
- Estados operativos: vacante, solicitado, confirmado, recibido, reportado, resuelto.

## Solo en producción privada
- Nombre de trabajadores, RUT, teléfonos, correos, contratos individuales y remuneraciones.
- Datos de propietarios, residentes, ocupantes, visitantes y contactos de emergencia.
- Números de departamento asociados a personas.
- Patentes y autorizaciones vehiculares.
- Fotografías, videos, evidencias e informes que identifiquen personas.
- Firmas, cédulas, cuentas bancarias, documentos contractuales originales y facturas con datos sensibles.
- Historial real de ausencias, reemplazos o incidentes.

## Prohibido inferir o automatizar
- No convertir una vacante o ausencia en evaluación disciplinaria.
- No calcular horas extra o remuneraciones desde los turnos del MVP.
- No inferir presencia física a partir de una confirmación.
- No concluir incumplimiento contractual o laboral automáticamente.
- No investigar ni clasificar cumplimiento DS19 o situación de arriendo.
- No reutilizar datos de ComunidadFeliz sin autorización y base técnica/contractual confirmada.

## Arquitectura recomendada
1. Cliente: mínimo dato necesario para la tarea actual.
2. Servidor: identidad, permisos y validaciones.
3. Base privada: datos personales y operativos reales separados por tablas y políticas de acceso.
4. Auditoría: evento de cambio con actor, fecha de servidor, entidad y acción; evitar registrar secretos en logs.
5. Documentos: almacenamiento privado con referencias opacas en la base, no URLs públicas.
6. Exportación: aplicar permisos y reducción de datos antes de generar archivos.

## Roles funcionales propuestos
- Administración: configuración, autorización y acceso operativo amplio.
- Mayordomía: cobertura, incidentes, relevo y seguimiento autorizado.
- Conserjería: turno actual, bitácora, recepción y reporte dentro de permisos.
- Comité: paneles y rendiciones según autorización; no acceso automático a datos laborales/personales.
- Residente: solo información propia y funciones específicamente habilitadas.

La matriz final de permisos debe ser validada con la administración y aplicada en backend; ocultar controles en la interfaz no constituye autorización.
