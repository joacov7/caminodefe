# G. Plan de implementación

## G.1. Roadmap por fases (resumen)

| Fase | Nombre | Foco | Salida |
|------|--------|------|--------|
| 0 | Descubrimiento | Estos entregables A–H, decisiones de H | Alcance aprobado |
| 1 | Prototipo | Diseño UX/UI, navegación, pantallas clave (inicio, asistente, registro, biblia, perfil de iglesia) | Prototipo validable |
| 2 | MVP | Auth, asistente IA + RAG + límites, contenidos, biblia, Mi Camino, perfil de iglesia (lectura + contacto), panel pastoral mínimo, analítica y seguridad base | MVP desplegado |
| 3 | Validación | Pruebas con usuarios, evaluación de IA, entrevistas con pastores, medición de costos, disposición a pagar | Aprender / iterar |
| 4 | Iglesias | Panel pastoral completo, roles/permisos, eventos, "preguntar a un pastor", inicio de comunidad + moderación | Producto para iglesias |
| 5 | Finanzas | Pagos, suscripciones reales, colaboraciones, comprobantes, revisión legal/contable | Monetización |
| 6 | Escala | Mejoras de IA, app móvil, multi-iglesia avanzado, internacionalización, optimización de costos | Crecimiento |

> No se desarrollan todas las fases simultáneamente. Este documento detalla
> **Fase 1–2**; el resto se planifica al llegar.

## G.2. Backlog priorizado del MVP (épicas → historias)

Prioridad: **P0** imprescindible · **P1** importante · **P2** deseable.

### Épica 0 — Fundaciones (P0)
- Configurar repo, TS estricto, lint/format, CI (typecheck+tests+lint).
- Esquema DB inicial + migraciones versionadas + RLS base + seeds.
- Capa de autorización server-side (`/server/authz`) + helper de sesión.
- Entornos dev/staging/prod, variables de entorno, gestión de secretos.
- Layout PWA, theming claro/oscuro, componentes accesibles base.

### Épica 1 — Cuentas y roles (P0)
- Registro/login/OAuth, verificación de email, recuperación.
- Modelo de roles; asignación de roles de plataforma.
- Flujo de verificación de iglesia/pastor (estados) para admin.
- Pruebas de autorización por endpoint.

### Épica 2 — Asistente IA + RAG (P0, núcleo)
- Interfaz `LLMProvider` (adapter) + manejo de errores/timeouts/reintentos.
- Ingesta del corpus autorizado + embeddings (pgvector).
- Pipeline RAG: recuperación → prompt interdenominacional → streaming.
- Verificación de citas contra el corpus; sistema de referencias.
- Guardarraíles: identidad, temas controvertidos, **flujo de crisis**, no-diagnóstico.
- Historial, eliminación, feedback, reporte, límites por plan, rate limiting.
- Registro de métricas de IA (coste/latencia/tokens) sin datos personales.
- **Batería de evaluación** automatizada.

#### Próximo paso del asistente — Caché de respuestas (reducir costo por usuario)
Objetivo: bajar el **coste de IA por usuario** (métrica que define la viabilidad
del negocio) y mejorar velocidad y consistencia, sin sacrificar calidad ni
cuidado pastoral. Se combinan varias capas:
- **Biblioteca curada** (200–500 preguntas frecuentes con respuestas revisadas
  por una persona/pastor): calidad y ortodoxia garantizadas, costo ~cero en lo
  más consultado.
- **Caché semántica** (aprovecha pgvector + `embed()` ya existentes): guardar
  `pregunta + embedding + respuesta` en una tabla `answer_cache`; ante una nueva
  consulta, buscar la más similar y reutilizar la respuesta solo si supera un
  **umbral de similitud conservador**.
- **Prompt caching** del proveedor para el prompt de sistema (fijo y largo).

Cuidados no negociables:
- **Nunca** cachear consultas personales o sensibles (crisis, oración específica,
  datos de la persona): siempre respuesta fresca con guardarraíles.
- **Invalidación**: poder purgar lo cacheado si cambia la declaración doctrinal o
  se corrige una respuesta.
- **Umbral conservador**: ante la duda, consultar al modelo (en temas de fe, un
  falso positivo de "misma pregunta" es un riesgo doctrinal).
- No cachear lo contextual/personalizado (referencias a la lectura en curso).

### Épica 3 — Biblia (P0)
- Carga de traducción(es) licenciada(s); lector libro/capítulo/versículo.
- Versículo del día; enlace desde citas del asistente; favorito/nota.

### Épica 4 — Mi Camino (P0/P1)
- Notas privadas, diario, favoritos, temas guardados (privados por defecto).
- Progreso de lectura; recordatorios; configuración de privacidad.

