import { describe, it, expect } from "vitest";
import { buildEventIcs, buildReminderIcs, foldLine, icsEscape } from "@/lib/ics";
import { stageStates, nextStage, planStatus, reminderSchema } from "@/server/journey/progress";
import { getPlan } from "@/content/reading-plans";
import { eventSchema } from "@/server/events/validation";
import { slugify, uniqueSlug, churchApplicationSchema } from "@/server/churches/onboarding";
import { reasonFromMotivo } from "@/server/churches/contact";
import { splitAddedWords, plainVerse } from "@/lib/bible/format";
import { dailyVerseFor, DAILY_VERSES } from "@/lib/bible/daily";
import { can, type Actor } from "@/server/authz/permissions";
import { rateLimitKey, decide } from "@/server/platform/rate-limit";
import { sanitizeDim } from "@/server/platform/analytics";

describe("calendario (RFC 5545)", () => {
  it("escapa texto y pliega líneas largas a 75 octetos", () => {
    expect(icsEscape("a,b;c\nd")).toBe("a\\,b\;c\\nd");
    const folded = foldLine("X".repeat(200));
    expect(folded.split("\r\n").every((l) => Buffer.byteLength(l) <= 75)).toBe(true);
  });
  it("recordatorio semanal con zona horaria y alarma", () => {
    const ics = buildReminderIcs({ time: "07:05", days: [0, 6], timezone: "America/Argentina/Buenos_Aires", url: "https://x" , start: new Date(2026, 10, 22) });
    expect(ics).toContain("DTSTART;TZID=America/Argentina/Buenos_Aires:20261122T070500");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=SU,SA");
    expect(ics).toContain("BEGIN:VALARM");
    expect(ics.endsWith("\r\n")).toBe(true);
  });
  it("evento con duración por defecto de 90 minutos", () => {
    const ics = buildEventIcs({ id: "1", title: "Culto", startsAt: new Date("2026-12-01T13:00:00Z"), url: "https://x/e/1" });
    expect(ics).toContain("DTSTART:20261201T130000Z");
    expect(ics).toContain("DTEND:20261201T143000Z");
  });
});

describe("progreso (sin puntajes)", () => {
  it("la etapa actual es la primera no recorrida", () => {
    const st = stageStates(new Set(["conocer-a-jesus", "aprender-a-orar"]));
    expect(st[0]!.state).toBe("completed");
    expect(st[1]!.state).toBe("current");
    expect(st[3]!.state).toBe("completed");
    expect(st.filter((s) => s.state === "current")).toHaveLength(1);
    expect(nextStage(new Set())?.id).toBe("conocer-a-jesus");
  });
  it("estado del plan: atrasarse no penaliza, se sigue en el primer día pendiente", () => {
    const plan = getPlan("esperanza-7-dias")!;
    expect(planStatus(plan, [1, 2, 4])).toEqual({ completedCount: 3, nextDay: 3, finished: false });
    expect(planStatus(plan, [1, 2, 3, 4, 5, 6, 7, 99]).finished).toBe(true);
  });
  it("valida recordatorios", () => {
    expect(reminderSchema.safeParse({ enabled: true, time: "24:00", days: [1], timezone: "UTC" }).success).toBe(false);
    expect(reminderSchema.safeParse({ enabled: true, time: "08:00", days: [], timezone: "UTC" }).success).toBe(false);
    expect(reminderSchema.safeParse({ enabled: true, time: "08:00", days: [1], timezone: "No/Existe" }).success).toBe(false);
    expect(reminderSchema.safeParse({ enabled: true, time: "08:00", days: [1, 3], timezone: "America/Argentina/Buenos_Aires" }).success).toBe(true);
  });
});

describe("eventos", () => {
  const base = { title: "Culto especial", startsAt: "2026-12-01T13:00:00.000Z" };
  it("acepta un evento válido y normaliza opcionales vacíos", () => {
    const r = eventSchema.parse({ ...base, location: "", endsAt: "" });
    expect(r.location).toBeNull();
    expect(r.endsAt).toBeNull();
    expect(r.visibility).toBe("public");
  });
  it("rechaza fin anterior al inicio y enlaces no https", () => {
    expect(eventSchema.safeParse({ ...base, endsAt: "2026-12-01T12:00:00.000Z" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, onlineUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, onlineUrl: "http://inseguro" }).success).toBe(false);
  });
});

