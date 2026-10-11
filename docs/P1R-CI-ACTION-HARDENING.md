# ORBI LIVING — P1R CI Action Hardening

## Objetivo
Eliminar la advertencia de runtime Node 20 de las acciones base de GitHub Actions y reducir privilegios/credenciales persistentes del Quality Gate, sin cambiar el runtime de ORBI LIVING.

P1R permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1Q (#45) y no modifica P1E Recovery.

## Cambios
`.github/workflows/quality.yml` pasa de tags mayores `@v4` a commits completos verificados de versiones oficiales actuales:

- `actions/checkout` v7.0.1 → `3d3c42e5aac5ba805825da76410c181273ba90b1`;
- `actions/setup-node` v7.1.0 → `949feb2413d6458794dcd2491c4babbbce0c15c1`.

Ambas líneas modernas ejecutan la action sobre Node 24, eliminando la dependencia interna de Node 20 que GitHub ya fuerza/depreca en runners actuales.

## Least privilege
El workflow declara:

`permissions: contents: read`

El checkout añade:

`persist-credentials: false`

El Quality Gate sólo necesita leer el repositorio; no necesita escribir commits, PRs, paquetes ni deployments.

## Runtime del proyecto
No cambia:
- el proyecto sigue probándose con `node-version: 22`;
- `npm run check` conserva typecheck, boundary contract, continuity contract, operations-domain contract, build y anonymous runtime smoke.

La versión interna usada por las acciones y la versión Node de la aplicación son conceptos distintos.

## Alcance de seguridad
- sin secretos nuevos;
- sin Supabase;
- sin DDL/migraciones;
- sin PII;
- sin producción;
- sin cambios funcionales de la app.

El propio PR debe pasar Quality Gate usando las nuevas acciones pinneadas antes de considerar el mantenimiento válido.

No fusionar automáticamente el stack.
