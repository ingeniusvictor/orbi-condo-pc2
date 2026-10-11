# P1U · Hermetic Auth Lifecycle

## Objetivo
Convertir el ciclo de sesión privado en una prueba reproducible de runtime sin depender de red externa, credenciales reales ni Supabase staging.

El test levanta dos procesos locales:
1. el build real de ORBI LIVING mediante `next start` con `NODE_ENV=production`;
2. un upstream HTTP sintético que implementa únicamente el contrato mínimo usado por las rutas Supabase Auth/PostgREST.

## Datos sintéticos
El upstream usa exclusivamente valores ficticios y no sensibles:
- email de dominio `.invalid`;
- contraseña sintética fija;
- UUID sintético;
- access/refresh tokens sintéticos;
- comunidad `pc2` y rol `concierge` sintéticos.

Nada de lo anterior representa un usuario, credencial o token real.

## Flujo protegido
`npm run test:auth-hermetic` valida sobre el servidor Next de producción:
- sesión inicial configurada pero anónima;
- login sin `Origin` bloqueado antes del upstream;
- login inválido normalizado a 401 y sin cookies;
- login válido con emisión de cookies endurecidas;
- resolución de `pc2 / concierge` y permisos de mínimo privilegio;
- refresh con rotación de access y refresh token;
- sesión válida después de rotación;
- logout con revocación del upstream sintético y limpieza local de ambas cookies;
- retorno final a sesión anónima.

## Política de cookies comprobada
- `HttpOnly`;
- `Secure` bajo runtime production;
- `SameSite=Strict`;
- `Path=/`;
- host-only, sin `Domain`;
- access cookie con `Max-Age` derivado del upstream;
- refresh cookie deliberadamente browser-session en este corte;
- logout limpia ambas cookies con `Max-Age=0`.

## Frontera de permisos
La identidad sintética `concierge` debe recibir capacidades operativas como lectura de turnos, bitácora y rondas, pero no `manage_shift_schedule` ni `manage_incident`.

## Límites
- **SYNTHETIC STAGING ONLY**.
- El upstream es un doble de contrato local; no sustituye Supabase Auth ni RLS reales.
- No sustituye `qa:operations` contra staging con credenciales sintéticas seguras.
- No confirma todavía las cuentas Auth sintéticas de Conserjería/Mayordomía.
- No prueba todavía el conflicto HTTP 409 autenticado contra staging.
- No toca Supabase staging ni producción y no requiere secretos.
- P1E backup + restore independiente continúa pendiente.
- P2 y producción permanecen bloqueados hasta completar sus gates reales.
