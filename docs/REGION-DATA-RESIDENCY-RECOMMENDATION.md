# ORBI LIVING — Recomendación técnica de región y residencia

## Estado
**RECOMENDACIÓN TÉCNICA · NO APROBACIÓN LEGAL · ADMINISTRATOR ONLY · SYNTHETIC STAGING ONLY · PRODUCTION BLOCKED**

Este documento cierra la parte técnica que puede analizarse antes de crear Production. No crea proyectos, no mueve datos, no cambia la región de Vercel y no autoriza datos reales.

## 1. Inventario verificado del staging actual

### Supabase

Proyecto: `orbi-living-pc2-staging`  
Ref: `drqjpzydgihrrdnkhewh`  
Región observada: `sa-east-1`  
Estado observado: `ACTIVE_HEALTHY`

La documentación actual de Supabase indica que cada proyecto tiene una región primaria y que Postgres, Auth y Storage se alojan en esa región primaria. Para Sudamérica, la región específica disponible observada en la documentación es `sa-east-1` (São Paulo).

### Vercel

Proyecto: `orbi-condo-pc2`  
Plan del equipo observado: `hobby`  
Node: `24.x`  
Estado del proyecto observado: `live=false`

Un Preview READY inspeccionado el 2026-10-16 ejecutó sus Functions en `iad1`. La documentación actual de Vercel indica que, si no se configura otra región, `iad1` es el default de Functions y que Hobby permite configurar una sola región de ejecución.

## 2. Problema técnico actual

En staging, la ruta dinámica queda hoy separada regionalmente:

`Vercel Functions iad1 → Supabase sa-east-1`

Eso implica tráfico servidor↔base de datos entre regiones para las APIs privadas. No es una fuga de datos por sí sola ni demuestra incumplimiento legal, pero añade distancia de red y hace menos predecible el análisis de localización del procesamiento.

## 3. Recomendación técnica para el diseño futuro

Antes de crear Supabase Production, ORBI debería decidir deliberadamente la región de datos y después alinear la región de Functions con esa decisión.

### Candidato técnico actual

- Supabase Production: `sa-east-1`.
- Vercel Functions: `gru1`, **sujeto a revalidar en Vercel inmediatamente antes de aplicar configuración**.
- Objetivo: mantener el backend dinámico y la base de datos en la misma zona geográfica de Sudamérica tanto como lo permitan los proveedores/plan vigentes.

Esta es una recomendación de arquitectura/latencia y control de localización; **no es una conclusión legal de residencia de datos**.

## 4. Por qué no debemos crear Production todavía

Supabase documenta que cambiar la región de un proyecto requiere crear otro proyecto y migrar. Por eso la región de Production debe decidirse correctamente **antes** de crear el proyecto real, no corregirse después con datos reales dentro.

Además, una evaluación de residencia debe considerar más que la base principal: backups, logs, exportaciones, servicios externos, Edge Functions y subprocesadores pueden introducir transferencias adicionales.

## 5. Chile vs. Sudamérica

En la documentación de regiones de Supabase consultada el 2026-10-16 no aparece una región específica de Chile; la región específica indicada para Sudamérica es `sa-east-1` (São Paulo).

Por tanto, ORBI no debe prometer “datos alojados en Chile” con esta arquitectura. Si la futura revisión legal/contractual exige alojamiento físico en Chile, este diseño debe detenerse y reevaluarse antes de cargar datos reales.

## 6. Vercel y el plan Hobby

La documentación actual de Vercel indica que Hobby admite una sola región de Functions, mientras planes superiores pueden admitir múltiples regiones. Para este proyecto eso no es necesariamente una desventaja: al existir una base primaria de Supabase en una región, una sola región de backend cercana a la base evita que la lógica privada salte entre regiones.

No se propone multi-region ni failover de Functions en este gate.

## 7. Qué NO cambia este gate

Este documento no:

- crea Supabase Production;
- crea ni migra datos;
- cambia la región de staging;
- cambia la región del proyecto Vercel;
- añade `vercel.json`/`vercel.ts` con región;
- habilita failover o multi-region;
- promueve un deployment a Production;
- cambia secretos/env vars;
- abre P1E;
- habilita P2;
- afirma aprobación legal, contractual o administrativa para Brasil.

## 8. Decisión futura requerida antes de Production

Antes de crear Supabase Production se debe registrar explícitamente:

1. región de datos aprobada;
2. aceptación legal/contractual de esa ubicación;
3. región de Vercel Functions seleccionada y revalidada contra el catálogo vigente;
4. tratamiento de logs/backups/exportaciones/subprocesadores;
5. plan de contingencia si el requisito de ubicación cambia.

Hasta entonces, `sa-east-1` + `gru1` es sólo el **candidato técnico recomendado**, no configuración activa de Production.

## Resultado

- Staging Supabase region: **VERIFICADA · `sa-east-1`**.
- Preview Function region actual: **VERIFICADA · `iad1`**.
- Desalineación regional de staging: **IDENTIFICADA**.
- Candidato técnico futuro: **`sa-east-1` + `gru1` · PENDIENTE DE APROBACIÓN/REVALIDACIÓN**.
- Production Supabase: **NO CREADO**.
- Configuración regional de Vercel: **NO MODIFICADA**.
- Datos reales: **BLOQUEADOS**.

**NO LEGAL CLAIM · NO PRODUCTION MUTATION · NO REAL DATA**
