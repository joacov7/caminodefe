/**
 * Pruebas de extremo a extremo contra la app REAL (build de producción +
 * PostgreSQL local con fixtures de tests/e2e/fixtures.ts).
 *
 * Requisitos: app corriendo en E2E_BASE_URL (por defecto http://localhost:3100)
 * con DATABASE_DRIVER=pg y las fixtures cargadas. Usa la librería `playwright`
 * (sin dependencias nuevas) y `node:assert`.
 *
 * Uso: npm run e2e
 */
import { createRequire } from "node:module";
// `playwright` se resuelve vía require (en este entorno está preinstalado de
// forma global; en CI: `npm i --no-save playwright && npx playwright install chromium`).
const { chromium, devices } = createRequire(import.meta.url)("playwright");
import assert from "node:assert/strict";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";
const TOKENS = {
  member: "e2e-token-member",
  pastor: "e2e-token-pastor",
  admin: "e2e-token-admin",
  other: "e2e-token-other",
};
const CHURCH = "iglesia-e2e-centro";

const results = [];
async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t });
    console.log(`  ✓ ${name}`);
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    console.log(`  ✗ ${name}\n    ${e.message.split("\n")[0]}`);
  }
}

const browser = await chromium.launch();
async function as(who, mobile = true) {
  const ctx = await browser.newContext(mobile ? { ...devices["Pixel 7"] } : { viewport: { width: 1280, height: 900 } });
  if (who) await ctx.addCookies([{ name: "authjs.session-token", value: TOKENS[who], url: BASE }]);
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  return page;
}
const go = (p, path) => p.goto(BASE + path, { waitUntil: "networkidle" });

console.log(`E2E contra ${BASE}`);

// ---------------------------------------------------------------- Visitante
const anon = await as(null);
await step("visitante: landing, Biblia y camino sin cuenta", async () => {
  await go(anon, "/");
  await anon.getByRole("heading", { name: /Tu camino de fe empieza/ }).waitFor();
  await go(anon, "/biblia/juan/3");
  const v16 = await anon.locator("#v16").innerText();
  assert.match(v16, /de tal manera amó Dios al mundo/);
  await go(anon, "/camino/conocer-a-jesus");
  await anon.getByText("Venid á mí todos los que estáis trabajados", { exact: false }).waitFor();
  await anon.getByRole("link", { name: "Ingresá" }).first().waitFor();
});
await step("visitante: datos privados y paneles protegidos", async () => {
  const r = await anon.request.get(BASE + "/api/cuenta/exportar");
  assert.equal(r.status(), 401);
  await go(anon, "/pastoral");
  await anon.getByText("Panel para pastores y líderes verificados").waitFor();
  await go(anon, "/admin");
  await anon.getByText("Acceso restringido").waitFor();
});
await step("SEO/PWA: sitemap con la Biblia, robots y manifest", async () => {
  const sm = await (await anon.request.get(BASE + "/sitemap.xml")).text();
  assert.ok(sm.includes("/biblia/apocalipsis/22"), "sitemap sin capítulos");
  assert.ok(sm.includes(`/iglesias/${CHURCH}`), "sitemap sin iglesias");
  const robots = await (await anon.request.get(BASE + "/robots.txt")).text();
  assert.match(robots, /Disallow: \/mi-camino/);
  const mf = await (await anon.request.get(BASE + "/manifest.webmanifest")).json();
  assert.ok(mf.icons.some((i) => i.purpose === "maskable"));
});

