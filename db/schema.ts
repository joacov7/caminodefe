/**
 * Esquema de base de datos (Drizzle ORM) — Camino de Fe.
 *
 * Convenciones:
 * - Multi-tenant: las entidades "de iglesia" llevan `churchId`.
 * - Datos personales (conversaciones, notas, diario) se aíslan por `userId` y
 *   NUNCA son visibles para la iglesia por defecto (ver políticas RLS en
 *   db/migrations).
 * - Este archivo define la forma de las tablas; las políticas RLS se aplican en
 *   migraciones SQL versionadas.
 */
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  primaryKey,
  uniqueIndex,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const roleEnum = pgEnum("role", [
  "visitor",
  "registered",
  "premium",
  "pastor",
  "church_leader",
  "church_admin",
  "platform_admin",
  "content_moderator",
  "finance_officer",
]);

export const roleScopeEnum = pgEnum("role_scope", ["platform", "church"]);

export const churchStatusEnum = pgEnum("church_status", [
  "pending",
  "verified",
  "rejected",
  "suspended",
]);

export const editorialStatusEnum = pgEnum("editorial_status", [
  "draft",
  "review",
  "approved",
  "published",
]);

export const contentOriginEnum = pgEnum("content_origin", [
  "ai",
  "human",
  "church",
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const contactStatusEnum = pgEnum("contact_status", [
  "sent",
  "received",
  "in_progress",
  "resolved",
  "withdrawn",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
]);

// Destino del aporte (fondos SEPARADOS; nunca se mezclan automáticamente).
export const contributionTypeEnum = pgEnum("contribution_type", [
  "platform", // sostener la plataforma
  "church", // diezmo/ofrenda a una iglesia
  "mission", // colaboración para una misión/proyecto
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending", // registrado; cobro no procesado (etapa actual)
  "confirmed",
  "failed",
  "refunded",
  "canceled",
]);

// ---------------------------------------------------------------------------
// Auth.js (NextAuth v5) — users / accounts / sessions / verification tokens
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  locale: text("locale").default("es").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// Iglesias (tenants)
// ---------------------------------------------------------------------------
export const churches = pgTable(
  "churches",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    doctrinalStatement: text("doctrinal_statement"),
    generalLocation: text("general_location"),
    contact: jsonb("contact").$type<Record<string, string>>(),
    socialLinks: jsonb("social_links").$type<Record<string, string>>(),
    website: text("website"),
    status: churchStatusEnum("status").default("pending").notNull(),
    // Nivel de herramientas para iglesias (docs/13 §5.2). Sin cobro aún.
    plan: text("plan").default("free").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("churches_slug_idx").on(t.slug)],
);

export const churchMembers = pgTable(
  "church_members",
  {
    churchId: text("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").default("invited").notNull(), // invited | active | left
    // Preferencias de qué comparte el usuario con la iglesia (privacidad).
    sharePreferences: jsonb("share_preferences").$type<Record<string, boolean>>(),
    linkedAt: timestamp("linked_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.churchId, t.userId] })],
);

// Horarios de culto publicados por la iglesia.
export const serviceTimes = pgTable(
  "service_times",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    churchId: text("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    day: text("day").notNull(), // p. ej. "domingo"
    time: text("time").notNull(), // p. ej. "10:00"
    label: text("label"),
  },
  (t) => [index("service_times_church_idx").on(t.churchId)],
);

// Eventos/agenda de la iglesia.
export const churchEvents = pgTable(
  "church_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    churchId: text("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    // Enlace a transmisión o reunión virtual (opcional).
    onlineUrl: text("online_url"),
    visibility: text("visibility").default("public").notNull(), // public | members
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("church_events_church_idx").on(t.churchId),
    index("church_events_starts_idx").on(t.startsAt),
  ],
);

// Roles del usuario, con alcance de plataforma o de una iglesia específica.
export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    scope: roleScopeEnum("scope").notNull(),
    churchId: text("church_id").references(() => churches.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("user_roles_user_idx").on(t.userId),
    uniqueIndex("user_roles_unique_idx").on(
      t.userId,
      t.role,
      t.scope,
      // churchId puede ser null (alcance plataforma); el índice lo tolera.
      sql`coalesce(${t.churchId}, '')`,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Asistente IA (datos sensibles: privados por defecto)
// ---------------------------------------------------------------------------
export const conversations = pgTable(
  "conversations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [index("conversations_user_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)],
);

// Citas asociadas a una respuesta del asistente, con marca de verificación.
export const messageCitations = pgTable("message_citations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id")
    .notNull()
    .references(() => messages.id, { onDelete: "cascade" }),
  sourceRef: text("source_ref").notNull(), // p. ej. "Juan 3:16"
  verified: boolean("verified").default(false).notNull(),
});

