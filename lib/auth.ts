/**
 * Configuración de Auth.js (NextAuth v5).
 *
 * - Adaptador Drizzle sobre Neon (sesiones en base de datos).
 * - Proveedor Google (OAuth) que se activa solo si hay credenciales.
 * - La cadena de conexión usa un placeholder cuando falta `DATABASE_URL`, para
 *   que el build no falle sin secretos; las operaciones reales requieren el valor
 *   correcto en tiempo de ejecución.
 */
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://user:password@placeholder.neon.tech/neondb?sslmode=require";
const db = drizzle(neon(connectionString));

const providers: NextAuthConfig["providers"] = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}
if (process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
  );
}

/** Métodos de ingreso habilitados según las credenciales presentes. */
export function enabledAuthMethods() {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    email: Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM),
  };
}

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: { strategy: "database" },
  // Permite operar detrás de proxies/hosts diversos (Vercel, previews).
  trustHost: true,
  callbacks: {
    // Con sesiones en base de datos, exponemos el id del usuario en la sesión
    // (lo usan la autorización server-side y las rutas de API).
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  pages: {
    signIn: "/ingresar",
    verifyRequest: "/ingresar/verificar",
    error: "/ingresar/error",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
