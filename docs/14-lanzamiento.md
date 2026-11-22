# 14. Lanzamiento — configuración de producción y piloto (Fase 6)

Nada de esto se ejecutó en producción: **no hay despliegue ni base de producción
creados** (requieren cuentas y credenciales del Product Owner). Todo lo demás está
preparado y probado localmente.

## 1. Lo que necesito de vos (bloqueantes)

| # | Qué | Dónde se carga | Para qué |
|---|---|---|---|
| 1 | Proyecto **Neon** (base de producción) y su `DATABASE_URL` | Vercel → Environment Variables | Todo lo que persiste |
| 2 | `AUTH_SECRET` (`openssl rand -base64 32`) | Vercel | Sesiones |
| 3 | Credenciales **Google OAuth** (`GOOGLE_CLIENT_ID/SECRET`) con redirect `https://<dominio>/api/auth/callback/google` | Vercel | Ingreso con Google |
| 4 | **Resend**: `AUTH_RESEND_KEY` + dominio verificado en `EMAIL_FROM` | Vercel | Enlace mágico por correo |
| 5 | `OPENAI_API_KEY` (con límite de gasto mensual configurado en OpenAI) | Vercel | Asistente |
| 6 | Dominio y `NEXT_PUBLIC_SITE_URL` / `AUTH_URL` | Vercel | SEO, enlaces, webhooks, QR de invitación |
| 6b | `CRON_SECRET` (`openssl rand -hex 32`) | Vercel | Mantenimiento diario (retención de datos) |
| 7 | (Opcional) Mercado Pago: credenciales **de prueba** primero, luego producción + `MERCADOPAGO_WEBHOOK_SECRET` | Vercel | Cobro real de aportes |
| 8 | **Revisión legal** de `/privacidad` (Ley 25.326) y términos | — | Antes del lanzamiento público |
| 9 | **Consejo doctrinal**: aprobar contenido de `content/guided-path.ts` y `content/reading-plans.ts`, y las primeras entradas de la biblioteca curada | PR / panel `/admin/biblioteca` | Calidad pastoral |
| 10 | Confirmar recursos de crisis de Argentina (911, 135, 144, 137) con una fuente oficial vigente | `server/ai/safety.ts` | Flujo de crisis |

## 2. Pasos de despliegue (en orden)

1. Crear proyecto en Neon (región São Paulo, la más cercana a Argentina).
2. Variables de entorno en Vercel (tabla anterior). **Nunca** `DATABASE_DRIVER`
   ni `TEST_DATABASE_URL` en producción.
3. `npm run db:migrate` contra Neon (aplica 0000–0014).
4. `npm run db:seed` (planes y devocional base).
5. `npm run db:fetch-bible && npm run db:import-bible` (RVR1909, ~31 mil versículos).
6. Asignar el primer `platform_admin` (SQL único, documentar quién):
   `insert into user_roles (id, user_id, role, scope) values (gen_random_uuid(), '<id>', 'platform_admin', 'platform');`
7. Deploy en Vercel desde la rama aprobada.
8. Verificación post-deploy: `/api/health`, ingreso con Google y correo, leer un
   capítulo, recorrer una etapa, enviar un mensaje a la iglesia piloto, crear un
   evento como pastor, exportar datos.

### Rol de base de datos y RLS
La app usa el rol dueño de Neon (no superusuario). La migración 0008/0010 activa
`FORCE ROW LEVEL SECURITY` en todos los datos privados: aunque el código tuviera
un error, la base no devuelve filas ajenas. Verificado por
`tests/integration/rls.test.ts` (también en CI). **No usar un rol superusuario**:
los superusuarios ignoran la RLS.

## 3. Calidad verificada antes de lanzar

| Verificación | Resultado (22/11/2026) |
|---|---|
| `npm run typecheck` / `lint` | ✅ 0 errores |
| `npm test` (unitarias + integración con Postgres 16) | ✅ ver EVOLUCION |
| `npm run build` | ✅ |
| `npm run e2e` (app real + Postgres + navegador) | ✅ 25/25 pasos (incluye lectura sin conexión) |
| Migraciones 0000–0014 sobre base limpia | ✅ (driver pg). ⚠️ No probado contra Neon HTTP real |
| Mercado Pago | ⚠️ Solo con respuestas simuladas; falta sandbox |
| OpenAI real | ⚠️ No probado en este entorno (sin API key); flujo cubierto con proveedor simulado + `npm run eval` cuando haya key |

## 4. Monitoreo y recuperación
- **Logs**: Vercel (errores del asistente se registran sin contenido personal).
- **Salud**: `/api/health` para un monitor externo (UptimeRobot / Better Stack).
- **Costos de IA**: panel `/admin` (costo total y por usuario activo, % servido
  desde caché/biblioteca) + límite de gasto en OpenAI.
- **Backups**: Neon tiene recuperación a un punto en el tiempo (verificar la
  ventana del plan contratado). Ensayar una restauración antes del piloto.
- **Caída del proveedor de IA**: el asistente responde 502 con mensaje claro; la
  Biblia, el camino, los planes y el contacto pastoral siguen funcionando.

## 5. Preparación de la iglesia piloto
1. La iglesia completa `/iglesias/sumar`; el admin la verifica en
   `/admin/iglesias` (se otorga el rol al pastor automáticamente).
2. El pastor carga horarios y 2–3 eventos; comparte el enlace de su perfil.
3. Domingo de lanzamiento: el pastor proyecta o imprime el QR desde
   `/pastoral/invitar` (cartel A4 listo) e invita al plan «Esperanza en 7 días».
4. Miembros tocan «Soy parte de esta iglesia»; el pastor aprueba en `/pastoral/miembros`.
5. A las 2 y 4 semanas: entrevistas con la guía de `docs/09`, y lectura de las
   métricas agregadas (conexiones con la iglesia, etapas recorridas, costo IA).
