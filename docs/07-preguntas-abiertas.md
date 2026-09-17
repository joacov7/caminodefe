# H. Preguntas que necesito resolver antes de programar

Ordenadas por impacto. Las marcadas 🔴 son **bloqueantes** para empezar la
implementación del núcleo; las 🟠 pueden decidirse durante la Fase 1–2.

## Bloqueantes 🔴

1. **Traducción(es) bíblica(s).** ¿Con cuál(es) empezamos? Para lanzar sin
   riesgo legal propongo una de **dominio público / licencia abierta** en español
   (p. ej. Reina-Valera 1909, u otra con permiso explícito). ¿Tenés/consigues
   licencia para una versión moderna (RVR1960, NVI, NTV…)? Sin esto, el corpus
   RAG y el lector bíblico no pueden usar esos textos.

2. **Proveedor de modelo de IA.** ¿Preferencia o restricción de proveedor
   (Anthropic/OpenAI/Google/otro), presupuesto por usuario y región de datos? La
   arquitectura lo desacopla vía adapter, pero necesito uno para configurar y
   medir costos reales. ¿Hay cuenta/credenciales disponibles?

3. **Alcance exacto del MVP (iglesias).** Propongo incluir **perfil de iglesia de
   solo lectura + "contactar a un pastor" + panel pastoral mínimo**. ¿Lo
   confirmás, o el primer MVP debe centrarse solo en persona+asistente y dejar
   iglesias para Fase 4?

4. **Cuenta y credenciales de infraestructura.** ¿Usamos Supabase + Vercel como
   propongo? ¿Existen ya proyectos/organizaciones, o los creamos? Necesito saber
   quién administra las credenciales (nunca irán al repo).

5. **Datos personales y jurisdicción.** Mercado inicial Argentina (Ley 25.326) +
   otros países. ¿Hay asesoría legal para la política de privacidad, retención y
   consentimientos? Define qué podemos almacenar y por cuánto tiempo.

## Importantes 🟠

6. **Recursos de emergencia por país.** Para el flujo de crisis necesito la lista
   de líneas de ayuda oficiales (Argentina primero). ¿Tenés una fuente confiable
   que podamos citar y mantener actualizada?

7. **Declaración de fe base (interdenominacional).** ¿Existe un texto de
   declaración doctrinal "de plataforma" que sirva como configuración por defecto,
   además de la que cada iglesia cargue?

8. **Suscripción Premium en el MVP.** Propongo **simular** el estado Premium sin
   cobro real para validar antes de integrar pagos (Fase 5). ¿De acuerdo, o
   necesitás cobro real desde el MVP? Precio de referencia ARS 2.000/mes: ¿lo
   dejamos configurable y sin fijar aún?

9. **Materiales autorizados para RAG.** ¿Qué estudios/contenidos iniciales
   podemos ingerir (con licencia)? ¿Quién los aprueba editorialmente?

10. **Verificación de iglesias/pastores.** ¿Qué evidencia se pedirá y quién
    ejecuta la verificación al inicio (vos / equipo)? Define el flujo operativo.

11. **Marca e identidad visual.** ¿Hay logo, nombre definitivo, colores o guía de
    marca? Si no, propongo una identidad propia en la Fase 1.

12. **Idiomas.** ¿Solo español en el MVP, o preparamos i18n desde el inicio
    (recomendado a nivel estructura, contenido solo español al principio)?

13. **Analítica.** ¿Herramienta preferida respetuosa con la privacidad
    (self-hosted/Plausible/PostHog)? Afecta consentimientos.

14. **Autenticación.** ¿Qué métodos habilitamos en el MVP (email+contraseña,
    Google, Apple)? ¿Requisitos de edad mínima / menores?

---

### Cómo propongo avanzar

En cuanto confirmes al menos las **preguntas 1–4**, puedo:
1. Cerrar el alcance definitivo del MVP y el backlog de la Fase 1.
2. Preparar el andamiaje del proyecto (Next.js + TS + Tailwind + Supabase) **sin
   secretos**, con CI, migraciones base y RLS.
3. Comenzar por el prototipo de UX y el esqueleto del asistente con un adapter de
   IA configurable.

**No iniciaré la implementación principal hasta tu aprobación** (según sección 28
de la especificación).
