/**
 * Aplica las migraciones versionadas de `db/migrations` a la base de datos.
 * Uso: `npm run db:migrate` (requiere DATABASE_URL).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { requireEnv } from "../lib/env";

async function main() {
  const client = neon(requireEnv("DATABASE_URL"));
  const db = drizzle(client);
  console.log("Aplicando migraciones...");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Migraciones aplicadas correctamente.");
}

main().catch((err) => {
  console.error("Error al aplicar migraciones:", err);
  process.exit(1);
});
