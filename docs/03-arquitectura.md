# D. Arquitectura recomendada

## D.1. Vista general

```
                        ┌──────────────────────────────┐
                        │  Cliente (PWA)               │
                        │  Next.js + React + Tailwind  │
                        │  Service Worker / offline UI │
                        └───────────────┬──────────────┘
                                        │ HTTPS
             ┌──────────────────────────┼───────────────────────────┐
             │                          │                           │
     ┌───────▼────────┐        ┌────────▼─────────┐        ┌────────▼─────────┐
     │ Next.js API /   │        │ Supabase Auth    │        │ Servicio de IA   │
     │ Route Handlers  │◄──────►│ (JWT / sesiones) │        │ (backend propio) │
     │ (BFF + lógica)  │        └──────────────────┘        │  - Orquestación  │
     └───┬────────┬────┘                                    │  - RAG           │
         │        │                                         │  - Guardarraíles │
         │        │            ┌──────────────────┐         │  - Evaluación    │
         │        └───────────►│ PostgreSQL       │         └───┬─────────┬────┘
         │                     │ (Supabase)       │             │         │
         │                     │  + Row Level Sec │      ┌──────▼───┐ ┌───▼─────────┐
         │                     │  + pgvector      │◄─────┤ Retriever│ │ Proveedor    │
         │                     └──────────────────┘      │ (RAG)    │ │ LLM (adapter)│
         │                                               └──────────┘ └──────────────┘
         │              ┌──────────────────┐        ┌──────────────────┐
         └─────────────►│ Supabase Storage │        │ Pagos (adapter)  │  (Fase 5)
                        │ (multimedia)     │        │ Mercado Pago/... │
                        └──────────────────┘        └──────────────────┘
```

## D.2. Stack recomendado (y por qué)

| Capa | Elección | Justificación | Alternativas |
|------|----------|---------------|--------------|
| Frontend | **Next.js (App Router) + TypeScript estricto + Tailwind** | SSR/streaming para el chat, PWA, un solo stack front+BFF, gran ecosistema. | Remix, SvelteKit |
| UI/accesibilidad | **Radix UI / shadcn** + Tailwind | Componentes accesibles (WAI-ARIA), theming claro/oscuro. | Headless UI |
| Auth + DB + Storage | **Supabase (Postgres + Auth + Storage + RLS)** | Postgres gestionado con RLS (clave multi-tenant), auth lista, storage con políticas; acelera el MVP. | Neon + Auth.js; Firebase (menos apto para RLS SQL) |
| Vector store (RAG) | **pgvector en el mismo Postgres** | Menos infra, transaccional con el resto; suficiente para el corpus inicial. | Qdrant, Pinecone (si escala) |
| Servicio de IA | **Módulo/servicio desacoplado con interfaz `LLMProvider`** | Permite cambiar proveedor, controlar costos, aplicar guardarraíles y evaluación en un solo lugar. | — |
| Proveedor LLM | **Adapter (decisión en H)** | No acoplar la lógica a un proveedor; elegir por costo/calidad/español. | Ver H |
| Pagos | **Adapter `PaymentProvider`** (Fase 5) | Empezar por Mercado Pago (AR) sin acoplar; checkout/tokenización, nunca guardar tarjetas. | Stripe (otros países) |
| Despliegue | **Vercel** (front + API) + Supabase gestionado | Integración directa con Next.js, previews por PR, entornos. | Fly.io, Railway, contenedores |
| Observabilidad | Logs estructurados + Sentry + métricas de IA propias | Errores, coste por usuario, calidad de respuestas. | Datadog, Grafana |

> Antes de fijar cada elección definitivamente se evalúan **costos, límites,
> escalabilidad, seguridad y mantenibilidad** (ver H).

## D.3. Estructura de proyecto propuesta (monorepo simple)

```
/app            → rutas Next.js (UI + API/route handlers)
/components      → componentes UI reutilizables (accesibles)
/lib            → utilidades, clientes (supabase, analytics)
/server         → lógica de dominio, autorización, validación (Zod)
  /ai           → servicio de IA: LLMProvider(adapter), RAG, guardarraíles, eval
  /payments     → PaymentProvider(adapter) [Fase 5]
  /authz        → políticas de permisos (fuente de verdad server-side)
/db             → migraciones SQL versionadas, políticas RLS, seeds
/content        → corpus/documentos autorizados para ingesta RAG
/tests          → unit / integración / autorización / evaluación de IA
/docs           → estos entregables
```