// Métricas técnicas de IA — SIN contenido personal.
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    day: text("day").notNull(), // YYYY-MM-DD
    model: text("model").notNull(),
    tokensIn: integer("tokens_in").default(0).notNull(),
    tokensOut: integer("tokens_out").default(0).notNull(),
    costEstimate: integer("cost_estimate_micros").default(0).notNull(), // en micro-USD
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("ai_usage_user_day_idx").on(t.userId, t.day)],
);

// ---------------------------------------------------------------------------
// Biblia y RAG
// ---------------------------------------------------------------------------
export const bibleVersions = pgTable("bible_versions", {
  id: text("id").primaryKey(), // p. ej. "rvr1909"
  name: text("name").notNull(),
  language: text("language").default("es").notNull(),
  license: text("license").notNull(),
  isPublicDomain: boolean("is_public_domain").default(false).notNull(),
});

export const bibleVerses = pgTable(
  "bible_verses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    versionId: text("version_id")
      .notNull()
      .references(() => bibleVersions.id, { onDelete: "cascade" }),
    book: text("book").notNull(),
    chapter: integer("chapter").notNull(),
    verse: integer("verse").notNull(),
    text: text("text").notNull(),
  },
  (t) => [
    uniqueIndex("bible_verses_ref_idx").on(
      t.versionId,
      t.book,
      t.chapter,
      t.verse,
    ),
  ],
);

// ---------------------------------------------------------------------------
// Contenidos (devocionales / estudios)
// ---------------------------------------------------------------------------
export const contentItems = pgTable(
  "content_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    churchId: text("church_id").references(() => churches.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(), // devotional | study | plan | group
    title: text("title").notNull(),
    objective: text("objective"),
    passage: text("passage"),
    body: text("body"),
    author: text("author"),
    origin: contentOriginEnum("origin").default("human").notNull(),
    editorialStatus: editorialStatusEnum("editorial_status")
      .default("draft")
      .notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("content_items_church_idx").on(t.churchId)],
);

// ---------------------------------------------------------------------------
// Solicitudes pastorales
// ---------------------------------------------------------------------------
export const contactRequests = pgTable(
  "contact_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    churchId: text("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(), // motivo general
    message: text("message"),
    status: contactStatusEnum("status").default("sent").notNull(),
    assignedTo: text("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("contact_requests_church_idx").on(t.churchId),
    index("contact_requests_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Mi Camino — espacio personal PRIVADO (dueño único; ver RLS).
// Nadie (ni pastor ni admin) accede a estos datos por defecto.
// ---------------------------------------------------------------------------
export const userNotes = pgTable(
  "user_notes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    body: text("body").notNull(),
    linkedRef: text("linked_ref"), // p. ej. "Juan 3:16" o "juan/3"
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("user_notes_user_idx").on(t.userId)],
);

export const userJournal = pgTable(
  "user_journal",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entry: text("entry").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("user_journal_user_idx").on(t.userId)],
);

export const userFavorites = pgTable(
  "user_favorites",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refType: text("ref_type").notNull(), // p. ej. "bible_chapter"
    refId: text("ref_id").notNull(), // p. ej. "juan/3"
    label: text("label"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_favorites_unique_idx").on(t.userId, t.refType, t.refId),
  ],
);

// ---------------------------------------------------------------------------
// Planes y suscripciones (sin cobro real en el MVP)
// ---------------------------------------------------------------------------
export const plans = pgTable("plans", {
  id: text("id").primaryKey(), // "free" | "premium"
  name: text("name").notNull(),
  price: integer("price").default(0).notNull(),
  currency: text("currency").default("ARS").notNull(),
  period: text("period").default("monthly").notNull(),
  limits: jsonb("limits").$type<Record<string, number>>(),
  benefits: jsonb("benefits").$type<string[]>(),
  active: boolean("active").default(true).notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    renewsAt: timestamp("renews_at"),
    canceledAt: timestamp("canceled_at"),
  },
  (t) => [uniqueIndex("subscriptions_user_idx").on(t.userId)],
);

// Aportes voluntarios (donaciones/ofrendas/colaboraciones). En la etapa actual
// se REGISTRAN pero el cobro no se procesa (sin proveedor de pagos activo).
// Los fondos se separan por `type` y `recipientChurchId`; nunca se mezclan.
export const contributions = pgTable(
  "contributions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: contributionTypeEnum("type").notNull(),
    recipientChurchId: text("recipient_church_id").references(() => churches.id, {
      onDelete: "set null",
    }),
    // Monto en la unidad mínima de la moneda (p. ej. centavos). 0 = a definir.
    amountMinor: integer("amount_minor").default(0).notNull(),
    currency: text("currency").default("ARS").notNull(),
    note: text("note"),
    status: contributionStatusEnum("status").default("pending").notNull(),
    provider: text("provider").default("manual").notNull(), // manual | mercadopago | ...
    providerRef: text("provider_ref"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("contributions_user_idx").on(t.userId),
    index("contributions_recipient_idx").on(t.recipientChurchId),
  ],
);

// ---------------------------------------------------------------------------
// Auditoría de accesos administrativos sensibles
// ---------------------------------------------------------------------------
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    churchId: text("church_id").references(() => churches.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("audit_log_actor_idx").on(t.actorUserId)],
);


