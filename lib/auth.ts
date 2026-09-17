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

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers,
  session: { strategy: "database" },
  pages: {
    signIn: "/ingresar",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
