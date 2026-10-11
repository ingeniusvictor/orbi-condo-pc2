# ORBI LIVING — Corte QA responsive de operaciones

## Alcance
Rutas del corte operativo actual:
- `/panel-operativo`
- `/calendario-turnos`
- `/turnos-planificador`
- `/emergencias-demo`
- `/operaciones-demo`
- `/entrega-turnos-demo`
- `/administracion-demo`

## Viewports objetivo
- 390×844 — móvil compacto
- 430×932 — móvil grande
- 768×1024 — tablet vertical
- 1440×900 — escritorio
- 1920×1080 — escritorio amplio

## Criterios obligatorios
- No debe existir scroll horizontal de página.
- Navegación debe envolver o desplazarse horizontalmente sin solaparse.
- Botones táctiles principales con altura útil cercana o superior a 44 px.
- Formularios y selectores deben ocupar el ancho disponible sin desbordar.
- Tarjetas deben apilarse antes de quedar por debajo del ancho legible.
- Textos largos y estados deben poder envolver.
- Ningún dato real o personal debe aparecer en previews públicas.
- Los avisos DEMO/PROTOTIPO deben permanecer visibles y comprensibles.
- Teclado: controles alcanzables por tabulación y foco claramente visible.
- Navegación entre rutas debe usar semántica de enlace; acciones locales deben conservar semántica de botón.
- En dispositivos con `safe-area-inset-bottom`, la barra flotante no debe quedar pegada al borde físico ni tapar el último contenido.

## Correcciones aplicadas en este corte
### Centro de incidencias
- Reemplazada la grilla fija de dos columnas por `auto-fit` con ancho máximo adaptativo.
- Añadido `minWidth: 0` a contenedores susceptibles a overflow.
- Narrativas largas usan `overflowWrap: anywhere`.
- Selectores de estado/responsable se adaptan a una sola columna en pantallas estrechas.

### Planificador semanal
- Selector de siete días pasa de siete columnas rígidas a una grilla `auto-fit`.
- Botones de día conservan una altura táctil mínima de 44 px.
- Tarjetas de turnos usan `minmax(min(100%,230px),1fr)` para evitar overflow.
- Motivo ilustrativo y botón de restablecimiento pueden envolver.
- Navegación superior puede envolver sin separadores rígidos.

### Navegación flotante operativa
- Las rutas operativas usan enlaces reales en vez de botones que simulan navegación.
- La ruta activa conserva `aria-current="page"`.
- Se añadió foco visible de alto contraste para teclado.
- Se ampliaron los targets de interacción y se mantuvo desplazamiento horizontal controlado en móvil.
- La posición inferior y el spacer consideran `env(safe-area-inset-bottom)`.
- La barra sigue agrupando `/turnos-planificador` y `/turnos-demo` bajo Turnos, y `/entrega-turnos-demo` bajo Bitácora.

## Validación automatizada
La rama debe mantener:
- `npm run check` GREEN;
- build Vercel READY;
- respuesta HTTP 200 de las rutas principales.

## Revisión estática realizada
La revisión de código cubre los riesgos principales que pueden detectarse sin navegador visual:
- grids con `minmax(min(100%, ...), 1fr)` o `auto-fit` en formularios y tarjetas;
- `minWidth: 0` en contenedores con contenido variable;
- wrapping explícito en navegaciones y textos largos;
- targets táctiles y foco visible de la navegación flotante;
- tratamiento de safe-area inferior;
- ausencia intencional de `overflow-x:hidden` global para no ocultar desbordes reales durante QA.

Esta revisión estática **no equivale a QA visual**.

## Validación visual pendiente
El build y la revisión de código no sustituyen una inspección visual real. Antes de mergear el corte deben revisarse manualmente al menos los cinco viewports objetivo, comprobando:
- clipping de títulos;
- overflow de selects;
- navegación flotante sobre contenido;
- contraste de estados;
- foco visible;
- altura de controles táctiles;
- lectura correcta en modo móvil;
- desplazamiento horizontal de la barra operativa sin mover toda la página;
- separación adecuada respecto al área segura inferior del dispositivo.

## Registro de inspección visual
Marcar solo después de inspección real en navegador o dispositivo:
- [ ] 390×844
- [ ] 430×932
- [ ] 768×1024
- [ ] 1440×900
- [ ] 1920×1080

## Condición de merge
No considerar este documento evidencia de QA visual completo hasta registrar explícitamente los viewports inspeccionados. El gate automático demuestra compilación y tipado, no percepción visual.
