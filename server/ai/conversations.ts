/**
 * Persistencia y consultas del historial del asistente (server-side).
 * Las conversaciones son PRIVADAS del usuario: toda consulta pasa por
 * `withUserContext` (RLS forzada en la DB, migración 0008) además del filtro
 * explícito por `userId`.
 */
import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { withUserContext } from "@/db";
import { conversations, messages, messageCitations } from "@/db/schema";
import { conversationTitle } from "./conversation-title";
import type { CitationCheck } from "./citations";

export async function listConversations(userId: string) {
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({
        id: conversations.id,
        title: conversations.title,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(and(eq(conversations.userId, userId), isNull(conversations.deletedAt)))
      .orderBy(desc(conversations.createdAt))
      .limit(100),
  ]);
  return rows;
}

export async function getConversationWithMessages(userId: string, id: string) {
  const [conv, msgs] = await withUserContext(userId, (db) => [
    db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, userId),
          isNull(conversations.deletedAt),
        ),
      )
      .limit(1),
    db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt)),
  ]);
  if (!conv[0]) return null;
  return { conversation: conv[0], messages: msgs };
}

/** Borrado lógico (soft delete): el usuario solo borra lo propio. */
export async function softDeleteConversation(userId: string, id: string) {
  await withUserContext(userId, (db) => [
    db
      .update(conversations)
      .set({ deletedAt: new Date() })
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId))),
  ]);
}

/** Devuelve los últimos `limit` mensajes de una conversación propia (memoria). */
export async function recentMessages(userId: string, id: string, limit = 10) {
  const [rows] = await withUserContext(userId, (db) => [
    db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(and(eq(messages.conversationId, id), eq(conversations.userId, userId)))
      .orderBy(desc(messages.createdAt))
      .limit(limit),
  ]);
  return rows.reverse();
}

/**
 * Persiste un turno (mensaje del usuario + respuesta del asistente + citas)
 * en UNA transacción. Crea la conversación si no existe o no es del usuario.
 * Devuelve el id de la conversación.
 */
export async function persistTurn(params: {
  userId: string;
  conversationId?: string | null;
  userText: string;
  assistantText: string;
  citations: CitationCheck[];
}): Promise<string> {
  const { userId } = params;
  let conversationId = params.conversationId ?? null;

  if (conversationId) {
    // Verificar pertenencia (defensa además de RLS).
    const id = conversationId;
    const [owned] = await withUserContext(userId, (db) => [
      db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .limit(1),
    ]);
    if (!owned[0]) conversationId = null;
  }

  const isNew = !conversationId;
  const convId = conversationId ?? crypto.randomUUID();
  const userMsgId = crypto.randomUUID();
  const assistantMsgId = crypto.randomUUID();
  // El mensaje del asistente se guarda 1 ms después para un orden estable.
  const now = new Date();
  const later = new Date(now.getTime() + 1);

  await withUserContext(userId, (db) => {
    const userMsg = db.insert(messages).values({
      id: userMsgId,
      conversationId: convId,
      role: "user",
      content: params.userText,
      createdAt: now,
    });
    const assistantMsg = db.insert(messages).values({
      id: assistantMsgId,
      conversationId: convId,
      role: "assistant",
      content: params.assistantText,
      createdAt: later,
    });
    const cites = params.citations.length
      ? [
          db.insert(messageCitations).values(
            params.citations.map((c) => ({
              messageId: assistantMsgId,
              sourceRef: c.raw,
              verified: c.verified,
            })),
          ),
        ]
      : [];
    const conv = isNew
      ? [
          db.insert(conversations).values({
            id: convId,
            userId,
            title: conversationTitle(params.userText),
          }),
        ]
      : [];
    return [...conv, userMsg, assistantMsg, ...cites] as unknown as readonly [
      typeof userMsg,
      ...(typeof userMsg)[],
    ];
  });

  return convId;
}
