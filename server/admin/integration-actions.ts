"use server";

/**
 * Pruebas de conexión desde Administración → Configuración. Solo admin de
 * plataforma, con límite de frecuencia y auditoría (sin valores secretos).
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog } from "@/db/schema";
import { getActor } from "@/server/authz/session";
import { can } from "@/server/authz/permissions";
import { consumeRateLimit } from "@/server/platform/rate-limit";
import { testMercadoPago, testOpenAI, testResend, type IntegrationId, type TestResult } from "./integrations";

import journal from "@/db/migrations/meta/_journal.json";

/** Migraciones versionadas en el repo (se lee del registro de drizzle). */
const EXPECTED_MIGRATIONS = journal.entries.length;

async function testDatabase(): Promise<TestResult> {
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    let applied = 0;
    try {
      const r = (await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`)) as unknown as {
        rows: { n: number }[];
      };
      applied = r.rows[0]?.n ?? 0;
    } catch {
      applied = 0;
    }
    const verses = (await db.execute(sql`select count(*)::int as n from bible_verses`)) as unknown as { rows: { n: number }[] };
    const v = verses.rows[0]?.n ?? 0;
    const problems: string[] = [];
    if (applied < EXPECTED_MIGRATIONS) problems.push(`migraciones aplicadas: ${applied} de ${EXPECTED_MIGRATIONS} (ejecutá npm run db:migrate)`);
    if (v < 31000) problems.push(`Biblia: ${v} versículos (ejecutá db:fetch-bible y db:import-bible)`);
    return problems.length
      ? { ok: false, message: `Conectada, pero: ${problems.join("; ")}.` }
      : { ok: true, message: `Conectada. ${applied} migraciones y ${v.toLocaleString("es-AR")} versículos cargados.` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (/DATABASE_URL/.test(msg)) return { ok: false, message: "Falta DATABASE_URL." };
    return { ok: false, message: "No se pudo conectar a la base (revisá la cadena de conexión)." };
  }
}

export async function runIntegrationTest(id: IntegrationId): Promise<TestResult> {
  const actor = await getActor();
  if (!can(actor, "plans:configure")) return { ok: false, message: "No autorizado." };
  const rl = await consumeRateLimit({ bucket: "integration-test", limit: 20, windowMs: 10 * 60_000 }, `u:${actor.userId}`);
  if (!rl.allowed) return { ok: false, message: "Demasiadas pruebas seguidas. Esperá unos minutos." };

  let result: TestResult;
  try {
    const env = process.env;
    switch (id) {
      case "database":
        result = await testDatabase();
        break;
      case "openai":
        result = await testOpenAI(env);
        break;
      case "email":
        result = await testResend(env);
        break;
      case "mercadopago":
        result = await testMercadoPago(env);
        break;
      default:
        result = { ok: false, message: "Esta integración no tiene prueba automática." };
    }
  } catch {
    result = { ok: false, message: "No se pudo contactar al servicio (red o servicio caído)." };
  }
  await getDb()
    .insert(auditLog)
    .values({ actorUserId: actor.userId, action: "integration.test", entity: "integration", entityId: id, metadata: { ok: result.ok } })
    .catch(() => undefined);
  return result;
}
