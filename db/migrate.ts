/**
 * Aplica las migraciones versionadas de `db/migrations` a la base de datos.
 * Uso: `npm run db:migrate` (requiere DATABASE_URL).
 * Con `DATABASE_DRIVER=pg` usa node-postgres (desarrollo/CI con Postgres local).
 */
import { requireEnv } from "../lib/env";

async function main() {
  const url = requireEnv("DATABASE_URL");
  console.log("Aplicando migraciones...");
  if (process.env.DATABASE_DRIVER === "pg") {
    const { Pool } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const pool = new Pool({ connectionString: url });
    await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
    await pool.end();
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { migrate } = await import("drizzle-orm/neon-http/migrator");
    await migrate(drizzle(neon(url)), { migrationsFolder: "./db/migrations" });
  }
  console.log("Migraciones aplicadas correctamente.");
}

main().catch((err) => {
  console.error("Error al aplicar migraciones:", err);
  process.exit(1);
});