## D.4. Estrategia de IA y RAG

### D.4.1. Componentes
1. **Proveedor LLM** detrás de una interfaz (`generate`, `stream`, `embed`) →
   intercambiable y con manejo de errores/reintentos/timeouts.
2. **Retriever RAG**: embeddings + búsqueda semántica (pgvector) sobre el corpus
   autorizado (Biblia licenciada, declaración de fe, estudios aprobados).
3. **Base de documentos autorizados** con metadatos (fuente, licencia, estado
   editorial, tenant/global).
4. **Sistema de citas**: cada afirmación con respaldo debe enlazar a una
   referencia **verificable** contra el texto; si no se verifica, no se afirma
   respaldo.
5. **Filtros de seguridad** (pre y post): guardarraíles de identidad ("no soy
   pastor/Dios..."), detección de crisis, no-diagnóstico, temas controvertidos.
6. **Evaluación de respuestas**: batería de preguntas (bíblicas, doctrinales,
   sensibles) con checks automáticos de: citas inexistentes, citas incorrectas,
   contradicciones, afirmaciones doctrinales excesivas, respuestas dañinas.
7. **Registro de métricas técnicas** (latencia, tokens, coste, tasa de error,
   feedback) **sin exponer datos personales innecesarios**.

### D.4.2. Flujo de una consulta
```
Pregunta del usuario
  → validación + rate limit + límite de plan
  → clasificación (¿crisis? ¿controvertida? ¿fuera de alcance?)
  → recuperación RAG (pasajes + materiales autorizados)
  → prompt de sistema (interdenominacional + guardarraíles + estilo)
  → LLM (streaming)
  → verificación de citas contra el corpus
  → filtros de salida + disclaimers + sugerencia pastoral si corresponde
  → respuesta + registro de métricas (anonimizado) 
```

### D.4.3. Reglas duras
- No enviar al proveedor de IA datos sensibles innecesarios (minimización).
- No presentar respuesta como "con respaldo bíblico" sin verificar la referencia.
- No usar traducciones protegidas por derechos de autor sin licencia.

## D.5. Seguridad y privacidad (plan)

- **AuthN**: Supabase Auth (JWT, sesiones), verificación de email, OAuth.
- **AuthZ**: políticas explícitas en `/server/authz` **y** RLS en Postgres
  (defensa en profundidad). Nunca confiar solo en ocultar UI.
- **Multi-tenant**: cada fila sensible lleva `tenant`/`church_id`; RLS filtra por
  pertenencia y rol. Pruebas de autorización automatizadas por endpoint.
- **Validación** de todas las entradas con Zod en el servidor.
- **Rate limiting** y detección de abuso en el asistente.
- **Secretos** solo en variables de entorno / gestor de secretos; nunca en el repo.
- **Datos sensibles** (oración, diario, notas, conversaciones): privados por
  defecto; cifrado en tránsito y en reposo; minimización.
- **Auditoría**: registro de accesos administrativos sensibles.
- **Retención/eliminación**: política declarada (qué se guarda, por qué, cuánto,
  quién accede, cómo se elimina). Eliminación de historial a pedido del usuario.
- **Backups** apropiados; **entornos** separados dev/staging/prod; **CI/CD** con
  pruebas antes de desplegar.

## D.6. Costos (estimación de marco, a validar en H)

Principales drivers de costo: **tokens de LLM** (entrada+salida+RAG),
**embeddings**, infraestructura (Supabase/Vercel), storage. Controles:
- Límites por plan y por usuario; caché de respuestas y de embeddings del corpus.
- Selección de modelo por tarea (barato para clasificación/embeddings; capaz para
  respuesta principal).
- Métrica **coste de IA por usuario activo** desde el día 1 para decidir precios.

> Los números concretos dependen del proveedor elegido y del volumen; se
> presentará una hoja de costos una vez decididas las preguntas de H.
