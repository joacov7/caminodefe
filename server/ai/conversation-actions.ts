"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/server/authz/session";
import { softDeleteConversation } from "./conversations";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteConversationAction(id: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId) return { ok: false, error: "No autenticado." };
  try {
    await softDeleteConversation(actor.userId, id);
    revalidatePath("/asistente/historial");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la conversación." };
  }
}
