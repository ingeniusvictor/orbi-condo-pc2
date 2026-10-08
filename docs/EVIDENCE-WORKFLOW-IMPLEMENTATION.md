# OC-PC2-27 — Flujo de ORBI Evidence
Se implementan reglas puras para invitación de contratista limitada a una orden y con vencimiento, revisión por administrador, aceptación, publicación separada y preparación de notificaciones sin adjuntos. Incluye una demostración de estados en memoria.
**No es un flujo de producción**: el navegador no autentica usuarios ni invitaciones y no se usa como fuente de verdad. Las funciones no envían correos ni guardan archivos.
Para producción faltan backend autenticado, emisión de tokens criptográficos con hash y consumo atómico, almacenamiento privado, escaneo de archivos, persistencia transaccional, bitácora inmutable, enlaces autorizados, configuración verificada de correo, cola de envío idempotente y políticas de privacidad.
No se crea un cuarto rol permanente: contratistas solo acceden a una invitación acotada. El administrador conserva la ejecución oficial de cambios y publicaciones.
