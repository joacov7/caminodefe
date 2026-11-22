# 10. Auditoría integral — Fase 1 (22/11/2026)

Equipo: CTO, arquitectos, seguridad, QA, UX, IA, producto. Método: lectura
completa del repositorio, ejecución de `typecheck`/`lint`/`test`, y **aplicación
real de las 8 migraciones sobre PostgreSQL 16** con pruebas de RLS usando un rol
sin privilegios (`NOBYPASSRLS`).

## 1. Estado verificado

| Área | Estado real | Evidencia |
|---|---|---|
| Typecheck / lint / tests | ✅ 0 errores · 51/51 tests | `npm run typecheck && npm run lint && npm test` |
| Migraciones 0000–0007 | ✅ aplican limpias en PG16 | psql `-v ON_ERROR_STOP=1` |
| Políticas RLS (diseño) | ✅ correctas: dueño ve su nota; otro usuario y "sin contexto" ven 0 | prueba manual con rol `app_test` |
| **RLS en ejecución** | ❌ **inactiva**: la app nunca fija `app.user_id` y se conecta como dueño de las tablas (el dueño ignora la RLS) | `grep set_config` → 0 usos en código |
| Biblia | ⚠️ lector OK, pero **el texto no existe**: solo hay ~5 versículos de semilla; no hay fuente documentada | `content/bible/` vacío |
| Asistente | ✅ guardarraíles, crisis, verificación de citas, historial, límites. ⚠️ RAG solo por referencia explícita | `server/ai/*` |
| Iglesias | ✅ perfil, contacto, verificación. ❌ eventos sin creación/edición (tabla sí, UI no) | `server/churches/actions.ts` |
| Mi Camino | ✅ notas, diario, favoritos con filtro por `userId` | `server/camino/*` |
| Contenidos | ✅ flujo editorial draft→review→approved→published | `server/content/*` |
| Billing | ✅ Premium simulado, donación registrada sin cobro | `server/billing/*` |
| PWA | ⚠️ manifest + icono SVG; **sin service worker**, sin iconos PNG (iOS/Android los exigen) | `app/manifest.ts` |
| Analítica | ❌ inexistente | — |
| Rate limiting | ❌ inexistente (solo límite diario de IA) | — |
| Auditoría | ⚠️ tabla existe; se escribe solo en verificación de iglesias y cambios editoriales | `auditLog` |
| Eliminación de datos | ❌ no hay borrado de cuenta ni exportación | `/perfil` muestra filas sin acción |
| Planes de lectura | ❌ inexistentes | — |
| Camino guiado (F1) | ❌ inexistente | — |
| SEO | ⚠️ metadatos básicos; sin `sitemap`, `robots`, Open Graph | — |
| E2E | ❌ no hay pruebas de extremo a extremo; la app no puede correr contra un Postgres local (driver solo HTTP de Neon) | `db/index.ts` |

## 2. Defectos encontrados (priorizados)

1. **[Crítico · seguridad] RLS no se aplica en runtime.** La defensa en
   profundidad prometida en CLAUDE.md no existe en la práctica. La autorización
   de servidor sí filtra por `userId` (por eso no hay fuga conocida), pero un
   bug futuro en una consulta no tendría segunda barrera.
2. **[Crítico · cuidado pastoral] Un usuario sin cupo diario no recibe la
   respuesta de crisis.** `app/api/assistant/route.ts` evalúa el límite del plan
   *antes* de detectar crisis → devuelve 429. Viola el criterio G.3 "nunca se
   bloquea el acceso a recursos de emergencia".
3. **[Alto · producto] La Biblia no tiene texto.** El lector y la verificación
   de citas dependen de un corpus que no se cargó; sin él, toda cita sale "no
   verificada".
4. **[Medio · costos] `ai_usage.cost_estimate_micros` siempre es 0.** No se
   puede medir el costo por usuario, métrica central del negocio.
5. **[Medio] Recursos de crisis incompletos para Argentina** (faltan 144
   violencia de género y 137 violencia familiar/sexual; sin recursos para otros
   países → texto vacío si `country` ≠ AR).
6. **[Medio] Eventos con visibilidad `members` no son legibles por los
   miembros** según la política RLS (solo gestores/admin).
7. **[Bajo] Páginas de perfil con filas "Privacidad" y "Notificaciones" sin
   destino** (promesa de UI no cumplida).

## 3. Deuda técnica

- Driver único `neon-http` (sin transacciones interactivas) → impide RLS por
  transacción y pruebas locales. Se resuelve con `db.batch` (transaccional en
  Neon) y un driver `pg` opcional solo para desarrollo/CI.
- Sin pruebas de integración contra base real; la RLS no tiene test automático.
- Componentes de UI duplicados en cada página (`Section`, `Stat`, tarjetas).
- Sin tipografía cargada (`--font-sans` no está definido) → cae a system-ui.

## 4. Oportunidades no contempladas

- **Ruta de "primera visita"** a una iglesia (formulario de visitante) — es el
  puente digital → presencial y el KPI que más le importa a un pastor.
- **Pedidos de oración** con alcance elegido por la persona (privado, pastor,
  grupo).
- **Invitación por iglesia** (enlace/QR con código) como motor de crecimiento.
- **Páginas públicas indexables** (versículo, devocional, iglesia) con Open
  Graph para compartir en WhatsApp.
- **Exportación `.ics`** de recordatorios y eventos: funciona en cualquier
  teléfono sin push ni costos.

## 5. Decisiones tomadas en esta auditoría

- Corregir 1, 2, 4 y 5 antes de agregar funciones nuevas.
- Cargar la RVR1909 desde **eBible.org (`spaRV1909`)**, que declara
  explícitamente *Public Domain / Dominio Público* (verificado en
  <https://ebible.org/find/details.php?id=spaRV1909>). El archivo no se versiona;
  se descarga con un script reproducible.
- Agregar `pg` como dependencia **de desarrollo** para correr la app y la RLS
  contra Postgres local en pruebas. Producción sigue en Neon HTTP.
