# Evolución del proyecto — documento central

Registro cronológico de fases, decisiones, entregas y pendientes. Cada entrada
indica qué se verificó realmente (no se marca como hecho lo que no se probó).

## Índice de entregables

| Doc | Contenido |
|---|---|
| `00`–`07`, `09` | Fase 0: producto, riesgos, MVP, arquitectura, datos, pantallas, plan, preguntas, validación |
| `10-auditoria.md` | Auditoría integral (Fase 1) |
| `11-consejo-y-requisitos.md` | Consejo pastoral → requisitos funcionales |
| `12-mercado-y-competencia.md` | Investigación de mercado con fuentes |
| `13-estrategia-producto-y-negocio.md` | Plan estratégico, arquitectura, monetización, crecimiento |
| `14-lanzamiento.md` | Checklist de producción y credenciales necesarias |

---

## Fase 1 — Auditoría (22/11/2026)

- **Analizado:** todo el repositorio; migraciones aplicadas en PostgreSQL 16
  real; RLS probada con rol sin privilegios.
- **Hallazgos críticos:** RLS inactiva en runtime; crisis bloqueada por límite
  de plan; Biblia sin texto; costo de IA no medido. Detalle en `docs/10`.
- **Pruebas:** typecheck ✅, lint ✅, 51/51 tests ✅.

## Fase 2 — Plan estratégico (22/11/2026)

- **Decidido:** orden de ejecución, arquitectura (RLS por `db.batch`, rate
  limiting en Postgres, analítica agregada propia, caché en dos capas),
  modelo económico (camino guiado completo gratis; Premium = experiencia; planes
  de iglesia por tamaño), estrategia de crecimiento centrada en la iglesia.
- **Fuentes de mercado** documentadas en `docs/12`.

## Fase 3 — Finalización del MVP (22/11/2026)

| Módulo | Estado | Verificación |
|---|---|---|
| **RLS activa en runtime** (`withUserContext` + `FORCE RLS` 0008/0010) | ✅ | integración (Postgres 16 real, rol no superusuario) |
| **Biblia RVR1909 completa** (eBible.org, dominio público; 66 libros, 31.084 versículos) | ✅ | importada y leída en E2E |
| **Eventos**: agenda pública, detalle, `.ics`, gestión pastoral, visibilidad de miembros, moderación admin | ✅ | unit + E2E |
| **Planes de lectura** 7 y 30 días con progreso y recordatorio `.ics` | ✅ | unit + E2E |
| **Caché del asistente**: biblioteca curada (cuatro ojos) + similitud (trigramas + coseno ≥ 0,93) | ✅ | unit + integración. ⚠️ Embeddings reales no probados (sin API key) |
| **Seguridad**: rate limiting atómico, auditoría ampliada, exportar/eliminar cuenta, cabeceras HTTP | ✅ | integración + E2E |
| **PWA**: íconos, service worker que no guarda páginas personales, página sin conexión | ✅ | build + E2E (manifest). ⚠️ Lectura offline verificada solo por diseño, no con prueba automatizada |
| **Analítica** agregada sin datos personales + panel admin | ✅ | integración |
| **Alta de iglesias y membresía** (hueco detectado en la auditoría) | ✅ | E2E |

**Defectos corregidos:** crisis bloqueada por cupo; RLS inactiva; costo IA en 0;
recursos de crisis incompletos; eventos de miembros invisibles para miembros;
contacto a iglesias no verificadas; roles pastorales válidos con iglesia sin
verificar; sesión de Auth.js atada al driver HTTP; `id` duplicados (accesibilidad);
prefetch de descargas; separadores faltantes en migraciones RLS (riesgo de
despliegue en Neon).

## Fase 4 — Diferenciación (22/11/2026)

- **Camino guiado v1**: 10 etapas con texto bíblico real, explicación, reflexión
  privada, práctica y derivación a un pastor. Contenido versionado y validado
  contra la RVR1909 (`tests/content.curated.test.ts`); prueba automática que
  impide lenguaje de puntajes o competencia.
- **Asistente**: RAG temático (texto completo en español), memoria leída de la
  base (el cliente no puede inyectar turnos), detección de ambigüedad, aviso de
  citas no verificadas, origen visible de la respuesta.
- **Herramientas pastorales**: bandeja, eventos, miembros (aprobación), plan.
- **Rediseño** completo: identidad v2 (Fraunces + Plus Jakarta Sans, verde pino y
  ámbar de amanecer), navegación de 5 destinos en móvil, componentes unificados.
  Capturas en `docs/capturas/`.

