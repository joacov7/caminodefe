/**
 * Datos de PRUEBA para E2E (usuarios, iglesia, eventos, sesiones). Solo para
 * PostgreSQL local o de CI: se niega a ejecutarse contra Neon o en producción
 * (regla: no usar datos ficticios en producción).
 *
 * Uso: DATABASE_DRIVER=pg DATABASE_URL=postgresql://…localhost… npx tsx tests/e2e/fixtures.ts
 */
import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../db/index";
import {
  users,
  sessions,
  churches,
  userRoles,
  churchMembers,
  churchEvents,
  serviceTimes,
  contentItems,
} from "../../db/schema";

const url = process.env.DATABASE_URL ?? "";
if (process.env.NODE_ENV === "production" || /neon\.tech/.test(url) || !/localhost|127\.0\.0\.1/.test(url)) {
  console.error("Las semillas E2E solo corren contra un Postgres local/CI.");
  process.exit(1);
}

export const E2E = {
  member: { id: "e2e-member", email: "persona@e2e.local", name: "Lucía Prueba", token: "e2e-token-member" },
  pastor: { id: "e2e-pastor", email: "pastor@e2e.local", name: "Pastor Prueba", token: "e2e-token-pastor" },
  admin: { id: "e2e-admin", email: "admin@e2e.local", name: "Admin Prueba", token: "e2e-token-admin" },
  other: { id: "e2e-other", email: "otra@e2e.local", name: "Otra Persona", token: "e2e-token-other" },
  church: { id: "e2e-church", slug: "iglesia-e2e-centro", name: "Iglesia Comunidad de Prueba" },
  otherChurch: { id: "e2e-church-2", slug: "iglesia-e2e-norte", name: "Iglesia Norte de Prueba" },
};

async function main() {
  const db = getDb();
  const ids = [E2E.member.id, E2E.pastor.id, E2E.admin.id, E2E.other.id];
  // Limpieza idempotente (cascada borra datos privados, roles, sesiones…).
  await db.delete(users).where(inArray(users.id, ids));
  await db.delete(churches).where(inArray(churches.id, [E2E.church.id, E2E.otherChurch.id]));

  await db.insert(users).values(
    [E2E.member, E2E.pastor, E2E.admin, E2E.other].map((u) => ({ id: u.id, email: u.email, name: u.name, emailVerified: new Date() })),
  );
  const expires = new Date(Date.now() + 7 * 86_400_000);
  await db.insert(sessions).values(
    [E2E.member, E2E.pastor, E2E.admin, E2E.other].map((u) => ({ sessionToken: u.token, userId: u.id, expires })),
  );
  await db.insert(churches).values([
    {
      id: E2E.church.id,
      slug: E2E.church.slug,
      name: E2E.church.name,
      generalLocation: "Rosario, Santa Fe",
      description: "Una comunidad que lee la Biblia, ora y sirve a su barrio. Te esperamos tal como estás.",
      doctrinalStatement: "Creemos en un solo Dios, Padre, Hijo y Espíritu Santo, y en la salvación por gracia mediante la fe en Jesucristo.",
      status: "verified",
    },
    { id: E2E.otherChurch.id, slug: E2E.otherChurch.slug, name: E2E.otherChurch.name, generalLocation: "Córdoba", status: "verified" },
  ]);
  await db.insert(userRoles).values([
    { userId: E2E.pastor.id, role: "pastor", scope: "church", churchId: E2E.church.id },
    { userId: E2E.admin.id, role: "platform_admin", scope: "platform" },
  ]);
  await db.insert(churchMembers).values({ churchId: E2E.church.id, userId: E2E.pastor.id, status: "active" });
  await db.insert(serviceTimes).values([
    { churchId: E2E.church.id, day: "domingo", time: "10:30", label: "Culto general" },
    { churchId: E2E.church.id, day: "miércoles", time: "20:00", label: "Estudio bíblico y oración" },
  ]);
  const inDays = (d: number, h = 20) => {
    const x = new Date(Date.now() + d * 86_400_000);
    x.setUTCHours(h + 3, 0, 0, 0);
    return x;
  };
  await db.insert(churchEvents).values([
    { churchId: E2E.church.id, title: "Noche de oración por la ciudad", startsAt: inDays(3), location: "Bv. Oroño 1234, Rosario", visibility: "public", description: "Una noche para orar juntos." },
    { churchId: E2E.church.id, title: "Reunión de líderes", startsAt: inDays(5), visibility: "members" },
    { churchId: E2E.otherChurch.id, title: "Culto de jóvenes", startsAt: inDays(6, 19), onlineUrl: "https://example.org/vivo", visibility: "public" },
  ]);
  await db
    .insert(contentItems)
    .values({
      id: "e2e-devocional",
      type: "devotional",
      title: "Descansar en el Buen Pastor",
      passage: "Salmos 23:1",
      body: "Reflexión de prueba.",
      origin: "human",
      editorialStatus: "published",
      publishedAt: new Date(),
    })
    .onConflictDoNothing();
  void eq;
  console.log("Fixtures E2E listas.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
