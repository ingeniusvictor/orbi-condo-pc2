# ORBI LIVING — Observabilidad privada de Administración

## Estado
**ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · NO REAL PII · PRODUCTION BLOCKED**

Este documento define la estrategia técnica de monitoring/error handling que puede verificarse antes de disponer de las respuestas operativas de Administración.

## Objetivo

Poder detectar y correlacionar fallas de las APIs privadas sin convertir los logs en otra base de datos privada.

## Fuentes de evidencia

1. **Vercel Runtime Logs**: estado HTTP, ruta, deployment, ambiente y errores de ejecución del Preview.
2. **Correlación ORBI**: toda solicitud a `/api/auth/*` o `/api/operations/*` recibe un UUID nuevo en `x-orbi-request-id`. El valor enviado por el cliente se reemplaza y el mismo UUID vuelve en la respuesta.
3. **Next.js `onRequestError`**: una excepción no controlada dentro de una ruta privada genera una única línea JSON estructurada con campos permitidos y sin contenido de la excepción.
4. **Respuestas normalizadas existentes**: los Route Handlers continúan entregando códigos HTTP controlados (`401`, `403`, `409`, `429`, `5xx`) sin exponer detalles internos del proveedor.

## Campos permitidos en el log ORBI de error no controlado

- `event`: código fijo `orbi.private.unhandled_error`;
- `requestId`: UUID generado por ORBI o `unavailable`;
- `method`: método HTTP de una lista cerrada;
- `route`: plantilla/ruta privada normalizada, sin query string;
- `routeType`: tipo de ejecución entregado por Next.js.

## Datos que no se registran

Nunca registrar mediante esta instrumentación:

- body o payload de la solicitud;
- correo, nombre, RUT, teléfono, placa u otra PII;
- contraseña, access token, refresh token, cookie, header `Authorization` o secretos;
- URL completa ni query string;
- dirección IP, User-Agent o geolocalización;
- UUID de usuario, membership, personal, turno, incidente u otro recurso privado;
- mensaje de excepción, stack trace o respuesta cruda de Supabase.

La plataforma puede conservar metadatos técnicos propios de ejecución según su servicio; ORBI no añade intencionalmente datos privados a esos logs.

## Operación en staging/Preview

Para investigar una falla:

1. identificar el Preview exacto por deployment/SHA;
2. consultar Runtime Logs filtrando `environment=preview`, ruta, nivel o código HTTP;
3. usar `x-orbi-request-id` cuando exista evidencia de una excepción ORBI correlacionada;
4. revisar sólo metadatos técnicos; nunca copiar datos privados a GitHub, PRs o chats de desarrollo;
5. documentar el hallazgo con códigos de estado, ruta, SHA y resultado, no con payloads reales.

## Qué queda pendiente para Production

Este bloque **no activa monitoring de Production** ni modifica configuración de Vercel. Antes de Production todavía deben aprobarse por separado:

- responsable de alertas y escalamiento;
- retención de logs;
- umbrales/SLO operativos;
- necesidad o no de un drain/proveedor externo;
- cualquier configuración que afecte tráfico Production.

No se crea log drain, token de Vercel, servicio externo, firewall, alerta automática ni nueva base de datos en este gate.

## Criterio de cierre de este gate técnico

El bloque de staging se considera verificado cuando:

- `npm run check` valida el contrato de privacidad;
- el build de Next.js acepta `proxy.ts` e `instrumentation.ts`;
- un Preview demuestra `x-orbi-request-id` en una API privada;
- Vercel Runtime Logs del Preview son consultables sin activar Production;
- el merge posterior mantiene cero deployments desde `main`.

**STAGING OBSERVABILITY CAN BE GREEN · PRODUCTION MONITORING REMAINS PENDING**
