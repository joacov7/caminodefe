# E. Modelo de datos inicial y permisos

> Modelo conceptual para el MVP (+ ganchos para fases posteriores). Los nombres
> son orientativos; las migraciones SQL versionadas se definirán al implementar.
> Toda tabla con datos de iglesia lleva `church_id` para aislamiento multi-tenant
> vía RLS.

## E.1. Entidades principales

### Identidad y roles
- **users** — `id`, `email`, `display_name`, `avatar_url`, `locale`,
  `created_at`, `deleted_at` (soft delete). (Auth gestionada por Auth.js/NextAuth
  sobre Neon; incluye tablas `accounts`/`sessions`/`verification_tokens`.)
- **user_settings** — `user_id`, preferencias de UI (tema), notificaciones,
  privacidad, recordatorios.
- **roles** — catálogo de roles del sistema (visitante…responsable financiero).
- **user_roles** — `user_id`, `role`, `scope` (`platform` | `church`),
  `church_id?`. Un usuario puede tener varios roles con distinto alcance.
- **consents** — `user_id`, `type`, `granted_at`, `revoked_at`, `version` —
  registro de consentimientos (privacidad, uso de preguntas, etc.).
- **audit_log** — `id`, `actor_user_id`, `action`, `entity`, `entity_id`,
  `church_id?`, `metadata`, `created_at` — accesos administrativos sensibles.

### Iglesias (tenants)
- **churches** — `id`, `name`, `slug`, `description`, `doctrinal_statement`,
  `general_location`, `contact`, `social_links`, `website`, `status`
  (`pending|verified|rejected|suspended`), `created_at`.
- **church_verifications** — `church_id`, `status`, `reviewed_by`, `notes`,
  `history` — trazabilidad del proceso de verificación.
- **church_members** — `church_id`, `user_id`, `role_internal`, `status`
  (`invited|active|left`), `linked_at`, `share_preferences` (qué comparte el
  usuario con la iglesia). Vinculación **con consentimiento**.
- **church_events** — `church_id`, `title`, `description`, `starts_at`,
  `location`, `visibility`, `status`.
- **service_times** — `church_id`, `day`, `time`, `label`.

### Asistente y conversaciones (datos sensibles)
- **conversations** — `id`, `user_id`, `title`, `created_at`, `deleted_at`.
  **Privadas por defecto; no visibles a la iglesia.**
- **messages** — `id`, `conversation_id`, `role` (`user|assistant`), `content`,
  `created_at`.
- **message_citations** — `message_id`, `source_ref` (p.ej. `Juan 3:16`),
  `document_id?`, `verified` (bool).
- **message_feedback** — `message_id`, `user_id`, `rating` (👍/👎), `reason`.
- **content_reports** — `message_id?`, `content_id?`, `reporter_id`, `reason`,
  `status`, `handled_by`.
- **ai_usage** — `user_id`, `date`, `tokens_in`, `tokens_out`, `cost_estimate`,
  `model`, `latency_ms` — métricas técnicas; **sin contenido personal**.
- **rate_limits / usage_counters** — control de límites por plan.

### Biblia y RAG
- **bible_versions** — `id`, `name`, `language`, `license`, `is_public_domain`.
  Versión inicial: **Reina-Valera 1909 (RVR1909), dominio público** en español.
- **bible_verses** — `version_id`, `book`, `chapter`, `verse`, `text`.
  (Solo versiones de dominio público o con licencia adecuada.)
- **documents** — corpus RAG: `id`, `church_id?` (null = global), `type`
  (`bible|doctrine|study|sermon|other`), `title`, `source`, `license`,
  `editorial_status`, `created_by`.
- **document_chunks** — `document_id`, `chunk`, `embedding` (pgvector),
  `metadata`.

### Contenidos (devocionales / estudios)
- **content_items** — `id`, `church_id?`, `type` (`devotional|study|plan|group`),
  `title`, `objective`, `passage`, `context`, `reflection`, `questions`,
  `prayer?`, `references`, `author`, `origin` (`ai|human|church`),
  `editorial_status` (`draft|review|approved|published`), `published_at`.
- **reading_plans** — `id`, `title`, `length_days`, `content_refs`.
- **user_plan_progress** — `user_id`, `plan_id`, `day`, `completed_at`.

