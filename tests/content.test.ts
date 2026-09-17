import { describe, it, expect } from "vitest";
import { canTransition, contentSchema } from "@/server/content/editorial";
import { canManageContent } from "@/server/content/access";
import type { Actor } from "@/server/authz/permissions";

describe("flujo editorial", () => {
  it("respeta la máquina de estados", () => {
    expect(canTransition("draft", "review")).toBe(true);
    expect(canTransition("review", "approved")).toBe(true);
    expect(canTransition("approved", "published")).toBe(true);
    expect(canTransition("draft", "published")).toBe(false); // no salta pasos
    expect(canTransition("published", "review")).toBe(true); // despublicar
  });

  it("valida el contenido", () => {
    expect(
      contentSchema.safeParse({ type: "devotional", title: "Hola mundo", body: "x", origin: "human" }).success,
    ).toBe(true);
    expect(
      contentSchema.safeParse({ type: "devotional", title: "no", body: "x", origin: "human" }).success,
    ).toBe(false); // título muy corto
    expect(
      contentSchema.safeParse({ type: "otro", title: "Valido", body: "x", origin: "human" }).success,
    ).toBe(false);
  });
});

describe("autorización de contenidos", () => {
  const admin: Actor = { userId: "a", roles: [{ role: "platform_admin", scope: "platform" }] };
  const moderator: Actor = { userId: "m", roles: [{ role: "content_moderator", scope: "platform" }] };
  const pastorA: Actor = { userId: "p", roles: [{ role: "pastor", scope: "church", churchId: "A" }] };
  const registered: Actor = { userId: "u", roles: [] };

  it("contenido de plataforma: admin o moderador", () => {
    expect(canManageContent(admin, null)).toBe(true);
    expect(canManageContent(moderator, null)).toBe(true);
    expect(canManageContent(pastorA, null)).toBe(false);
    expect(canManageContent(registered, null)).toBe(false);
  });

  it("contenido de una iglesia: quienes la gestionan", () => {
    expect(canManageContent(pastorA, "A")).toBe(true);
    expect(canManageContent(pastorA, "B")).toBe(false);
    expect(canManageContent(admin, "A")).toBe(true); // admin de plataforma
  });
});
