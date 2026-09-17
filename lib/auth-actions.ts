"use server";

/**
 * Server actions de autenticación. Envuelven `signIn`/`signOut` de Auth.js para
 * usarlas desde formularios. `signIn` provoca una redirección (a Google, o a la
 * página de "revisá tu correo") que se propaga desde la action.
 */
import { signIn, signOut } from "@/lib/auth";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/inicio" });
}

export async function emailSignIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;
  await signIn("resend", { email, redirectTo: "/inicio" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
