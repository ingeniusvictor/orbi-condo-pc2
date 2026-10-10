# ORBI LIVING — descubrimiento operativo PC2 (08-10-2026)

## Estado
Documento de diseño y levantamiento, **no auditoría**, padrón confirmado ni módulo de producción. Fuente: conversación verbal con conserjería. Toda afirmación queda pendiente de validación con mayordomía y documentos autorizados.

## Observaciones preliminares
- Conserjería: tres puestos fijos (mañana, tarde, noche) de ocho horas y dos trabajadores part-time de fines de semana/feriados. **No inferir cobertura semanal legal ni descansos**.
- Aseo: cuatro fijos, uno por torre, y un apoyo domingos/feriados.
- Mayordomía: una persona, María, pendiente de entrevista de atribuciones.
- Asistencia administrativa: según relato, una conserje desempeña la función. **No sumar una persona extra ni inferir remuneración duplicada**.
- Estimación provisional de personas distintas: 3 + 2 + 4 + 1 + 1 = **11**, no verificada con contratos, liquidaciones y cotizaciones.
- Se mencionaron 276 departamentos, mientras el README contiene 278 viviendas. **No precargar ninguna cifra como padrón oficial**.
- Falta información de contactos de ocupantes, propietarios y responsables de vehículos en emergencias.
- Situaciones individuales de documentos o habilitaciones profesionales se verificarán confidencialmente con la administración; no registrar nombres ni supuestos incumplimientos en GitHub.

## Modelo y flujo propuesto
Las interfaces de `data/operations-types.ts` representan unidades, contactos, estacionamientos, vehículos autorizados, incidentes, observaciones de cargos y procedencia/verificación. No contienen datos reales ni persistencia.

Antes de activar formularios, búsquedas o importación de padrones:
1. Autenticación, roles mínimos y control de acceso en servidor, con aislamiento por comunidad y unidad.
2. Base privada con políticas RLS, auditoría de consultas, modificaciones y exportaciones, retención definida y backups.
3. Definir responsable del tratamiento, finalidad, base jurídica/consentimiento cuando proceda, aviso de privacidad y mecanismos de rectificación.
4. Validación de propietario/ocupante/vehículo por personal autorizado; las solicitudes del residente nunca se aprueban automáticamente.
5. Protocolo para emergencias y escalamiento: la búsqueda de contactos no sustituye llamadas a servicios de emergencia.
6. Pruebas con datos sintéticos de permisos, duplicados, cambios de ocupante, contacto inaccesible, múltiples vehículos y falta de consentimiento.

## Reunión pendiente con María (mayordomía)
- Funciones propias vs funciones de Becza, conserjería y administración.
- Dotación contractual, turnos, descansos, reemplazos, asistencia y feriados.
- Cargo contractual y responsabilidades administrativas de la conserje que también realiza apoyo administrativo.
- Proceso de aprobación y pago de horas extra, reemplazos, proveedores y mantenciones.
- Procedimientos reales de emergencias, libro de novedades, incidentes y cadena de escalamiento.
- Responsables de padrón de unidades, estacionamientos, propietarios, ocupantes y contactos.
- Documentos de respaldo para conciliar número de personas y partidas de gasto; no solicitar datos personales para repositorio público.

## Regla de gobernanza
Separar **informado**, **pendiente**, **verificado** y **descartado**. Una coincidencia de cantidades no constituye prueba de corrección de cobros; una observación verbal no constituye prueba de incumplimiento legal.

Seguimiento: [issue #26](https://github.com/ingeniusvictor/orbi-condo-pc2/issues/26).
