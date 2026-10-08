# ORBI Finance · Importación, trazabilidad y privacidad

## Objetivo
Convertir informes mensuales de Comunidad Feliz en un libro de movimientos verificable y visualizaciones por período, categoría, proveedor, torre y sistema. El PDF original es la fuente primaria; la extracción automatizada futura requiere revisión humana.

## Reglas de datos
1. Guardar mes contable (YYYY-MM) separado de fecha de pago. Una fecha de octubre puede corresponder al informe de septiembre.
2. Conservar importes con signo: devoluciones son negativas, no gastos positivos.
3. Conservar número de documento, descripción, página y referencia al archivo original. Nunca inventar documentos o fechas ausentes.
4. Mantener anticipos, liquidaciones, Previred, reemplazos y honorarios de administración en conceptos separados; no contar anticipos dos veces.
5. Un registro de pago no confirma relación laboral vigente, dotación contractual, turno ni sueldo bruto. El informe de septiembre identifica 11 personas con anticipos y liquidaciones, pero no certifica la nómina.
6. Una cuota 07/12 es una referencia del documento, no prueba de que existan cinco cuotas futuras pendientes; validar contrato, calendario y pagos.
7. Una descripción por torre permite asignación a esa torre; no repartir gastos generales entre torres sin criterio aprobado.
8. Mantener proveedor normalizado separado del texto original. No inferir contratos activos a partir de facturas históricas.
9. La suma de movimientos del período debe conciliar exactamente con el total del PDF, con registro de diferencias y revisión.
10. No afirmar ingresos, abonos, morosidad, saldo bancario ni presupuesto sin los informes correspondientes.

## Accesos y seguridad
- Residente: totales agregados y proveedores, sin datos personales ni remuneraciones individuales.
- Comité: revisión de egresos y evidencias aprobadas, con datos laborales minimizados.
- Administrador: revisión, clasificación, publicación y auditoría; acceso a datos personales solo cuando exista autorización y controles reales.
- Hasta que exista autenticación y autorización de servidor, no publicar ni almacenar en el frontend información salarial individual, identificadores personales o documentos internos.
- Nunca usar un simple selector de rol del navegador como control de acceso.

## Evolución
Fase 1: informe histórico de septiembre de 2026 y vista agregada.
Fase 2: modelo de movimientos, conciliación y procedencia (este cambio).
Fase 3: ingestión PDF con detección de duplicados, revisión humana y almacenamiento privado.
Fase 4: comparativas, contratos, compromisos y presupuesto una vez disponibles documentos de respaldo.
