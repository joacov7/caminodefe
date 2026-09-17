import { describe, it, expect } from "vitest";
import {
  isValidReason,
  canWithdraw,
  canChurchTransition,
} from "@/server/churches/contact";
import {
  canManageChurch,
  canHandleContactRequests,
  canVerifyChurches,
  managedChurchIds,
} from "@/server/churches/access";
import type { Actor } from "@/server/authz/permissions";

const pastorA: Actor = {
  userId: "u1",
  roles: [{ role: "pastor", scope: "church", churchId: "A" }],
};
const admin: Actor = {
  userId: "u2",
  roles: [{ role: "platform_admin", scope: "platform" }],
};
const registered: Actor = { userId: "u3", roles: [] };

describe("solicitudes de contacto — estados", () => {
  it("valida motivos permitidos", () => {
    expect(isValidReason("oracion")).toBe(true);
    expect(isValidReason("hackear")).toBe(false);
  });

  it("el usuario puede retirar mientras no esté resuelta ni retirada", () => {
    expect(canWithdraw("sent")).toBe(true);
    expect(canWithdraw("in_progress")).toBe(true);
    expect(canWithdraw("resolved")).toBe(false);
    expect(canWithdraw("withdrawn")).toBe(false);
  });

  it("la iglesia solo avanza por transiciones válidas", () => {
    expect(canChurchTransition("sent", "received")).toBe(true);
    expect(canChurchTransition("received", "resolved")).toBe(true);
    expect(canChurchTransition("sent", "resolved")).toBe(false);
    expect(canChurchTransition("resolved", "in_progress")).toBe(false);
  });
});

describe("autorización de iglesias", () => {
  it("un pastor gestiona su iglesia y no otra", () => {
    expect(canManageChurch(pastorA, "A")).toBe(true);
    expect(canManageChurch(pastorA, "B")).toBe(false);
    expect(canHandleContactRequests(pastorA, "A")).toBe(true);
  });

  it("solo el admin de plataforma verifica iglesias", () => {
    expect(canVerifyChurches(admin)).toBe(true);
    expect(canVerifyChurches(pastorA)).toBe(false);
  });

  it("managedChurchIds lista las iglesias gestionadas sin duplicar", () => {
    const multi: Actor = {
      userId: "u9",
      roles: [
        { role: "pastor", scope: "church", churchId: "A" },
        { role: "church_admin", scope: "church", churchId: "A" },
        { role: "church_leader", scope: "church", churchId: "B" },
        { role: "registered", scope: "platform" },
      ],
    };
    expect(managedChurchIds(multi).sort()).toEqual(["A", "B"]);
    expect(managedChurchIds(registered)).toEqual([]);
  });
});
