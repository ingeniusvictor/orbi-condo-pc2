# P1W · Runtime security headers contract

## Objetivo
Convertir los headers de seguridad definidos por `next.config.ts` en un contrato runtime verificable sobre `next start`, evitando regresiones silenciosas en superficies públicas y privadas.

## Contrato global
El smoke exige en páginas y APIs:
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `X-Frame-Options: SAMEORIGIN`;
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`;
- ausencia de `X-Powered-By`.

## Contrato de APIs privadas
En `/api/auth/*` y `/api/operations/*` se exige además:
- `Cache-Control: private, no-store`;
- ausencia de `Access-Control-Allow-Origin`, para no abrir lecturas privadas cross-origin por configuración accidental.

El contrato cubre sesión, lecturas privadas, rechazos por Origin, rechazos por Auth y logout.

## Superficies web
`/`, `/operaciones` y `/conserjeria` deben heredar los headers globales. Las superficies privadas mantienen además metadata `noindex`.

## Límites
- **SYNTHETIC STAGING ONLY**.
- No agrega CSP en este corte: una política CSP para Next debe diseñarse con nonce/hash de forma deliberada para no romper scripts del framework.
- HSTS se valida en la capa HTTPS del proveedor/Preview y no se exige al servidor HTTP local.
- Sin cambios de Auth, RLS, Supabase, permisos, datos o producción.
