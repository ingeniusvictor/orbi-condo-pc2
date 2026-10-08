# ORBI Admin — configuración de pagos (prototipo)
La interfaz es demostrativa y no guarda ni transmite datos. No debe utilizarse para ingresar información sensible real hasta activar autenticación, almacenamiento privado y controles de acceso.
La función pura de dominio exige rol administrator, propuesta aprobada por comité, verificación del correo receptor y auditoría antes de ejecutar cambios.
## Requisitos para activar
- Autenticación real, control de roles en servidor y protección CSRF.
- Persistencia transaccional y registro de auditoría inmutable; versiones para evitar conflictos.
- Verificación del nuevo destinatario mediante token de un solo uso; no confiar en un booleano enviado por el navegador.
- Revisión de comité con identidad verificada y separación de funciones.
- Validación reforzada de cuentas bancarias chilenas, titularidad y procedimiento de doble control.
- No mostrar números completos de cuenta a perfiles sin autorización.
- Vincular el envío real de comprobantes solo a configuración activada y verificada en servidor.
