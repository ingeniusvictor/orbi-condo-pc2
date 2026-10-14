# ORBI LIVING — Mapa de documentos de validación

## Documento que se entrega a Administración

**Usar:** `docs/ADMINISTRATOR-OPERATIONS-QUESTIONNAIRE.md`

Es el único documento preparado para conversación directa con Administración en esta etapa. Usa lenguaje operacional simple y pregunta únicamente por turnos, ausencias, reemplazos, entrega de turno, bitácora, rondas y emergencias.

## Documentos internos ORBI

Los siguientes documentos son **material técnico interno** y no deben utilizarse como cuestionario directo para Administración:

- `docs/ADMINISTRATOR-VALIDATION-PACK.md`
- `docs/ADMINISTRATOR-VALIDATION-RESPONSE-TEMPLATE.md`
- `docs/ADMINISTRATOR-DATA-HANDLING-PROCEDURES-DRAFT.md`
- `docs/ADMINISTRATOR-PRIVATE-DATA-INVENTORY.md`
- `docs/PRODUCTION-READINESS-GATE.md`

Estos documentos sirven para que ORBI traduzca respuestas simples de Administración a decisiones técnicas, privacidad, seguridad, pruebas y gates. No se espera que Administración entienda ni decida conceptos de arquitectura, Supabase, RLS, Vercel, modelos de tablas, políticas de autenticación o controles de CI.

## Regla de trabajo

1. Administración responde el cuestionario simple.
2. ORBI interpreta las respuestas y detecta qué decisiones técnicas se desprenden de ellas.
3. Cuando haga falta una aprobación sensible o legal, ORBI prepara una propuesta en lenguaje sencillo para aprobación; no se pide a Administración que diseñe la solución técnica.
4. Ninguna respuesta del cuestionario habilita por sí sola datos reales ni Production.

**ADMINISTRATOR-FACING: SIMPLE OPERATIONS QUESTIONNAIRE · TECHNICAL GOVERNANCE: INTERNAL ORBI**
