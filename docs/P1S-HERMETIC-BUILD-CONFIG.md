# ORBI LIVING — P1S Hermetic Build Config

## Objetivo
Evitar que `next build` modifique silenciosamente archivos de configuración rastreados durante CI.

P1S permanece **SYNTHETIC STAGING ONLY**, se apila sobre P1R (#46) y no cambia P1E Recovery.

## Problema observado
Los runs previos mostraban repetidamente:

> We detected TypeScript in your project and reconfigured your tsconfig.json file for you.

Next.js añadía `.next/dev/types/**/*.ts` porque el `include` rastreado sólo contenía `.next/types/**/*.ts`.

El build seguía GREEN, pero el checkout quedaba modificado durante compilación. Eso reduce reproducibilidad y puede ocultar cambios automáticos futuros.

## Corrección
`tsconfig.json` declara ahora ambos paths generados:
- `.next/types/**/*.ts`;
- `.next/dev/types/**/*.ts`.

## Contrato CI
Nuevo comando:

`npm run test:build-clean`

Ejecuta después de `next build`:

`git diff --exit-code -- tsconfig.json next-env.d.ts`

El Quality Gate falla si Next vuelve a reescribir esos archivos rastreados.

Orden de `npm run check`:
1. typecheck;
2. private boundary contract;
3. continuity contract;
4. operations-domain contract;
5. Next build;
6. clean-build-config contract;
7. anonymous runtime security smoke.

## Alcance
- sin cambios funcionales;
- sin Supabase;
- sin secretos/PII;
- sin DDL/migraciones;
- sin producción.

No fusionar automáticamente el stack.
