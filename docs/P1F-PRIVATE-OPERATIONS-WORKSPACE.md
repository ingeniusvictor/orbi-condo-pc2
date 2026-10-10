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

No agregar datos reales mientras el `PRODUCTION-READINESS-GATE` siga abierto.

## Evidencia obtenida en staging
- login Auth sintético de Administración confirmado desde la UI;
- `/api/auth/session` resuelve `pc2` y rol `administrator` después del login;
- dashboard privado carga bajo RLS y muestra incidencias visibles;
- se cargó una jornada sintética de prueba para `2026-10-10` con estados `planned`, `vacant`, `requested` y `confirmed`;
- el catálogo de cobertura mantiene únicamente personal sintético;
- la navegación flotante pública se excluye de `/operaciones` para no tapar controles de la consola privada.

## Qué NO se cierra con P1F
Aunque el cableado de UI exista, los siguientes gates permanecen pendientes hasta tener evidencia real:
- refresh → continuidad de sesión → logout probado end-to-end;
- `409` HTTP probado end-to-end con dos operaciones concurrentes autenticadas;
- rate limiting / abuso de login;
- MFA y política de contraseña de producción;
- backup lógico exitoso + restore independiente + smoke RLS;
- QA visual responsive manual completo;
- procedimiento operativo PC2 validado;
- infraestructura Supabase de producción.

Por eso **no marcar automáticamente G4 ni P1 como completos solo por este commit**.

## Validación esperada del corte
- `npm run check` GREEN;
- Preview Vercel READY con variables Preview de staging;
- `/operaciones` sin sesión muestra login privado;
- una sesión con `view_shift_schedule` puede leer el dashboard;
- roles sin permiso no reciben la consola operativa;
- no existen fetches del cliente a `*.supabase.co` ni escrituras directas a PostgREST;
- los comandos continúan sujetos a permisos server-side, RLS, transición de dominio y revisión optimista.

## Dependencia
PR apilado sobre P1E (#32) → P1D (#31) → P1C (#30) → P1B (#29) → P1A (#28) → P0/operaciones (#27).

No fusionar en orden inverso mientras el stack permanezca abierto.