// ---------------------------------------------------------------------------
// Planes de lectura, recordatorios y camino guiado — PRIVADOS por dueño (RLS
// forzada). El CONTENIDO de planes y etapas vive versionado en `content/`.
// ---------------------------------------------------------------------------
export const readingPlanDays = pgTable(
  "reading_plan_days",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: text("plan_id").notNull(),
    day: integer("day").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.planId, t.day] })],
);

export const reminderPrefs = pgTable("reminder_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(false).notNull(),
  time: text("time").default("08:00").notNull(), // HH:MM local
  days: jsonb("days").$type<number[]>().default([0, 1, 2, 3, 4, 5, 6]).notNull(),
  timezone: text("timezone").default("America/Argentina/Buenos_Aires").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const guidedPathProgress = pgTable(
  "guided_path_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stageId: text("stage_id").notNull(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    // Reflexión personal de la etapa (privada; nadie más la ve).
    reflection: text("reflection"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.stageId] })],
);

// ---------------------------------------------------------------------------
// Asistente — biblioteca curada (revisión humana) y caché por similitud.
// Sin datos personales: solo preguntas generales elegibles (server/ai/cache).
// ---------------------------------------------------------------------------
export const answerLibrary = pgTable(
  "answer_library",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    question: text("question").notNull(),
    normalizedQuestion: text("normalized_question").notNull(),
    answer: text("answer").notNull(),
    status: editorialStatusEnum("status").default("draft").notNull(),
    embedding: jsonb("embedding").$type<number[]>(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    retiredAt: timestamp("retired_at"),
    hits: integer("hits").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("answer_library_status_idx").on(t.status)],
);

export const answerCache = pgTable(
  "answer_cache",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    normalizedQuestion: text("normalized_question").notNull(),
    embedding: jsonb("embedding").$type<number[]>().notNull(),
    answer: text("answer").notNull(),
    model: text("model").notNull(),
    hits: integer("hits").default(0).notNull(),
    invalidatedAt: timestamp("invalidated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("answer_cache_question_idx").on(t.normalizedQuestion)],
);

// ---------------------------------------------------------------------------
// Plataforma: rate limiting (ventana fija) y analítica AGREGADA (sin userId,
// sin IP, sin cookies: no identifica personas).
// ---------------------------------------------------------------------------
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start").notNull(),
  count: integer("count").default(0).notNull(),
});

export const analyticsDaily = pgTable(
  "analytics_daily",
  {
    day: text("day").notNull(), // YYYY-MM-DD
    event: text("event").notNull(),
    dim: text("dim").default("").notNull(), // dimensión no personal (p. ej. plan)
    count: integer("count").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.event, t.dim] })],
);