### Mi Camino (personal, privado)
- **user_notes** — `user_id`, `title`, `body`, `linked_ref?`, `created_at`.
  **Nunca visible a pastores/admins por defecto.**
- **user_journal** — `user_id`, `entry`, `created_at` (diario espiritual).
- **user_favorites** — `user_id`, `ref_type`, `ref_id`.
- **user_saved_topics** — `user_id`, `topic`.
- **reminders** — `user_id`, `type`, `schedule`, `enabled`.

### Solicitudes pastorales
- **contact_requests** — `id`, `user_id`, `church_id`, `reason` (motivo general),
  `message?`, `status` (`sent|received|in_progress|resolved|withdrawn`),
  `assigned_to?`, `created_at`. El usuario ve quién la recibe y puede retirarla.
- **prayer_requests** — `id`, `user_id`, `church_id?`, `text`, `visibility`
  (`private|church`), `status`. (Alcance según consentimiento.)
- **pastor_questions** — (Fase 4) preguntas a pastores, con consentimiento,
  revisión, asignación y respuesta.

### Suscripciones y (Fase 5) pagos
- **plans** — `id`, `name` (`free|premium`), `price`, `currency`, `period`,
  `limits` (JSON: límites de IA, funciones), `benefits`, `active`.
- **subscriptions** — `user_id`, `plan_id`, `status`
  (`active|canceled|past_due|trialing`), `started_at`, `renews_at`,
  `canceled_at`.
- **contributions** *(Fase 5)* — `id`, `user_id`, `type`
  (`tithe|mission|platform|—`), `recipient_church_id?`, `amount`, `currency`,
  `status`, `provider_ref`, `receipt_url?`. **Fondos separados por destinatario;
  nunca mezclar.**
- **payment_events / refunds** *(Fase 5)* — trazabilidad de transacciones.

## E.2. Multi-tenant y aislamiento

- Toda entidad "de iglesia" lleva `church_id`. **RLS** en Postgres filtra por
  pertenencia (`church_members`) y rol (`user_roles`).
- Datos personales (conversaciones, notas, diario, oración privada): RLS por
  `user_id`; **no accesibles a la iglesia** salvo consentimiento explícito y para
  el tipo de dato que corresponda.
- La autorización se aplica **también** en el backend (defensa en profundidad),
  con pruebas de autorización por endpoint.

## E.3. Diagrama de permisos (matriz resumida)

Leyenda: ✔ permitido · ➖ propio/limitado · ✖ no · (v) requiere verificación.

| Acción | Visit. | Registrado | Premium | Pastor(v) | Líder(v) | Admin Iglesia(v) | Moderador | Admin Plataforma | Resp. Financiero |
|---|---|---|---|---|---|---|---|---|---|
| Leer Biblia / contenido público | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Usar asistente IA | ✖ | ✔ (límite) | ✔ (límite+) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Crear notas/diario privados | ✖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ | ➖ |
| Ver notas/diario de otros | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Contactar a un pastor | ✖ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Editar perfil de SU iglesia | ✖ | ✖ | ✖ | ✔ | ➖ | ✔ | ✖ | ✔ | ✖ |
| Publicar contenido de iglesia | ✖ | ✖ | ✖ | ✔ | ➖ | ✔ | ✖ | ✔ | ✖ |
| Gestionar solicitudes de contacto | ✖ | ✖ | ✖ | ✔ | ➖ | ✔ | ✖ | ✔ | ✖ |
| Ver datos agregados de SU iglesia | ✖ | ✖ | ✖ | ✔ | ➖ | ✔ | ✖ | ✔ | ➖ |
| Ver conversaciones privadas de miembros | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ |
| Moderar contenido reportado | ✖ | ✖ | ✖ | ➖ | ✖ | ➖ | ✔ | ✔ | ✖ |
| Verificar iglesias/pastores | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ |
| Ver/gestionar reportes financieros | ✖ | ✖ | ✖ | ✖ | ✖ | ➖ | ✖ | ✔ | ✔ |
| Configurar planes/precios | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✖ | ✔ | ✖ |

> Regla transversal: **nadie** accede a conversaciones privadas, notas o diario de
> un usuario. No existe "vigilancia" ni "perfil espiritual". Los datos financieros
> requieren un permiso separado (responsable financiero) y quedan auditados.