describe("alta de iglesias y contacto", () => {
  it("slug legible y único", () => {
    expect(slugify("Iglesia Evangélica «Nueva Vida» — Centro")).toBe("iglesia-evangelica-nueva-vida-centro");
    expect(uniqueSlug("nueva-vida", new Set(["nueva-vida", "nueva-vida-2"]))).toBe("nueva-vida-3");
  });
  it("exige confirmación y correo válido", () => {
    const ok = { name: "Nueva Vida", generalLocation: "Rosario", contactEmail: "a@b.com", acceptTerms: true };
    expect(churchApplicationSchema.safeParse(ok).success).toBe(true);
    expect(churchApplicationSchema.safeParse({ ...ok, acceptTerms: false }).success).toBe(false);
    expect(churchApplicationSchema.safeParse({ ...ok, contactEmail: "no" }).success).toBe(false);
  });
  it("motivo sugerido desde el camino/eventos", () => {
    expect(reasonFromMotivo("Quiero visitar la iglesia")).toBe("quiero_congregar");
    expect(reasonFromMotivo("Necesito oración")).toBe("oracion");
    expect(reasonFromMotivo("Quiero aprender a leer la Biblia")).toBe("consulta_biblica");
    expect(reasonFromMotivo("Estoy dando mis primeros pasos en la fe")).toBe("acompanamiento");
  });
});

describe("texto bíblico", () => {
  it("separa palabras añadidas por traductores", () => {
    expect(splitAddedWords("Mi socorro [viene] de Jehová")).toEqual([
      { text: "Mi socorro ", added: false },
      { text: "viene", added: true },
      { text: " de Jehová", added: false },
    ]);
    expect(plainVerse("[Es por] la misericordia")).toBe("Es por la misericordia");
  });
  it("versículo del día estable durante el día y rotativo", () => {
    const a = dailyVerseFor(new Date("2026-11-22T12:00:00Z"));
    expect(dailyVerseFor(new Date("2026-11-22T23:00:00Z"))).toEqual(a);
    const days = new Set(Array.from({ length: DAILY_VERSES.length }, (_, i) => JSON.stringify(dailyVerseFor(new Date(Date.UTC(2026, 0, 1 + i, 15))))));
    expect(days.size).toBe(DAILY_VERSES.length);
  });
});

describe("autorización de nuevos módulos", () => {
  const pastorA: Actor = { userId: "p", roles: [{ role: "pastor", scope: "church", churchId: "A" }] };
  const moderator: Actor = { userId: "m", roles: [{ role: "content_moderator", scope: "platform" }] };
  const admin: Actor = { userId: "a", roles: [{ role: "platform_admin", scope: "platform" }] };
  const person: Actor = { userId: "u", roles: [] };
  it("eventos y miembros: solo la propia iglesia", () => {
    expect(can(pastorA, "church:manage_events", { churchId: "A" })).toBe(true);
    expect(can(pastorA, "church:manage_events", { churchId: "B" })).toBe(false);
    expect(can(pastorA, "church:manage_members", { churchId: "B" })).toBe(false);
    expect(can(person, "church:manage_events", { churchId: "A" })).toBe(false);
  });
  it("biblioteca, métricas y auditoría", () => {
    expect(can(moderator, "library:review")).toBe(true);
    expect(can(moderator, "audit:view")).toBe(false);
    expect(can(pastorA, "library:review")).toBe(false);
    expect(can(admin, "platform:view_metrics")).toBe(true);
    expect(can(person, "account:delete_own")).toBe(true);
    expect(can({ userId: null, roles: [] }, "account:delete_own")).toBe(false);
  });
});

describe("plataforma", () => {
  it("rate limit: claves hasheadas (sin datos en claro) y decisión", () => {
    const k = rateLimitKey("assistant", "ip:1.2.3.4");
    expect(k).not.toContain("1.2.3.4");
    expect(decide(13, new Date(0), { bucket: "x", limit: 12, windowMs: 1000 }).allowed).toBe(false);
  });
  it("analítica: la dimensión no admite texto libre", () => {
    expect(sanitizeDim("Juan Pérez <juan@mail.com>")).toBe("juanprezjuanmailcom".slice(0, 40));
    expect(sanitizeDim(undefined)).toBe("");
  });
});
