# ORBI LIVING — P1F Private Operations Workspace

## Objetivo
Conectar una primera superficie privada real de ORBI LIVING a los endpoints controlados de P1C/P1D sin introducir datos reales ni permitir escrituras directas desde el navegador hacia tablas privadas.

P1F no convierte staging en producción. El estado sigue siendo **SYNTHETIC STAGING ONLY** y P1E permanece pendiente de una restauración independiente probada.

## Superficie nueva

### `/operaciones`
Consola autenticada que:
- valida la sesión mediante `/api/auth/session`;
- intenta una sola renovación mediante `/api/auth/refresh` cuando corresponde;
- inicia sesión mediante `/api/auth/login`;
- cierra sesión mediante `/api/auth/logout`;
- resuelve permisos y rol desde el servidor;
- nunca recibe access/refresh tokens en JavaScript del cliente.

### `/api/operations/dashboard?date=YYYY-MM-DD`
Lectura privada server-side que:
- requiere `view_shift_schedule`;
- fija `community_id` desde la identidad autenticada;
- consulta Supabase con el JWT de la sesión del servidor y RLS activo;
- devuelve turnos de la fecha seleccionada;
- devuelve incidencias abiertas visibles por RLS;
- devuelve catálogo privado de cobertura solo para administrador/mayordomo, quienes ya tienen `manage_shift_schedule`;
- no devuelve contactos, RUT, patentes, contratos, narrativas privadas ni `assignee_staff_id` de turnos; para el cliente solo expone `hasAssignee`.

## Comandos cableados en UI
La consola usa exclusivamente endpoints server-side existentes:

### Turnos
- reportar vacante → `/api/operations/shifts/report-gap`;
- solicitar reemplazo → `/api/operations/shifts/command`;
- confirmar reemplazo con persona habilitada → `/api/operations/shifts/command`;
- registrar recepción/relevo → `/api/operations/shifts/handoff`.

Cada mutación envía `expectedRevision`. Un `409` fuerza recarga antes de continuar en lugar de sobrescribir silenciosamente otro cambio.

### Incidencias
- registrar incidencia estructurada → `/api/operations/incidents/report`;
- transición de estado → `/api/operations/incidents/command`;
- cambio de prioridad → `/api/operations/incidents/command`;
- cambio de rol responsable → `/api/operations/incidents/command`.

El alta mantiene el corte sin narrativa libre: área, prioridad y una referencia corta opcional con caracteres restringidos.

## Frontera de privacidad
P1F puede mostrar `display_name` de `staff_private` únicamente dentro de la consola autenticada y solo a roles que administran cobertura. En staging esos registros deben seguir siendo sintéticos.

La política RLS `staff_private_operational_select` quedó endurecida para permitir SELECT únicamente a `administrator` y `mayordomo`. Conserjería conserva las acciones operativas que necesita sobre turnos, pero ya no puede leer directamente el catálogo privado de personal de cobertura.

No agregar datos reales mientras el `PRODUCTION-READINESS-GATE` siga abierto.

## Evidencia obtenida en staging
- login Auth sintético de Administración confirmado desde la UI;
- `/api/auth/session` resuelve `pc2` y rol `administrator` después del login;
- dashboard privado carga bajo RLS y muestra incidencias visibles;
- existe una jornada sintética de prueba para `2026-10-10` con turno AM `planned`, turno PM `vacant`, turno Noche `requested` y una cobertura especial `confirmed`;
- el catálogo de cobertura contiene únicamente los dos suplentes sintéticos habilitados;
- existe evidencia persistida en `shift_events` de un fixture sintético que recorrió `planned → vacant → requested → confirmed → received`, terminando en revisión 5. Esto demuestra la cadena de dominio/persistencia P1C, pero no sustituye el gate HTTP/UI P1F;
- existen membresías sintéticas de Mayordomía y Conserjería. Sus cuentas Auth todavía no están confirmadas, por lo que el E2E por rol permanece pendiente sin modificar manualmente `auth.users`;
- la navegación flotante pública se excluye de `/operaciones` para no tapar controles de la consola privada;
- `/operaciones` incorpora hardening responsive específico de ruta: safe-area inferior, prevención de overflow horizontal y apilado de controles estrechos en móvil;
- RLS de `staff_private` fue alineado con la frontera de privacidad P1F: solo Administración/Mayordomía pueden leer el catálogo privado.

## Harness E2E repetible
`scripts/qa-private-operations.mjs` y `npm run qa:operations` permiten ejecutar, sin guardar secretos en Git:
1. login;
2. session autenticada y rol esperado;
3. lectura de dashboard bajo RLS;
4. refresh y continuidad de sesión;
5. logout y verificación de sesión cerrada.

Con `ORBI_QA_409=1`, el mismo harness toma un turno sintético `planned`, lanza dos `report-gap` concurrentes con el mismo `expectedRevision`, exige exactamente un HTTP 200 y un HTTP 409, vuelve a leer la revisión vigente y restaura el fixture a `planned` mediante el endpoint controlado.

Credenciales de QA deben existir únicamente como variables de entorno locales (`ORBI_QA_EMAIL`, `ORBI_QA_PASSWORD`). Nunca deben incorporarse al repositorio, logs o documentación.

## Qué NO se cierra con P1F
Aunque el cableado de UI exista, los siguientes gates permanecen pendientes hasta tener evidencia real:
- refresh → continuidad de sesión → logout ejecutado end-to-end mediante el harness o navegador autenticado;
- `409` HTTP ejecutado end-to-end con dos operaciones concurrentes autenticadas;
- login/UI/RLS probado con cuentas Auth confirmadas de Mayordomía y Conserjería;
- rate limiting / abuso de login;
- MFA y política de contraseña de producción;
- backup lógico exitoso + restore independiente + smoke RLS;
- QA visual responsive manual completo en 390×844, 430×932, 1440×900 y 1920×1080;
- procedimiento operativo PC2 validado;
- infraestructura Supabase de producción.

Por eso **no marcar automáticamente G4 ni P1 como completos solo por este corte**.

## Validación esperada del corte
- `npm run check` GREEN;
- Preview Vercel READY con variables Preview de staging;
- `/operaciones` sin sesión muestra login privado;
- una sesión con `view_shift_schedule` puede leer el dashboard;
- roles sin permiso no reciben la consola operativa;
- no existen fetches del cliente a `*.supabase.co` ni escrituras directas a PostgREST;
- los comandos continúan sujetos a permisos server-side, RLS, transición de dominio y revisión optimista;
- P1E Recovery sigue pendiente y no bloquea el trabajo sintético de staging.

## Dependencia
PR apilado sobre P1E (#32) → P1D (#31) → P1C (#30) → P1B (#29) → P1A (#28) → P0/operaciones (#27).

No fusionar en orden inverso mientras el stack permanezca abierto.