// ---------------------------------------------------------------- Persona
const member = await as("member");
const REFLECTION = `Reflexión privada E2E ${Date.now()}`;
await step("persona: completa una etapa del camino con reflexión privada", async () => {
  await go(member, "/camino/conocer-a-jesus");
  await member.getByLabel(/Tu reflexión/).fill(REFLECTION);
  await member.getByRole("button", { name: "Marcar como recorrida" }).click();
  await member.getByText("Etapa recorrida").waitFor();
  await go(member, "/camino");
  await member.getByText("1 de 10 etapas recorridas").waitFor();
  await go(member, "/inicio");
  await member.getByRole("heading", { name: "Conocer el Evangelio" }).waitFor();
});
await step("privacidad: otra persona NO ve la reflexión ni el progreso", async () => {
  const other = await as("other");
  await go(other, "/camino/conocer-a-jesus");
  const value = await other.getByLabel(/Tu reflexión/).inputValue();
  assert.equal(value, "");
  await go(other, "/camino");
  await other.getByText("Todavía no empezaste").waitFor();
  await other.context().close();
});
await step("persona: marca días de un plan y el progreso persiste", async () => {
  await go(member, "/planes/esperanza-7-dias");
  await member.getByRole("button", { name: "Marcar día 1 como leído" }).click();
  await member.getByRole("button", { name: "Desmarcar día 1" }).waitFor();
  await member.waitForTimeout(400);
  await go(member, "/planes/esperanza-7-dias");
  await member.getByText("Seguís en el día 2.").waitFor();
  await go(member, "/inicio");
  await member.getByText("Esperanza en 7 días · Día 2 de 7").waitFor();
});
await step("persona: recordatorio exportable como .ics válido", async () => {
  const r = await member.request.get(BASE + "/api/recordatorio?time=07:30&days=1,3,5&tz=America/Argentina/Buenos_Aires");
  assert.equal(r.status(), 200);
  const ics = await r.text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR/);
  assert.match(ics, /DTSTART;TZID=America\/Argentina\/Buenos_Aires:\d{8}T073000/);
  const bad = await member.request.get(BASE + "/api/recordatorio?time=25:99");
  assert.equal(bad.status(), 400);
});
await step("persona: escribe a un pastor y pide ser miembro", async () => {
  await go(member, `/iglesias/${CHURCH}`);
  await member.getByRole("heading", { name: "Iglesia Comunidad de Prueba" }).waitFor();
  await member.getByRole("button", { name: "Soy parte de esta iglesia" }).click();
  await member.getByText("Solicitud enviada").waitFor();
  await go(member, `/iglesias/${CHURCH}/contactar?motivo=${encodeURIComponent("Quiero visitar la iglesia")}`);
  assert.equal(await member.getByRole("radio", { name: /Quiero visitar/ }).isChecked(), true);
  await member.getByRole("button", { name: "Enviar" }).click();
  await member.getByText(/Tu mensaje llegó/).waitFor();
  await go(member, "/perfil");
  await member.getByText("Mis mensajes a pastores").waitFor();
});
await step("persona: el evento solo-miembros NO es visible antes de aprobar", async () => {
  await go(member, `/iglesias/${CHURCH}`);
  assert.equal(await member.getByText("Reunión de líderes").count(), 0);
});

