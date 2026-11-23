import { describe, it, expect } from "vitest";
import { integrationStatus, canSignIn, testOpenAI, testResend, testMercadoPago, INTEGRATIONS } from "@/server/admin/integrations";

const SECRET = "sk-super-secreta-NO-DEBE-APARECER-1234567890";
const fake = (status: number, body: unknown = {}) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("estado de integraciones", () => {
  it("nunca incluye valores secretos, solo nombres de variables", () => {
    const env = { OPENAI_API_KEY: SECRET, DATABASE_URL: "postgresql://u:" + SECRET + "@h/db", AUTH_SECRET: SECRET };
    const out = JSON.stringify(integrationStatus(env));
    expect(out).not.toContain(SECRET);
    expect(out).toContain("OPENAI_API_KEY");
  });
  it("clasifica completa / incompleta / faltante", () => {
    const st = Object.fromEntries(
      integrationStatus({ GOOGLE_CLIENT_ID: "x", AUTH_SECRET: "a".repeat(40), MERCADOPAGO_ACCESS_TOKEN: "TEST-1" }).map((s) => [s.id, s]),
    );
    expect(st.auth!.state).toBe("ok");
    expect(st.google!.state).toBe("partial");
    expect(st.openai!.state).toBe("missing");
    // MP sin secreto de webhook: funciona (partial) y avisa.
    expect(st.mercadopago!.state).toBe("partial");
    expect(st.mercadopago!.notes.join(" ")).toMatch(/PRUEBA/);
  });
  it("advierte configuraciones riesgosas", () => {
    const st = Object.fromEntries(
      integrationStatus({ AUTH_SECRET: "corta", NEXT_PUBLIC_SITE_URL: "http://midominio.com/", DATABASE_DRIVER: "pg", DATABASE_URL: "x" }).map((s) => [s.id, s]),
    );
    expect(st.auth!.notes.join()).toMatch(/32/);
    expect(st.site!.notes.join()).toMatch(/https/);
    expect(st.database!.notes.join()).toMatch(/desarrollo/);
  });
  it("ingreso habilitado con Google o correo", () => {
    expect(canSignIn({})).toBe(false);
    expect(canSignIn({ AUTH_RESEND_KEY: "k", EMAIL_FROM: "a <a@b.c>" })).toBe(true);
  });
  it("cada integración documenta variables y pasos", () => {
    for (const i of INTEGRATIONS) {
      expect(i.variables.length).toBeGreaterThan(0);
      expect(i.howTo.length).toBeGreaterThan(0);
    }
  });
});

describe("pruebas de conexión (proveedores simulados)", () => {
  it("OpenAI: ok, clave inválida, modelo sin acceso, saldo", async () => {
    expect((await testOpenAI({ OPENAI_API_KEY: SECRET }, fake(200))).ok).toBe(true);
    expect((await testOpenAI({ OPENAI_API_KEY: SECRET }, fake(401))).message).toMatch(/rechazada/);
    expect((await testOpenAI({ OPENAI_API_KEY: SECRET }, fake(404))).message).toMatch(/modelo/);
    expect((await testOpenAI({ OPENAI_API_KEY: SECRET }, fake(429))).message).toMatch(/Billing/);
    expect((await testOpenAI({}, fake(200))).ok).toBe(false);
  });
  it("Resend: verifica que el dominio de EMAIL_FROM esté verificado", async () => {
    const env = { AUTH_RESEND_KEY: "re_x", EMAIL_FROM: "Camino de Fe <hola@caminodefe.app>" };
    expect((await testResend(env, fake(200, { data: [{ name: "caminodefe.app", status: "verified" }] }))).ok).toBe(true);
    expect((await testResend(env, fake(200, { data: [{ name: "caminodefe.app", status: "pending" }] }))).message).toMatch(/no está verificado/);
    expect((await testResend(env, fake(200, { data: [] }))).message).toMatch(/no está agregado/);
  });
  it("Mercado Pago: informa modo prueba o producción", async () => {
    expect((await testMercadoPago({ MERCADOPAGO_ACCESS_TOKEN: "TEST-1" }, fake(200, { site_id: "MLA" }))).message).toMatch(/prueba.*MLA/);
    expect((await testMercadoPago({ MERCADOPAGO_ACCESS_TOKEN: "APP_USR-1" }, fake(200, {}))).message).toMatch(/PRODUCCIÓN/);
    expect((await testMercadoPago({ MERCADOPAGO_ACCESS_TOKEN: "x" }, fake(401))).ok).toBe(false);
  });
  it("los mensajes nunca contienen la clave", async () => {
    for (const s of [200, 401, 404, 429, 500]) {
      expect((await testOpenAI({ OPENAI_API_KEY: SECRET }, fake(s))).message).not.toContain(SECRET);
    }
  });
});
