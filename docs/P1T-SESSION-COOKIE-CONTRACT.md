# P1T · Session cookie contract

## Objetivo
Eliminar la duplicación de la política de cookies de sesión entre login, refresh y logout, y convertir sus atributos de seguridad en evidencia runtime reproducible.

## Cambios
- `lib/server/operations-cookies.ts` concentra setters y clearers para `orbi_session` y `orbi_refresh`.
- Login y refresh emiten cookies mediante el mismo helper.
- Logout limpia ambas cookies mediante el mismo helper.
- El smoke anónimo post-build ejecuta logout sobre `next start` con `NODE_ENV=production` y backend Supabase deliberadamente ausente.

## Contrato runtime
Para ambas cookies limpiadas por logout, CI exige:
- valor vacío;
- `HttpOnly`;
- `Secure` en runtime production;
- `SameSite=Strict`;
- `Path=/`;
- `Max-Age=0`;
- ausencia de `Domain` para mantenerlas host-only.

También exige que logout sea localmente idempotente sin backend configurado, responda `ok:true`, no declare revocación remota y mantenga `Cache-Control: private, no-store`.

## Límites
- SYNTHETIC STAGING ONLY.
- No introduce remember-me ni persistencia del refresh token; esa decisión sigue reservada para readiness productivo.
- No cambia nombres de cookies, Auth, RLS, permisos, Supabase ni datos.
- No sustituye el E2E autenticado pendiente con credenciales sintéticas seguras.
- P1E restore independiente continúa pendiente.
