# ORBI Evidence — trazabilidad de trabajos de contratistas
## Alcance del prototipo
Formulario de validación local de orden, contratista, especialidad, equipo, fecha, resumen y archivos. No hay subida, correo, base de datos ni publicación real.
## Arquitectura de producción requerida
1. El administrador crea una orden de trabajo vinculada a activo, proveedor y alcance. El comité supervisa cuando corresponda.
2. El administrador emite una invitación de carga con token aleatorio, hash almacenado en servidor, vencimiento y alcance a una sola orden. El contratista es invitado externo limitado, no un cuarto rol permanente.
3. El servidor valida identidad de la invitación, tamaño total, MIME real por firma, contenido malicioso, rate limiting y cuotas. Carga directa a almacenamiento privado con URLs firmadas de corta duración. El cliente no decide la ruta ni el estado.
4. Los informes y fotos se guardan con hash, autor, fecha de recepción y auditoría. No confiar exclusivamente en EXIF ni en la fecha declarada. Registrar nuevas versiones sin borrar evidencias históricas.
5. El administrador revisa y solicita correcciones, acepta el trabajo o publica un resumen autorizado. Distinguir evidencia recibida, revisada y aceptación técnica. El comité solo revisa; el residente solo consulta documentos publicados.
6. Enviar notificación al correo comunitario configurado y verificado; preferir enlaces privados autenticados sobre adjuntos masivos. Proveedor de correo, reintentos, trazabilidad e idempotencia.
7. Aplicar política de privacidad, retención, minimización de imágenes con personas, borrado controlado y backups.
8. Vincular historial a calendario de mantenciones, certificaciones, proveedor, activo y vencimientos.
## Seguridad
No exponer fotos/informes a usuarios no autorizados. No permitir que una invitación de contratista modifique proveedores, contratos, fechas oficiales ni estados de aceptación.
