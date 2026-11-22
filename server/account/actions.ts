"use server";

import { redirect } from "next/navigation";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { signOut } from "@/lib/auth";
import { deleteUserAccount } from "./data";
import { DELETE_CONFIRMATION } from "./constants";

export type ActionResult = { ok: true } | { ok: false; error: string };


export async function deleteMyAccount(confirmation: string): Promise<ActionResult> {
  const actor = await getActor();
  if (!actor.userId || !can(actor, "account:delete_own")) {
    return { ok: false, error: "No autenticado." };
  }
  if (confirmation.trim().toUpperCase() !== DELETE_CONFIRMATION) {
    return { ok: false, error: `Escribí ${DELETE_CONFIRMATION} para confirmar.` };
  }
  try {
    await deleteUserAccount(actor.userId);
  } catch {
    return { ok: false, error: "No se pudo eliminar la cuenta. Escribinos para ayudarte." };
  }
  await signOut({ redirect: false }).catch(() => undefined);
  redirect("/?cuenta=eliminada");
}
