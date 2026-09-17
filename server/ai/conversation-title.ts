/**
 * Genera un título corto para una conversación a partir del primer mensaje.
 * Puro y testeable.
 */
export function conversationTitle(firstMessage: string): string {
  const t = firstMessage.trim().replace(/\s+/g, " ");
  if (t.length === 0) return "Conversación";
  return t.length <= 60 ? t : `${t.slice(0, 57).trimEnd()}…`;
}
