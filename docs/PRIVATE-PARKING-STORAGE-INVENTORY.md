# Estacionamientos y Bodegas · arquitectura privada

Estado: **DISEÑO PREPARADO · SYNTHETIC STAGING ONLY · SIN PII REAL**

## Objetivo

Preparar un inventario privado para Administración que permita gestionar los 110 estacionamientos y 48 bodegas de Parque Ciudadano II sin exponer datos personales en el Portal de la Comunidad.

## Separación pública / privada

### Portal de la Comunidad
Puede mostrar únicamente información agregada e institucional:
- 110 estacionamientos;
- 48 bodegas;
- 278 departamentos;
- 1 local comercial;
- distribución general y referencias documentales.

No debe publicar nombres, teléfonos, correos, RUT, patentes, contratos, ausencias ni relaciones de propiedad/arrendamiento individual.

### Administración privada
La futura superficie autenticada podrá asociar cada activo con una unidad y, cuando se autorice el tratamiento de datos reales, con su relación de ocupación.

## Modelo propuesto

### `property_assets`
Inventario estable del condominio.

Campos previstos:
- `id`
- `community_id`
- `asset_type`: `parking` | `storage`
- `asset_code`
- `status`: `available` | `assigned` | `leased` | `loaned` | `review`
- `linked_unit_code` nullable
- `notes_private` nullable, restringido
- `active`
- timestamps / revision

Restricciones:
- código único por comunidad + tipo;
- sin DELETE operativo;
- cambios auditables;
- sin PII en el identificador del activo.

### `property_asset_occupancy`
Relación temporal entre activo y ocupación.

Campos previstos:
- `id`
- `community_id`
- `asset_id`
- `relationship`: `owner` | `tenant` | `authorized_user` | `loaned`
- `party_reference_id` nullable
- `valid_from`
- `valid_until` nullable
- `active`
- timestamps / revision

`party_reference_id` no debe contener el nombre en texto libre. Cuando se habiliten datos reales deberá apuntar a una entidad privada con controles de acceso específicos.

## Experiencia de Administración prevista

La navegación será:

`Administración → Estacionamientos y Bodegas`

La vista compacta debe permitir:
- buscar por código de estacionamiento o bodega;
- filtrar por tipo y estado;
- ver vínculo con departamento cuando exista;
- detectar activos sin asignación o en revisión;
- abrir una ficha de detalle;
- modificar una asignación sólo con permiso administrativo y auditoría.

La vista extendida podrá mostrar el inventario tabular completo.

## Privacidad

Hasta que exista aprobación formal para datos reales:
- no cargar nombres reales;
- no cargar RUT;
- no cargar teléfonos ni correos;
- no cargar patentes reales;
- no cargar contratos o documentos personales;
- usar únicamente identidades y unidades sintéticas para QA.

## Próxima implementación técnica

1. cerrar el modelo de permisos para inventario patrimonial;
2. crear migración staging con RLS;
3. crear API privada server-side;
4. incorporar módulo Compacta/Extendida;
5. sembrar sólo fixtures sintéticos;
6. certificar búsquedas, asignaciones y auditoría;
7. mantener Production bloqueado hasta aprobación específica de datos reales.
