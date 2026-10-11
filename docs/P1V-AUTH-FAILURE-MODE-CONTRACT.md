# P1V · Auth failure-mode contract

## Objetivo
Endurecer el ciclo Auth hermético de P1U con escenarios negativos que deben fallar cerrados antes de habilitar datos reales.

## Casos protegidos
El mismo upstream sintético local valida que:
- un login sobredimensionado responde 413 antes de alcanzar Auth upstream;
- un access token desconocido nunca crea identidad;
- membresías deshabilitadas, futuras, expiradas o con rol desconocido resuelven sesión anónima;
- un refresh ausente responde 401 y limpia el access cookie obsoleto;
- un refresh inválido responde 401 y limpia access + refresh;
- un refresh válido posterior sigue rotando ambos tokens;
- un access token revocado por logout no puede reconstruir sesión.

## Invariantes de privacidad y sesión
Todos los estados rechazados mantienen `communityId`/`role` nulos y permisos vacíos. Los errores de Auth expuestos por la app permanecen normalizados y no reflejan payloads internos del upstream sintético.

La limpieza de cookies mantiene la política compartida de P1T: `HttpOnly`, `Secure` en runtime production, `SameSite=Strict`, `Path=/`, host-only y `Max-Age=0` cuando corresponde.

## Aislamiento
- **SYNTHETIC STAGING ONLY**.
- Sin red externa durante el test.
- Sin secretos ni credenciales reales.
- Sin cambios en Supabase staging o producción.
- Sin DDL, RLS, permisos o datos nuevos.

## Límites
Este contrato no sustituye Supabase Auth/RLS real, `qa:operations` autenticado, el conflicto HTTP 409 de staging, E2E UI, QA visual ni el restore independiente P1E.
