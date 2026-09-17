# Guía del repositorio — Camino de Fe

Plataforma cristiana evangélica (PWA) con asistente bíblico de IA. Ver `/docs`
para los entregables de producto y arquitectura (Fase 0).

## Stack
- **Next.js (App Router) + TypeScript estricto + Tailwind** (PWA).
- **Neon (Postgres) + Drizzle ORM**; migraciones versionadas en `db/migrations`.
- **Auth.js (NextAuth v5)** con adaptador Drizzle.
- **OpenAI** como proveedor de IA, detrás de la interfaz `LLMProvider`
  (`server/ai/provider.ts`) — desacoplado y cambiable.
- Despliegue en **Vercel**.

## Estructura
- `app/` rutas y UI (App Router).
- `components/` UI reutilizable.
- `lib/` clientes y utilidades (`env`, `auth`).
- `server/` lógica de dominio: `authz/` (permisos, fuente de verdad), `ai/`.
- `db/` esquema Drizzle, migraciones, seeds.
- `tests/` unit / autorización.
- `docs/` entregables de producto.

## Comandos
- `npm run dev` · `npm run build` · `npm run start`
- `npm run typecheck` · `npm run lint` · `npm test`
- `npm run db:generate` (migraciones desde el esquema)
- `npm run db:migrate` · `npm run db:seed` (requieren `DATABASE_URL`)

## Reglas no negociables
- **Autorización en el servidor** (`server/authz`) + RLS como defensa en
  profundidad. Nunca confiar solo en ocultar UI.
- **Privacidad**: conversaciones, notas y diario son privados; nadie (pastor ni
  admin) los ve por defecto.
- **Secretos solo en variables de entorno**, nunca en el repo (ver `.env.example`).
- El asistente **no** reclama autoridad espiritual, distingue texto bíblico de
  interpretación, y no afirma "respaldo bíblico" sin verificar la cita.
- No presentar como terminada una función/integración que no fue implementada y
  probada.
