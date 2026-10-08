# ORBI LIVING · Liquidaciones editables y privacidad

## Estado real
Los documentos de agosto y septiembre de 2026 son fuentes históricas. Los resúmenes agregados en la web son de solo lectura. La aplicación **no** tiene todavía autenticación real, persistencia de cambios, segregación de datos por unidad, emisión de liquidaciones ni integración de pago.

## Diseño para administración editable
- Catálogo de unidades y anexos (departamento, bodega, estacionamiento) con prorrateos versionados y vigencia.
- Liquidación privada por unidad y período, con líneas ordinarias, reserva, extraordinarios y ajustes.
- Borrador → revisión → emisión; rectificaciones generan nueva revisión, nunca sobrescritura silenciosa.
- Historial de auditoría: actor autenticado, fecha, motivo y valores anteriores/nuevos.
- Importación PDF/CSV privada, deduplicación por huella, folio y período, conciliación y aprobación humana.
- Los vencimientos y observaciones se almacenan literalmente; discrepancias entre encabezado y nota se marcan para revisión.
- El saldo del fondo de reserva del informe no equivale a saldo bancario verificado.

## Control de acceso obligatorio antes de producción
- Administrador: CRUD y emisión dentro de la comunidad; cambios críticos auditados.
- Comité: revisión y observaciones, sin alteración unilateral de cobros oficiales.
- Residente: acceso **solo a sus unidades** tras verificar titularidad/autorización; jamás por URL con ID predecible.
- Los PDF privados y comprobantes deben almacenarse en almacenamiento privado con políticas de acceso del servidor.
- No incluir nombres de residentes, números de unidad, códigos de pago, cuenta bancaria, sueldos ni documentos personales en el repositorio o bundle público.
- Los controles de UI son conveniencia, **no** seguridad. Requiere autenticación, autorización y políticas de datos en backend.

## Validaciones de cálculo
- Pesos chilenos enteros; redondeo del prorrateo definido y documentado.
- Porcentaje de fondo de reserva configurable y versionado.
- Separar gastos comunes del período, fondo de reserva, saldos previos, abonos y ajustes.
- No calcular el cobro individual a partir de egresos del mes sin el total de cobro, coeficientes y reglas oficiales.
