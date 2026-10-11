# ORBI Turnos — prototipo gráfico

Ruta de la rama tras despliegue: `/turnos-demo`.

## Incluido
- Tarjetas de dotación provisional para conserjería, aseo y mayordomía.
- Selector de día y área.
- Tarjetas de mañana, tarde y noche.
- Asignación interactiva exclusivamente con etiquetas ficticias y estado «Sin confirmar».
- Diseño adaptable a pantallas móviles.

## Límites expresos
- Los tres bloques de 8 horas son ilustrativos; no se conoce la hora real de inicio ni el patrón de descansos.
- Las tarjetas muestran 5 conserjes, 5 auxiliares de aseo y 1 mayordomía según entrevista informal, no nómina verificada.
- La asistencia administrativa es función reportada como superpuesta, no una persona adicional.
- No se registra información en servidor ni se conserva tras recargar.
- No introducir nombres, RUT, salarios, documentos, teléfonos o turnos reales en una ruta pública.

## Antes de activar turnos reales
1. Validar contratos, horas, descansos, suplencias, feriados y áreas con María y administración.
2. Definir autenticación y acceso privado a horarios individuales.
3. Añadir persistencia y bitácora inmutable de modificaciones.
4. Validar permisos por rol, alcance de comunidad y minimización de datos.
5. Ejecutar `npm run check`, verificar accesibilidad y probar en móvil.
6. Revisar conflictos de asignación, turnos que cruzan medianoche y reemplazos.

No fusionar el PR sin gate verde y revisión de seguridad.
