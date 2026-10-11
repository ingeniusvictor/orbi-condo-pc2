# ORBI LIVING — P1O Private API Cache Hardening

## Objetivo
Asegurar de forma centralizada que todas las respuestas de las APIs privadas Auth/Operaciones declaren `Cache-Control: private, no-store`, incluyendo rechazos y errores tempranos.

P1O permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1N (#42) y no cambia P1E Recovery.

## Problema observado
P1N demostró que las lecturas privadas ya emitían `no-store`, pero algunas mutaciones podían responder 403 desde `trustedOrigin()` antes de alcanzar ramas que añadían headers explícitos.

Aunque POST no debe almacenarse normalmente, ORBI LIVING adopta una política uniforme para evitar que intermediarios o futuras modificaciones dependan de supuestos de caché implícitos.

## Implementación
`next.config.ts` añade headers centralizados para:
- `/api/auth/:path*`;
- `/api/operations/:path*`.

Valor:

`Cache-Control: private, no-store`

Se mantiene además el set global existente:
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: SAMEORIGIN`;
- `Permissions-Policy` restrictiva.

No cambia lógica de Auth, Origin, permisos, RLS ni comandos.

## Contrato runtime ampliado
El smoke P1N ahora exige `private, no-store` también en:
- rechazo por Origin ausente;
- rechazo anónimo de vacante;
- rechazo anónimo de relevo;
- rechazo anónimo de incidencia;
- rechazo anónimo de apertura de bitácora;
- rechazo anónimo de inicio de ronda.

Así se valida el comportamiento real de Next después de build, no sólo la configuración declarativa.

## Cambios de datos
Ninguno.

Sin:
- DDL/migraciones;
- Supabase;
- secretos;
- PII;
- producción.

## Gates externos pendientes
- Preview Vercel;
- QA HTTP autenticado;
- E2E UI por rol;
- QA visual;
- HTTP 409 autenticado;
- P1E restore independiente;
- procedimiento PC2 antes de P2.

No fusionar automáticamente el stack.
