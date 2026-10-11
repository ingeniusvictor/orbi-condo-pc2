# ORBI LIVING — QA pendiente: calendario de cobertura (prototipo)

## Alcance implementado
- Calendario por fecha 2026, sin nombres personales.
- Tres turnos habituales en días no especiales.
- Dos turnos de 12 h los domingos y feriados nacionales 2026.
- Vacante, suplente y estado de cobertura por turno.
- Persistencia únicamente en localStorage de ese navegador; sin backend.
- Navegación entre calendario y planificador semanal.
- No se calculan remuneraciones ni horas extra.

## Pruebas manuales y técnicas requeridas ANTES de fusionar
1. Ejecutar npm ci, npm run typecheck, npm run build.
2. Comprobar 2026-10-11 (domingo): 2 turnos especiales.
3. Comprobar 2026-10-12 (feriado): 2 turnos especiales.
4. Comprobar 2026-10-13 (martes): 3 turnos habituales.
5. Marcar un turno vacante y verificar que no tenga responsable asignado.
6. Asignar Suplente 1 y confirmar que la vacante pase a programado.
7. Cambiar a solicitado, confirmado y recibido; comprobar etiquetas.
8. Recargar y comprobar persistencia en el mismo navegador.
9. Verificar que otra fecha conserva su asignación independiente.
10. Restablecer un turno y verificar retorno al habitual.
11. Verificar que no haya nombres, teléfonos ni RUT en cliente, almacenamiento o GitHub.
12. Probar móvil 390px y escritorio 1440px.
13. Verificar límites de año y fecha, DST y transición nocturna en zona America/Santiago.
14. Definir reglas de conflictos de suplentes y excepciones regionales/extraordinarias antes de producción.
15. Verificar accesibilidad y permisos antes de almacenar datos reales.

## Límites
- El estado «turno recibido» es una anotación manual, no prueba de presencia.
- No hay notificaciones, llamadas, sincronización multiusuario, roles ni bitácora inmutable.
- No publicar en producción ni tratar como control de asistencia.
- Horario part-time nocturno 20:00–08:00 pendiente de confirmación formal.
- Feriados nacionales 2026 basados en fuente oficial: https://www.gob.cl/noticias/feriados-2026-revisa-cuantos-habra-y-cuales-son-irrenunciables/
