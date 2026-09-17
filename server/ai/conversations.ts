/**
 * Persistencia y consultas del historial del asistente (server-side).
 * Las conversaciones son PRIVADAS del usuario (RLS owner-only en la DB).
 */
import "server-only";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { conversations, messages, messageCitations } from "@/db/schema";
import { conversationTitle } from "./conversation-title";
import type { CitationCheck } from "./citations";

export async function listConversations(userId: string) {
  const db = getDb();
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      createdAt: conversations.createdAt,
    })
    .from(conversations)
    .where(and(eq(conversations.userId, userId), isNull(conversations.deletedAt)))
    .orderBy(desc(conversations.createdAt))
    .limit(100);
}

export async function getConversationWithMessages(userId: string, id: string) {
  const db = getDb();
  const conv = await db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, id),
        eq(conversations.userId, userId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1);
  if (!conv[0]) return null;

  const msgs = await db
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(asc(messages.createdAt));

  return { conversation: conv[0], messages: msgs };
}

/** Borrado lógico (soft delete): el usuario solo borra lo propio. */
export async function softDeleteConversation(userId: string, id: string) {
  const db = getDb();
  await db
    .update(conversations)
    .set({ deletedAt: new Date() })
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)));
}

/**
 * Persiste un turno (mensaje del usuario + respuesta del asistente + citas).
 * Crea la conversación si no existe. Devuelve el id de la conversación.
 * Verifica pertenencia cuando se pasa `conversationId`.
 */
export async function persistTurn(params: {
  userId: string;
  conversationId?: string | null;
  userText: string;
  assistantText: string;
  citations: CitationCheck[];
}): Promise<string> {
  const db = getDb();
  let conversationId = params.conversationId ?? null;

  if (conversationId) {
    // Verificar que la conversación sea del usuario (defensa además de RLS).
    const owned = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, params.userId),
        ),
      )
      .limit(1);
    if (!owned[0]) conversationId = null;
  }

  if (!conversationId) {
    const created = await db
      .insert(conversations)
      .values({
        userId: params.userId,
        title: conversationTitle(params.userText),
      })
      .returning({ id: conversations.id });
    conversationId = created[0]!.id;
  }

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: params.userText,
  });
  const assistantMsg = await db
    .insert(messages)
    .values({
      conversationId,
      role: "assistant",
      content: params.assistantText,
    })
    .returning({ id: messages.id });

  if (params.citations.length > 0) {
    await db.insert(messageCitations).values(
      params.citations.map((c) => ({
        messageId: assistantMsg[0]!.id,
        sourceRef: c.raw,
        verified: c.verified,
      })),
    );
  }

  return conversationId;
}