// ---------------------------------------------------------------- Pastor
const pastor = await as("pastor", false);
let eventTitle = `Encuentro E2E ${Date.now()}`;
await step("pastor: ve la solicitud en su bandeja (sin datos privados)", async () => {
  await go(pastor, "/pastoral");
  await pastor.getByRole("heading", { name: "Iglesia Comunidad de Prueba" }).waitFor();
  await pastor.getByText("Quiere congregar").first().waitFor();
  const html = await pastor.content();
  assert.ok(!html.includes(REFLECTION), "¡la reflexión privada apareció en el panel pastoral!");
});
await step("pastor: aprueba la membresía", async () => {
  await go(pastor, "/pastoral/miembros");
  await pastor.getByText("Lucía Prueba").waitFor();
  await pastor.getByRole("button", { name: "Aprobar" }).click();
  await pastor.getByText("Miembros activos (2)").waitFor();
});
await step("pastor: crea un evento público y aparece en la agenda", async () => {
  await go(pastor, "/pastoral/eventos");
  await pastor.getByRole("button", { name: "Nuevo evento" }).click();
  await pastor.getByLabel("Título").fill(eventTitle);
  const d = new Date(Date.now() + 10 * 86_400_000);
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T19:30`;
  await pastor.getByLabel("Inicio").fill(local);
  await pastor.getByLabel("Lugar").fill("Salón principal");
  await pastor.getByRole("button", { name: "Publicar evento" }).click();
  await pastor.getByText(eventTitle).waitFor();
  await go(anon, "/eventos");
  await anon.getByText(eventTitle).waitFor();
});
await step("pastor: validación de eventos (fin antes del inicio)", async () => {
  await go(pastor, "/pastoral/eventos");
  await pastor.getByRole("button", { name: "Nuevo evento" }).click();
  await pastor.getByLabel("Título").fill("Evento inválido");
  await pastor.getByLabel("Inicio").fill("2030-05-10T20:00");
  await pastor.getByLabel(/^Fin/).fill("2030-05-10T18:00");
  await pastor.getByRole("button", { name: "Publicar evento" }).click();
  await pastor.getByText("La finalización debe ser posterior al inicio.").waitFor();
});
await step("pastor: no puede gestionar otra iglesia", async () => {
  await go(pastor, "/pastoral/eventos?church=e2e-church-2");
  // Ignora el parámetro ajeno y muestra solo su iglesia.
  await pastor.getByText("Iglesia Comunidad de Prueba").first().waitFor();
  assert.equal(await pastor.getByText("Culto de jóvenes").count(), 0);
});
await step("persona: ya aprobada, ve el evento de miembros y lo agenda", async () => {
  await go(member, `/iglesias/${CHURCH}`);
  await member.getByText("Reunión de líderes").click();
  await member.getByRole("heading", { name: "Reunión de líderes" }).waitFor();
  const href = await member.getByRole("link", { name: /Agregar a mi calendario/ }).getAttribute("href");
  const ics = await (await member.request.get(BASE + href)).text();
  assert.match(ics, /SUMMARY:Reunión de líderes/);
});

// ---------------------------------------------------------------- Oración
const PRAYER = `Por la salud de mi mamá ${Date.now()}`;
const PRIVATE_PRAYER = `Pedido íntimo ${Date.now()}`;
await step("oración: un pedido privado y uno compartido sin nombre con la iglesia", async () => {
  await go(member, "/oracion");
  await member.getByLabel("¿Por qué querés orar?").fill(PRIVATE_PRAYER);
  await member.getByRole("button", { name: "Guardar pedido" }).click();
  await member.getByText(PRIVATE_PRAYER).waitFor();
  await member.getByLabel("¿Por qué querés orar?").fill(PRAYER);
  await member.getByRole("radio", { name: /Pedirle a mi iglesia/ }).check();
  await member.getByLabel("Compartir sin mi nombre").check();
  await member.getByRole("button", { name: "Compartir pedido" }).click();
  await member.getByText(PRAYER).waitFor();
});
await step("oración: el pastor ve solo el compartido, sin nombre, y marca «orando»", async () => {
  await go(pastor, "/pastoral/oracion");
  await pastor.getByText(PRAYER).waitFor();
  const html = await pastor.content();
  assert.ok(!html.includes(PRIVATE_PRAYER), "¡el pedido privado apareció al pastor!");
  assert.ok(!html.includes("Lucía Prueba"), "¡se mostró el nombre en un pedido anónimo!");
  await pastor.getByRole("button", { name: "Estamos orando" }).first().click();
  await pastor.getByText("✓ Estamos orando").first().waitFor();
  await go(member, "/oracion");
  await member.getByText("Tu iglesia está orando").waitFor();
});
await step("invitación: QR y enlace corto llevan a la bienvenida de la iglesia", async () => {
  await go(pastor, "/pastoral/invitar");
  await pastor.getByRole("img", { name: /Código QR de invitación/ }).waitFor();
  const svg = await (await pastor.request.get(`${BASE}/api/qr?iglesia=${CHURCH}`)).text();
  assert.match(svg, /^<svg/);
  const fresh = await as(null);
  await go(fresh, `/i/${CHURCH}`);
  assert.match(fresh.url(), /invitacion=1/);
  await fresh.getByText(/Te invitaron desde Iglesia Comunidad de Prueba/).waitFor();
  await fresh.context().close();
});

// ---------------------------------------------------------------- Admin
const admin = await as("admin", false);
await step("admin: métricas agregadas, auditoría y biblioteca curada", async () => {
  await go(admin, "/admin");
  await admin.getByText("Salud de la plataforma").waitFor();
  await go(admin, "/admin/auditoria");
  await admin.getByText("event.create").first().waitFor();
  await go(admin, "/admin/biblioteca");
  const q = `¿Qué es la gracia según la Biblia? ${Date.now()}`;
  await admin.getByLabel("Pregunta frecuente").fill(q);
  await admin.getByLabel("Respuesta revisada").fill(
    "Lo que dice el texto: «Porque por gracia sois salvos por la fe» (Efesios 2:8). Interpretación: la gracia es el favor inmerecido de Dios.",
  );
  await admin.getByRole("button", { name: "Guardar borrador" }).click();
  await admin.getByText(q).waitFor();
});
await step("admin: configuración muestra estado y prueba la base sin exponer secretos", async () => {
  await go(admin, "/admin/configuracion");
  await admin.getByRole("heading", { name: "Configuración" }).waitFor();
  await admin.getByText("○ OPENAI_API_KEY").waitFor();
  const html = await admin.content();
  assert.ok(!html.includes("e2e-local-secret"), "¡se mostró el valor de AUTH_SECRET!");
  assert.ok(!html.includes("postgresql://"), "¡se mostró la cadena de conexión!");
  const db = admin.locator("li", { has: admin.getByRole("heading", { name: "Base de datos (Neon)" }) });
  await db.getByRole("button", { name: "Probar conexión" }).click();
  await db.getByRole("status").waitFor();
  assert.match(await db.getByRole("status").innerText(), /Conectada/);
});
await step("configuración: inaccesible para quien no es admin", async () => {
  await go(pastor, "/admin/configuracion");
  await pastor.getByText("Acceso restringido").waitFor();
});
await step("admin: no ve el contenido privado de nadie", async () => {
  for (const path of ["/admin", "/admin/auditoria", "/admin/biblioteca"]) {
    await go(admin, path);
    assert.ok(!(await admin.content()).includes(REFLECTION));
  }
});

// ---------------------------------------------------------------- Derechos sobre los datos
await step("persona: exporta sus datos (incluye su reflexión)", async () => {
  const r = await member.request.get(BASE + "/api/cuenta/exportar");
  assert.equal(r.status(), 200);
  const data = await r.json();
  assert.equal(data.profile.email, "persona@e2e.local");
  assert.ok(data.guidedPath.some((g) => g.reflection === REFLECTION));
  assert.ok(data.readingPlans.some((p) => p.planId === "esperanza-7-dias"));
});
await step("otra persona: elimina su cuenta y pierde el acceso", async () => {
  const other = await as("other");
  await go(other, "/perfil/privacidad");
  await other.getByLabel(/para confirmar/).fill("ELIMINAR");
  await other.getByRole("button", { name: "Eliminar mi cuenta" }).click();
  await other.waitForURL(/cuenta=eliminada/);
  const r = await other.request.get(BASE + "/api/cuenta/exportar");
  assert.equal(r.status(), 401);
  await other.context().close();
});

await step("PWA: la Biblia se lee sin conexión; lo personal no queda guardado", async () => {
  const ctx = await browser.newContext({ ...devices["Pixel 7"] });
  await ctx.addCookies([{ name: "authjs.session-token", value: TOKENS.member, url: BASE }]);
  const p = await ctx.newPage();
  await p.goto(BASE + "/biblia/salmos/23", { waitUntil: "networkidle" });
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload({ waitUntil: "networkidle" }); // ya controlada por el SW: se guarda la copia
  await go(p, "/perfil");
  await ctx.setOffline(true);
  await p.goto(BASE + "/biblia/salmos/23");
  await p.getByText("nada me faltará", { exact: false }).first().waitFor();
  await p.goto(BASE + "/perfil");
  await p.getByRole("heading", { name: "Estás sin conexión" }).waitFor();
  await ctx.close();
});
await step("tarea programada protegida por secreto", async () => {
  const r = await anon.request.get(BASE + "/api/cron/mantenimiento");
  assert.equal(r.status(), 401);
});
await step("sin errores de JavaScript en el navegador", async () => {
  const errs = [anon, member, pastor, admin].flatMap((p) => p.errors);
  assert.deepEqual(errs, []);
});

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} pasos OK`);
process.exit(failed.length ? 1 : 0);
