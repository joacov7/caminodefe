import { describe, it, expect } from "vitest";
import { can, type Actor } from "@/server/authz/permissions";

const visitor: Actor = { userId: null, roles: [] };

const registered: Actor = { userId: "u1", roles: [] };

const pastorChurchA: Actor = {
  userId: "u2",
  roles: [{ role: "pastor", scope: "church", churchId: "A" }],
};

const platformAdmin: Actor = {
  userId: "u3",
  roles: [{ role: "platform_admin", scope: "platform" }],
};

const financeOfficer: Actor = {
  userId: "u4",
  roles: [{ role: "finance_officer", scope: "platform" }],
};

describe("autorización (can)", () => {
  it("permite leer la Biblia a cualquiera, incluido un visitante", () => {
    expect(can(visitor, "bible:read")).toBe(true);
  });

  it("exige cuenta para usar el asistente", () => {
    expect(can(visitor, "assistant:use")).toBe(false);
    expect(can(registered, "assistant:use")).toBe(true);
  });

  it("un pastor solo gestiona SU iglesia, no otra (aislamiento multi-tenant)", () => {
    expect(can(pastorChurchA, "church:edit", { churchId: "A" })).toBe(true);
    expect(can(pastorChurchA, "church:edit", { churchId: "B" })).toBe(false);
  });

  it("un usuario registrado no puede editar iglesias", () => {
    expect(can(registered, "church:edit", { churchId: "A" })).toBe(false);
  });

  it("solo la plataforma verifica iglesias y configura planes", () => {
    expect(can(platformAdmin, "church:verify")).toBe(true);
    expect(can(pastorChurchA, "church:verify")).toBe(false);
    expect(can(platformAdmin, "plans:configure")).toBe(true);
  });

  it("reportes financieros requieren el permiso separado", () => {
    expect(can(financeOfficer, "finance:view_reports")).toBe(true);
    expect(can(registered, "finance:view_reports")).toBe(false);
    // El admin de plataforma también puede.
    expect(can(platformAdmin, "finance:view_reports")).toBe(true);
  });

  it("no existe acción para ver conversaciones/notas privadas de otros", () => {
    // Garantía a nivel de tipos: la matriz no define tal acción.
    // @ts-expect-error acción inexistente por diseño (privacidad)
    expect(() => can(platformAdmin, "notes:read_others")).not.toThrow();
  });
});
