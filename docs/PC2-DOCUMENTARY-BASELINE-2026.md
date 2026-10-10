# ORBI LIVING — Levantamiento documental PC2 (octubre 2026)

> Documento de requisitos derivado de documentos entregados por la comunidad. **No publicar PDFs originales, firmas, RUT personales ni información de trabajadores en el repositorio público.** Los datos institucionales aquí indicados son solo los estrictamente necesarios para diseñar el producto.

## Evidencia recibida y alcance

1. **Contrato de Administración, 20-03-2024, 4 páginas.** Establece que el condominio tiene **278 unidades habitacionales** (cláusula primera); que la administradora presta servicios a Subadministración I y II (segunda); que contrata servicios y personal con autorización previa de la Comunidad (tercera); que rinde cuenta mensualmente al Comité y anualmente a la Asamblea (octava); que vela por las obligaciones laborales y previsionales de la Comunidad con su personal (octava); y que debe atender urgencias y emergencias **24 horas al día, 7 días a la semana** (octava). No define turnos individuales ni número de trabajadores.
2. **Anexo de administración, 13-07-2026, 1 página.** Modifica honorarios de la administradora a **23,193 UF más IVA**; indica período hasta **13-07-2027** y renovación anual salvo aviso. Describe aviso de 60 días en contexto de término anticipado; el contrato base menciona 90 días en contexto de remoción. **No resolver jurídicamente esta aparente tensión desde la aplicación**.
3. **Factura ComunidadFeliz, 25-03-2026, 1 página.** Contratación facturada de plataforma por **$626.084 netos, $118.956 IVA, $745.040 total**. **No demuestra periodicidad mensual ni funcionalidades contratadas**.
4. **Captura ComunidadFeliz, mes en curso septiembre 2026.** Menú visible: Recaudación, Egresos, Gasto común, Panel, Cobranza y recaudación, Comunidad conectada, Contabilidad y finanzas, Conserjería > Encomiendas, Libro de visitas, Bitácora, Control de acceso, Citofonía digital; Remuneraciones, Conexión con bancos, Seguros. **Menú visible no prueba acceso efectivo ni integración/API disponible**.

## Requisitos respaldados

- **PC2-ADM-01:** Configurar 278 unidades como referencia documental inicial, con estado `pendiente_verificacion_inventario`; evitar generar fichas de residentes sin base legal ni autorización.
- **PC2-ADM-02:** Separar gestión de Subadministración I y II en el modelo institucional; solicitar delimitación operativa antes de segmentar unidades.
- **PC2-ADM-03:** Flujo de cobertura urgente con escalamiento al responsable autorizado y canales externos alternativos, alineado con deber contractual de atención 24/7. **No afirmar que cada ausencia constituye incumplimiento contractual**.
- **PC2-ADM-04:** Bitácora operativa y registro de decisiones para eventual rendición, sin sustituir la contabilidad ni los documentos oficiales.
- **PC2-ADM-05:** Gestión de autorizaciones para contratación/reemplazo como función futura; no permitir que una simulación autorice contrataciones reales.
- **PC2-ADM-06:** Evitar replicar módulos ComunidadFeliz sin evaluar capacidades actuales. Diseñar exportación manual y coexistencia; no asumir API, credenciales ni interoperabilidad.
- **PC2-ADM-07:** Contratos, facturas y firmas únicamente en almacén privado, acceso restringido y trazabilidad; en GitHub público solo especificaciones no sensibles.
- **PC2-ADM-08:** Recordatorios configurables para informes mensuales y anuales; validar responsables, fechas y formato antes de automatizar.
- **PC2-ADM-09:** Registrar contratos como referencias de gestión y fechas, sin conclusiones jurídicas automáticas.

## Separación de fuentes y declaraciones verbales

Los horarios 07:00–14:30, 14:30–22:00, 22:00–07:00, domingo/feriado 08:00–20:00 y complementario 20:00–08:00 proceden de conversaciones con personal, **no de los documentos contractuales**. El segundo turno especial se deduce del ciclo de 24 horas y requiere confirmación de su horario exacto. No asociar nombres ni evaluar responsabilidades individuales.

## Preguntas abiertas

- ¿Cuál es el inventario vigente y la asignación de unidades por subadministración?
- ¿Quién autoriza suplencias y qué canales se usan fuera de horario?
- ¿Cuál es la ruta de escalamiento de emergencias y el protocolo de relevo?
- ¿Qué módulos de ComunidadFeliz están efectivamente activos y qué datos pueden exportarse con autorización?
- ¿Qué documento rige la versión contractual consolidada, las notificaciones y renovaciones?
- ¿Cómo se identifican días feriados regionales y extraordinarios?

## Prioridad de implementación

P0: calendario de turnos anónimos, vacantes, suplencias y registro de recepción.
P1: autenticación y permisos efectivos del lado servidor, auditoría, alertas y escalamiento 24/7.
P2: reportes operativos, documentos privados, seguimiento de contratos, convivencia con ComunidadFeliz.
P3: integración autorizada si existe una vía técnica y contractual viable.

**Criterio de aceptación:** no almacenar datos personales en demo pública, no fingir confirmaciones ni asistencia, no inferir pago periódico de factura, no emitir alertas de incumplimiento por inferencias.
