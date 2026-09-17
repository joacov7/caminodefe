# H. Preguntas que necesito resolver antes de programar

Ordenadas por impacto. Las marcadas 🔴 son **bloqueantes** para empezar la
implementación del núcleo; las 🟠 pueden decidirse durante la Fase 1–2.

## Decisiones ya tomadas ✅

- **Biblia (P1):** iniciamos con **Reina-Valera 1909**, que está en **dominio
  público** — no requiere licencia. Una versión moderna (RVR1960, NVI…) queda para
  más adelante y solo si se consigue licencia.
- **Infraestructura (P4):** **Neon (Postgres) + Vercel.** Como Neon no incluye
  auth ni storage, se suman **Auth.js (NextAuth v5)** y **Vercel Blob**; ORM
  **Drizzle**. (Ver arquitectura actualizada en `docs/03`.)
- **Proveedor de IA:** **OpenAI (GPT)** vía adapter `LLMProvider` (cambiable sin
  tocar la lógica). La API key irá **solo** en variables de entorno, nunca al repo.
- **Alcance del MVP:** **incluye iglesias** (perfil + "contactar a un pastor" +
  panel pastoral mínimo), además de persona + asistente.

> **No quedan preguntas bloqueantes.** Falta únicamente la **aprobación del
> Product Owner** para iniciar la implementación (sección 28) y, para poner en
> marcha el asistente, la **API key de OpenAI** cargada como secreto de entorno.

## Importantes 🟠 (no bloquean el inicio)

3. **Datos personales y jurisdicción.** Mercado inicial Argentina (Ley 25.326) +
   otros países. ¿Hay asesoría legal para la política de privacidad, retención y
   consentimientos? Define qué podemos almacenar y por cuánto tiempo.

## Importantes 🟠

4. **Recursos de emergencia por país.** Para el flujo de crisis necesito la lista
   de líneas de ayuda oficiales (Argentina primero). ¿Tenés una fuente confiable
   que podamos citar y mantener actualizada?

5. **Declaración de fe base (interdenominacional).** ¿Existe un texto de
   declaración doctrinal "de plataforma" que sirva como configuración por defecto,
   además de la que cada iglesia cargue?

6. **Suscripción Premium en el MVP.** Propongo **simular** el estado Premium sin
   cobro real para validar antes de integrar pagos (Fase 5). ¿De acuerdo, o
   necesitás cobro real desde el MVP? Precio de referencia ARS 2.000/mes: ¿lo
   dejamos configurable y sin fijar aún?

7. **Materiales autorizados para RAG.** ¿Qué estudios/contenidos iniciales
   podemos ingerir (con licencia)? ¿Quién los aprueba editorialmente?

8. **Verificación de iglesias/pastores.** ¿Qué evidencia se pedirá y quién
    ejecuta la verificación al inicio (vos / equipo)? Define el flujo operativo.

9. **Marca e identidad visual.** ¿Hay logo, nombre definitivo, colores o guía de
    marca? Si no, propongo una identidad propia en la Fase 1.

10. **Idiomas.** ¿Solo español en el MVP, o preparamos i18n desde el inicio
    (recomendado a nivel estructura, contenido solo español al principio)?

11. **Analítica.** ¿Herramienta preferida respetuosa con la privacidad
    (self-hosted/Plausible/PostHog)? Afecta consentimientos.

12. **Autenticación.** ¿Qué métodos habilitamos en el MVP (email+contraseña,
    Google, Apple)? ¿Requisitos de edad mínima / menores?

---

### Cómo propongo avanzar

Con las decisiones bloqueantes resueltas, al recibir tu **aprobación** puedo:
1. Cerrar el alcance definitivo del MVP y el backlog de la Fase 1.
2. Preparar el andamiaje del proyecto (Next.js + TS + Tailwind + Neon + Drizzle +
   Auth.js) **sin secretos**, con CI, migraciones base y RLS.
3. Comenzar por el prototipo de UX y el esqueleto del asistente con el adapter
   de OpenAI (la API key se cargará como secreto de entorno).

**No iniciaré la implementación principal hasta tu aprobación** (según sección 28
de la especificación).
