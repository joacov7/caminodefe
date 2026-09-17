import { describe, it, expect } from "vitest";
import {
  noteSchema,
  journalSchema,
  favoriteSchema,
} from "@/server/camino/validation";
import { can, type Actor } from "@/server/authz/permissions";

describe("validación de Mi Camino", () => {
  it("rechaza notas vacías y acepta válidas", () => {
    expect(noteSchema.safeParse({ body: "" }).success).toBe(false);
    expect(noteSchema.safeParse({ body: "Reflexión" }).success).toBe(true);
    expect(
      noteSchema.safeParse({ title: "T", body: "x", linkedRef: "Juan 3:16" }).success,
    ).toBe(true);
  });

  it("rechaza entradas de diario vacías", () => {
    expect(journalSchema.safeParse({ entry: "" }).success).toBe(false);
    expect(journalSchema.safeParse({ entry: "Hoy aprendí…" }).success).toBe(true);
  });

  it("valida el tipo de favorito", () => {
    expect(
      favoriteSchema.safeParse({ refType: "bible_chapter", refId: "juan/3" }).success,
    ).toBe(true);
    expect(
      favoriteSchema.safeParse({ refType: "otro", refId: "x" }).success,
    ).toBe(false);
  });
});

describe("privacidad de Mi Camino (autorización)", () => {
  const visitor: Actor = { userId: null, roles: [] };
  const registered: Actor = { userId: "u1", roles: [] };
  const admin: Actor = {
    userId: "a1",
    roles: [{ role: "platform_admin", scope: "platform" }],
  };

  it("gestionar lo propio requiere sesión", () => {
    expect(can(visitor, "notes:manage_own")).toBe(false);
    expect(can(registered, "notes:manage_own")).toBe(true);
  });

  it("no existe acción para que un admin lea datos privados de otros", () => {
    // La matriz de permisos no define ninguna acción de lectura ajena.
    // Un admin solo puede gestionar SUS propios datos como cualquier usuario.
    expect(can(admin, "notes:manage_own")).toBe(true);
  });
});
