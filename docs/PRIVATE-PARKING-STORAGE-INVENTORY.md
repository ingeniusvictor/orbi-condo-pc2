# Estacionamientos y Bodegas · arquitectura privada

Estado: **ESTACIONAMIENTOS IMPLEMENTADOS EN STAGING · SYNTHETIC STAGING ONLY · SIN PII REAL**

## Objetivo

Mantener un inventario privado y auditable para Administración, Conserjería y Mayordomía que permita localizar rápidamente un puesto de estacionamiento, relacionarlo con una unidad y consultar si está asociado al propietario o a un arrendatario.

La superficie pública del Portal de la Comunidad continúa separada: no publica nombres, ocupantes, vehículos ni relaciones individuales.

## Inventario físico validado

La matriz física de estacionamientos se mantiene separada del dato registral/documental agregado de recepción.

### Exterior / primer piso
- 72 puestos de residentes: `E1`–`E72`;
- 2 puestos de visitas: `V01`–`V02`;
- 2 puestos de comercio: `LC01`–`LC02`;
- total físico exterior: **76**.

### Subterráneo
- 110 puestos numerados de forma continua: `73`–`182`;
- total físico subterráneo: **110**.

### Total físico de referencia

**186 puestos** = 76 exteriores + 110 subterráneos.

Este total físico no reemplaza automáticamente cifras jurídicas o de recepción usadas en otras superficies del producto. Cada fuente conserva su contexto.

## Implementación OC-PC2-110

### `property_assets`
Inventario estable del condominio.

Campos principales:
- `id`;
- `community_id`;
- `asset_type`: `parking` | `storage`;
- `asset_code`;
- `parking_level`: `exterior` | `subterranean`;
- `parking_class`: `resident` | `visit` | `commercial`;
- `zone_code`;
- `status`: `available` | `assigned` | `leased` | `loaned` | `review`;
- `linked_unit_code`;
- `sort_order`;
- `active`;
- timestamps y `revision`.

El estacionamiento físico es permanente aunque cambie su ocupación.

### `property_parties_private`
Referencia privada a una persona/parte vinculada con el activo.

En este gate acepta **únicamente fixtures sintéticos**:
- alias `SINT-*`;
- unidad `DEMO-*`;
- `synthetic=true` obligatorio.

No se permiten todavía nombres reales, RUT, teléfonos ni correos.

### `property_asset_occupancy`
Relación temporal entre activo y parte:
- `owner`;
- `tenant`;
- `authorized_user`;
- `loaned`.

Permite conservar el historial cuando un estacionamiento cambia de arrendatario o vuelve a uso del propietario. No hay DELETE operativo.

## Permisos

### Conserjería
Permiso `lookup_parking`:
- buscar puesto;
- consultar nivel, sector y estado;
- ver unidad/alias privado habilitado;
- identificar propietario o arrendatario vigente;
- ver referencia sintética de vehículo en staging.

No puede modificar relaciones.

### Mayordomía
Permiso `lookup_parking` con la misma consulta operativa.

No puede modificar relaciones en este gate.

### Administración
Permisos `lookup_parking` + `manage_parking`:
- consulta completa;
- edición de propietario/arrendatario;
- vínculo con unidad;
- referencia de vehículo;
- marcar revisión;
- cambios con revisión optimista y auditoría.

## API privada

### `GET /api/operations/parking`
Devuelve:
- resumen físico;
- catálogo mínimo para renderizar los mapas;
- búsqueda por puesto, unidad, alias privado o vehículo.

Ejemplos de búsqueda:
- `126` → estacionamiento subterráneo 126;
- `12` → exterior `E12`;
- `V1` → `V01`;
- alias `SINT-*`;
- unidad o vehículo `DEMO-*`.

Requiere `lookup_parking` y usa autorización server-side + RLS.

### `POST /api/operations/parking/command`
Comando administrativo para actualizar relación y ocupación.

Controles:
- origen confiable;
- permiso `manage_parking`;
- revisión optimista;
- RPC transaccional;
- auditoría;
- guardas `SINT-*` / `DEMO-*`.

## Interfaz privada

Ruta:

`/operaciones/estacionamientos`

Incluye:
- buscador rápido;
- mapa interactivo exterior;
- mapa interactivo subterráneo;
- clic directo sobre cada puesto;
- ficha de relación;
- estado visual;
- edición administrativa sintética;
- acceso directo desde `/operaciones` para roles con `lookup_parking`.

La UI no consulta Supabase directamente: todas las operaciones pasan por rutas privadas server-side.

## Privacidad y producción

Hasta una aprobación posterior y explícita:
- no cargar nombres reales;
- no cargar RUT;
- no cargar teléfonos ni correos;
- no cargar patentes reales;
- no cargar contratos ni documentos personales;
- no promover este flujo a Production;
- usar únicamente alias `SINT-*`, unidades `DEMO-*` y vehículos `DEMO-*`.

La migración incorpora restricciones de base de datos para bloquear accidentalmente valores que no sigan esas convenciones durante este gate.

## Próximos gates

1. certificar CI, búsqueda y edición reversible en staging;
2. validar visualmente los dos mapas en Preview;
3. completar política de tratamiento y acceso a PII real;
4. diseñar importación/carga inicial administrativa con trazabilidad;
5. extender la misma arquitectura a las 48 bodegas;
6. mantener Production bloqueado hasta aprobación específica.