## Fase 5 — Monetización (22/11/2026)

- Planes de iglesia (Gratuita / Básica / Profesional / Avanzada) con límites
  aplicados en servidor y asignación por admin (también becas).
- **Mercado Pago Checkout Pro** sin SDK: preferencia con idempotencia, webhook
  que re-consulta el pago y valida monto/moneda y firma HMAC. ⚠️ **Probado solo
  con respuestas simuladas**; desactivado hasta cargar credenciales de prueba.
- Solo los aportes a la plataforma usan cobro real; iglesias y misiones siguen
  como registro pendiente (fondos separados por diseño).

## Fase 6 — Lanzamiento (preparado, no ejecutado)

- Checklist de producción y lo que se necesita del PO: `docs/14-lanzamiento.md`.
- Política técnica de datos: `docs/15-datos-y-privacidad.md`.
- CI: typecheck, lint, tests con Postgres 16, build y E2E con navegador.

### Pruebas al cierre
- `npm run typecheck` ✅ · `npm run lint` ✅ · `npm run build` ✅
- `npm test`: **108/108** (17 archivos; incluye integración con Postgres real)
- `npm run e2e`: **20/20** pasos contra la app real

### Riesgos y pendientes (al cierre de la Fase 6; ver actualización en Fase 7)
1. Migraciones y RLS no probadas aún contra **Neon** real (sí contra PG16).
2. **OpenAI** y **Mercado Pago** sin prueba real (faltan credenciales).
3. ~~Purga física de conversaciones borradas~~ → resuelto en Fase 7.
4. Notificaciones push (hoy recordatorio vía calendario).
5. ~~Pedidos de oración~~ → resuelto en Fase 7. Grupos (F4) requieren
   herramientas de moderación antes de abrir.
6. Revisión legal y doctrinal del contenido antes del lanzamiento público.

## Fase 7 — Comunidad y crecimiento (22/11/2026)

| Entrega | Estado | Verificación |
|---|---|---|
| **Pedidos de oración** (RF-14): privados o compartidos con el equipo pastoral de una iglesia verificada de la que se es miembro; opción **sin mi nombre**; «Estamos orando»; «Dios respondió» con testimonio privado; incluidos en la exportación de datos | ✅ | integración (5 casos de acceso con RLS **compartida**, trigger que impide al pastor editar) + E2E |
| **Invitación de iglesia** (RF-16): enlace corto `/i/<iglesia>`, QR en SVG (descargable y cartel A4 imprimible), bienvenida al llegar, conteo anónimo de aperturas | ✅ | unit + **QR decodificado con OpenCV** + E2E |
| **Retención**: purga diaria de conversaciones borradas > 30 días, sesiones/tokens vencidos | ✅ | integración (no toca conversaciones activas ni recientes) |
| **Sin conexión**: prueba automática de lectura bíblica offline | ✅ | E2E |

**Defectos encontrados y corregidos en esta fase**
- Sin conexión, abrir una página no guardada mostraba «Application error»: el
  service worker servía HTML de Next bajo otra URL. Ahora usa una página
  estática (`public/offline.html`). Se eliminó la ruta `/sin-conexion` (reemplazada).
- Formulario de oración: si se escribía un segundo pedido mientras se guardaba
  el primero, el texto nuevo se borraba.
- Postgres exige política de lectura para `DELETE … RETURNING`: se agregó una
  política acotada solo a conversaciones vencidas en modo mantenimiento (0014).

**Dependencia nueva:** `qrcode-generator@2.0.4` (MIT, sin dependencias) para el QR.

### Pruebas al cierre de la Fase 7
- typecheck ✅ · lint ✅ · build ✅
- `npm test`: **121/121** (20 archivos, con integración en Postgres real)
- `npm run e2e`: **25/25**

### Próximos pasos sugeridos
1. Desplegar en Vercel + Neon con la iglesia piloto (checklist `docs/14`).
2. Probar OpenAI real y correr `npm run eval`; cargar las primeras 20–30
   respuestas de la biblioteca curada con el consejo.
3. Mercado Pago en sandbox.
4. Notificaciones push opt-in (Web Push) para recordatorios y «tu iglesia está
   orando», con costos y consentimiento definidos.
5. Herramientas de moderación → recién entonces grupos (F4).
