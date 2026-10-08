# ORBI Pay — etapa de preparación
Esta etapa solo implementa un formulario responsive de selección y validación local. No transmite archivos, no confirma pagos y no registra datos financieros.
## Próxima etapa (antes de activar envío)
- Autenticación de residentes y asociación verificada a unidad; autorización por rol.
- Endpoint privado con validación de tamaño, MIME y firma del archivo, límites antiabuso y análisis de contenido.
- Configuración administrativa editable de destinatario, con verificación de correo, auditoría y autorización para cambios sensibles.
- Servicio de correo transaccional con credenciales solo en servidor; comprobante de entrega del proveedor, manejo de fallos y reintentos idempotentes.
- Retención mínima y acceso restringido; política de privacidad; ninguna URL pública de comprobantes.
- Estado enviado / pendiente de verificación manual; jamás marcar pagado automáticamente.
- Buzón actual informado por la comunidad: secretaria2@becza.cl (no se usa ni codifica como destinatario activo).
