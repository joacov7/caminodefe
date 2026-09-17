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
    visibility: text("visibility").default("public").notNull(), // public | members
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("church_events_church_idx").on(t.churchId)],
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