### Épica 5 — Contenidos (P1)
- Devocional diario + planes 7/30 días; etiqueta de origen; flujo editorial.

### Épica 6 — Iglesias (P0/P1)
- Perfil público de iglesia; directorio/búsqueda.
- "Contactar a un pastor" (motivo, transparencia, estado, retirar).
- Panel pastoral mínimo: editar perfil, publicar contenido, eventos, bandeja de
  contacto, datos agregados.

### Épica 7 — Suscripción preliminar (P1)
- Planes/límites configurables; estado de suscripción (sin cobro real en MVP);
  aplicación de límites de IA por plan.

### Épica 8 — Plataforma: seguridad, analítica, PWA (P0/P1)
- Rate limiting, auditoría de accesos, política de eliminación de datos.
- Analítica esencial respetuosa; panel de métricas agregadas para admin.
- PWA instalable, estados de carga/vacío/error, conexión inestable.

## G.3. Criterios de aceptación (ejemplos representativos)

- **Asistente – citas:** dada una respuesta con referencia bíblica, el 100% de
  las referencias mostradas existen y coinciden con el texto del corpus; si no se
  verifica, la respuesta no afirma "respaldo bíblico".
- **Asistente – identidad:** ante "¿sos Dios/Jesús/un pastor?", el asistente lo
  niega claramente y se presenta como herramienta de orientación.
- **Asistente – crisis:** ante señales de autolesión/abuso/violencia, responde con
  empatía, prioriza seguridad, ofrece recursos y deriva a ayuda humana; no
  diagnostica. (Caso cubierto por pruebas.)
- **Asistente – controversia:** ante un tema doctrinal divisorio, reconoce
  distintas interpretaciones y sugiere hablar con un pastor.
- **Privacidad:** un pastor/administrador **no** puede acceder a conversaciones,
  notas ni diario de un usuario (verificado por prueba de autorización + RLS).
- **Multi-tenant:** un usuario de la iglesia A no puede leer datos privados de la
  iglesia B (prueba de autorización + RLS).
- **Límites:** un usuario gratuito que supera su límite de IA recibe un mensaje
  claro y no puede continuar hasta el reinicio; nunca se bloquea el acceso a
  recursos de emergencia o información pastoral gratuita.
- **Verificación:** un usuario que se registra "como pastor" queda en estado
  `pendiente` y sin permisos pastorales hasta ser `verificado`.
- **PWA:** la app es instalable y utilizable con conexión inestable, con estados
  de carga/vacío/error comprensibles.

## G.4. Plan de pruebas

| Tipo | Alcance |
|------|---------|
| Unitarias | Lógica de dominio, validaciones (Zod), utilidades. |
| Integración | Endpoints (API), flujos DB, ingesta RAG. |
| **Autorización** | Matriz de permisos por rol y por tenant; RLS. **Obligatorias.** |
| **Evaluación de IA** | Batería de preguntas bíblicas/doctrinales/sensibles: citas inexistentes/incorrectas, contradicciones, doctrina excesiva, respuestas dañinas, guardarraíles de identidad y crisis. |
| E2E | Flujos críticos: registro→chat→leer→nota→contactar iglesia. |
| Accesibilidad | Auditoría AA (teclado, contraste, ARIA). |
| Rendimiento/costo | Latencia del asistente; coste de IA por usuario. |

> No se afirmará que una prueba pasó sin haberla ejecutado, ni que una integración
> de pago/auth/IA funciona sin verificarla.

## G.5. Propuesta de despliegue

- **Vercel** (Next.js front+API) con **previews por PR**; **Neon** gestionado (DB,
  con branching por PR), **Auth.js** para auth y **Vercel Blob** para storage.
  Entornos separados dev/staging/prod con variables de entorno.
- **CI/CD**: en cada PR → typecheck + lint + unit + pruebas de autorización;
  en `main` → deploy a staging; promoción manual a prod.
- **Migraciones** versionadas aplicadas de forma controlada; nunca datos de
  producción en pruebas sin anonimizar.
- **Observabilidad**: logs estructurados, Sentry, métricas de IA; alertas de
  errores y de coste.
- **Documentación de configuración**: `.env.example`, guía de setup, runbook
  básico.

## G.6. Requisitos de calidad de código
TypeScript estricto · módulos y separación de responsabilidades · validación de
datos · pruebas unit/integración/autorización · migraciones versionadas ·
documentación técnica · manejo de errores · convenciones consistentes ·
componentes reutilizables · sin dependencias innecesarias · **sin secretos en el
repo**.
