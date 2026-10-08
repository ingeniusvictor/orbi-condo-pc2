# ORBI Operaciones — validación de prototipo

Ruta prevista tras despliegue de la rama: `/operaciones-demo`.

## Alcance
Prototipo cliente aislado con datos ficticios. No hay almacenamiento, autenticación, base de datos ni envío de incidentes reales. La ruta es pública y no debe utilizarse para información personal o confidencial.

## Pruebas manuales
1. Abrir ruta y confirmar aviso de demostración.
2. Agregar novedad ficticia con turno y categoría; debe aparecer arriba del registro y entre los pendientes.
3. Cambiar estado pendiente → en seguimiento → resuelto → pendiente.
4. Confirmar que resueltos desaparecen de la lista de entrega de turno.
5. Recargar; las entradas agregadas deben desaparecer.
6. Verificar accesibilidad básica con teclado y pantalla móvil.
7. Confirmar que no existe petición de red de escritura ni acceso a datos privados.

## Para producción
Antes de usar con residentes: autenticación, permisos aplicados en backend, almacenamiento cifrado y auditado, control por comunidad, flujo de aprobación, adjuntos privados, protocolo de emergencias, política de privacidad y pruebas automatizadas. Validar con María atribuciones y transferencia de turnos.

## Criterio de seguridad
No ingresar datos reales en esta ruta, incluso en pruebas. No añadir fixtures con nombres, teléfonos, patentes ni documentos de trabajadores.
