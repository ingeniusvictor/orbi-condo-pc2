# ORBI LIVING — P1A · Operations Auth Foundation

## Objetivo
Separar la futura operación privada de las demos públicas actuales mediante un límite de autenticación y autorización server-side reutilizable para turnos, incidencias, relevo y administración operativa.

Este corte **no activa datos reales** y no requiere credenciales para compilar. Si `SUPABASE_URL` y `SUPABASE_ANON_KEY` no existen, los endpoints permanecen en modo no configurado.

## Qué incorpora
- `lib/server/operations-auth.ts` como boundary server-only genérico.
- Cookie `httpOnly`, `sameSite=strict` y `secure` en producción.
- Login POST con validación básica de tamaño/origen y errores genéricos.
- Logout POST con comprobación de origen.
- Session GET que devuelve únicamente estado de configuración, autenticación, comunidad, rol y permisos efectivos propuestos.
- Verificación de identidad contra Supabase Auth antes de consultar membresía.
- Rol obtenido desde `memberships.operations_role`; el cliente nunca envía un rol autoritativo.
- Scope de comunidad resuelto por servidor mediante `ORBI_COMMUNITY_ID` (por defecto `pc2`).
- Reutilización de la matriz de permisos de `data/operations-permissions.ts` únicamente después de identidad verificada.

## Variables previstas
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ORBI_COMMUNITY_ID=pc2`

Nunca usar `service_role` en browser, bundles públicos o variables `NEXT_PUBLIC_*`.

## Tabla mínima esperada para la siguiente subfase
El boundary espera una tabla privada/RLS `memberships` con al menos:
- `user_id uuid`
- `community_id text`
- `operations_role text`
- `active_from timestamptz nullable`
- `active_until timestamptz nullable`
- `disabled_at timestamptz nullable`

Los roles aceptados por este corte son:
- `administrator`
- `committee`
- `concierge`
- `mayordomo`
- `resident`

## Estado de sesión
Este primer corte conserva únicamente el access token y limita la cookie a un máximo de 1 hora. No implementa refresh token automático. Por lo tanto, **P1A no se considera sesión productiva completa**; un usuario deberá volver a autenticarse cuando expire.

Antes de producción deben resolverse explícitamente:
- refresh/session rotation o estrategia equivalente;
- rate limiting de login;
- política de bloqueo/alerta ante intentos repetidos;
- MFA si la política operativa lo exige;
- revocación y deshabilitación de membresías;
- pruebas de expiración, logout y sesiones concurrentes.

## CSRF y origen
Las escrituras autenticadas por cookie deben exigir origen same-site. `trustedOrigin()` rechaza POST sin `Origin` válido o con origen distinto. `SameSite=Strict` aporta una segunda barrera, pero no reemplaza autorización del recurso.

## Lo que deliberadamente NO se incluye todavía
- endpoint de turnos reales;
- incidencias reales;
- nombres de personal;
- residentes, teléfonos, patentes o contactos;
- service role;
- migración SQL ejecutada;
- almacenamiento documental;
- notificaciones;
- automatización de emergencias.

## Relación con OC-PC2-40
El PR histórico OC-PC2-40 demostró una primera base de Auth/RLS centrada en borradores financieros. P1A generaliza el boundary para Operaciones y evita que finanzas determine el diseño de identidad del resto de ORBI LIVING. No se debe fusionar ambos PR a ciegas: las migraciones y rutas deben consolidarse en una sola arquitectura antes de activar Supabase.

## Gate P1A
P1A puede considerarse listo para revisión cuando:
- `npm run check` termina GREEN;
- el preview Vercel compila sin variables Supabase;
- `/api/auth/session` responde `configured:false` cuando no hay backend;
- no existe PII ni secreto en GitHub;
- el PR queda apilado sobre OC-PC2-41 hasta que el corte operativo sea fusionado;
- no se presenta este trabajo como backend productivo.
