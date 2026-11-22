# 13. Plan estratégico: producto, arquitectura, negocio y crecimiento — Fase 2

## 1. Definición del producto

**Camino de Fe conecta a cada persona con Jesús, con la Biblia y con una
iglesia local, y le da a esa iglesia las herramientas para recibirla y
acompañarla.**

Cuatro superficies, un solo sistema de permisos (`server/authz`):

| Superficie | Usuario | Núcleo |
|---|---|---|
| App personal | Persona / fiel | Inicio, Biblia, Camino guiado, Planes, Asistente, Mi Camino, Iglesias, Eventos |
| Espacio de iglesia (público) | Visitante | Perfil, horarios, eventos, contacto, "quiero visitar" |
| Panel pastoral | Pastor / líder | Bandeja (contactos, oración, visitantes), eventos, contenidos, estadísticas agregadas |
| Administración | Equipo de plataforma | Verificación, contenidos, biblioteca curada, métricas, auditoría |

## 2. Priorización (orden de ejecución)

1. **Correcciones críticas** de la auditoría (crisis sin límite, costo de IA,
   recursos de ayuda, RLS en runtime para datos privados).
2. **Biblia completa** (sin texto no hay producto).
3. **Camino guiado v1** (diferencial principal).
4. **Planes de lectura + recordatorios** (retención).
5. **Eventos** (puente con la iglesia).
6. **Seguridad**: rate limiting, auditoría, borrado/exportación de datos.
7. **Caché/biblioteca curada del asistente** (costo y calidad).
8. **PWA + analítica respetuosa + SEO**.
9. **Rediseño visual** transversal.
10. Monetización real y lanzamiento (requieren credenciales/decisiones del PO).

## 3. Arquitectura (decisiones)

- Se mantiene el stack (Next.js App Router, Neon/Drizzle, Auth.js, OpenAI vía
  `LLMProvider`). No se agregan servicios externos nuevos en esta fase.
- **Contexto RLS por consulta** con `db.batch` (transaccional en Neon HTTP):
  `set_config('app.user_id', …, true)` + consultas, para los módulos privados.
- **Driver `pg` solo para desarrollo/CI** (`DATABASE_DRIVER=pg`) para pruebas
  de integración y E2E contra PostgreSQL local.
- **Rate limiting en Postgres** (ventana fija, tabla `rate_limits`, upsert
  atómico): sin Redis, suficiente para la escala del piloto; reemplazable por
  Upstash si crece.
- **Analítica propia agregada** (`analytics_daily`: evento + día + conteo), sin
  `userId`, sin IP, sin cookies → no requiere banner de consentimiento.
- **Caché del asistente** en dos capas: biblioteca curada (aprobación humana) y
  caché por similitud con umbral conservador; nunca para mensajes con señales
  personales o de crisis.
- **Contenido del camino guiado y planes versionado en el repo**
  (`content/`), revisable por el consejo doctrinal vía pull request; el
  progreso del usuario en DB (privado, con RLS).

## 4. Criterios de aceptación (nuevos)

- Camino: un usuario sin cuenta puede leer cualquier etapa; con cuenta, marcar
  pasos completos y retomar; nadie más ve su progreso ni sus reflexiones.
- Planes: al completar el día N, el inicio muestra el día N+1; el progreso
  sobrevive a recargas; el `.ics` importa un recordatorio diario válido (RFC 5545).
- Eventos: un pastor crea/edita/borra eventos **solo** de su iglesia (test de
  autorización); los públicos aparecen en `/eventos` y en el perfil.
- Crisis: con el cupo diario agotado, un mensaje de crisis recibe la respuesta
  de ayuda (test).
- Caché: una pregunta personal o de crisis **nunca** se sirve desde caché
  (test); una pregunta curada aprobada se sirve sin llamar al modelo (test).
- Rate limit: superar N solicitudes/ventana devuelve 429 (test).
- Borrado de cuenta: elimina datos personales en cascada (test SQL).

## 5. Modelo económico

**Principio:** la Palabra de Dios y la ayuda espiritual esencial no se venden.
Se cobra la *experiencia adicional* (individual) y las *herramientas de gestión*
(iglesias). Nunca se monetiza la vulnerabilidad: sin paywalls en crisis, sin
publicidad, sin vender datos.

### 5.1 Personas

| | Gratis (siempre) | Premium (hipótesis: ARS 2.000/mes, configurable) |
|---|---|---|
| Biblia, búsqueda de iglesias, eventos, contacto pastoral, crisis | ✅ ilimitado | ✅ |
| Camino guiado completo (10 etapas) | ✅ | ✅ |
| Planes de lectura | 7 y 30 días esenciales | + planes temáticos y especializados |
| Asistente | 15 consultas/día | 200/día, historial ampliado, estudios guiados |
| Mi Camino | notas, diario, favoritos | + exportaciones, organización por temas |

> Decisión del consejo: el **camino guiado completo es gratis** (es
> evangelización); el prompt original sugería "básico" gratis — se elevó.

### 5.2 Iglesias

| Nivel | Precio hipótesis | Para quién | Incluye |
|---|---|---|---|
| Gratuita | ARS 0 | Toda iglesia verificada | Perfil, horarios, eventos (hasta 10 activos), bandeja de contactos |
| Básica | ~ARS 15.000/mes | Iglesias de hasta 150 miembros | + contenidos propios, pedidos de oración, visitantes, estadísticas |
| Profesional | ~ARS 40.000/mes | Hasta 600 miembros | + grupos, comunicaciones, varios líderes con roles, camino asignado |
| Avanzada | a convenir | Redes de iglesias / denominaciones | Multi-sede, panel consolidado, soporte dedicado |

Becas: iglesias en zonas vulnerables o plantaciones → nivel Básico gratis
(financiado por donaciones "misión").

### 5.3 Donaciones y otros ingresos

- Donación voluntaria a la plataforma (ya implementada, sin cobro real aún).
- Campañas: "Financiá un plan de lectura", "Llevá Camino de Fe a una iglesia".
- Cursos bíblicos con certificado (contenido propio o con licencia), eventos y
  conferencias, servicios tecnológicos (web para iglesias).
- **Fondos separados** por destino (plataforma / iglesia / misión), con
  trazabilidad — ya modelado en `contributions`.

### 5.4 Costos unitarios (estimación, verificar al contratar)

| Concepto | Supuesto | Costo |
|---|---|---|
| Consulta de IA (gpt-4o-mini) | ~1.500 tokens entrada + 400 salida a US$0,15 / US$0,60 por millón | **≈ US$0,0005** por consulta |
| Caché/biblioteca | 30–50 % de aciertos esperados en preguntas frecuentes | reduce el costo anterior en igual proporción |
| Infraestructura base | Vercel Pro + Neon pago + Resend | ≈ US$60–80/mes hasta ~10k usuarios activos |
| Correo transaccional | enlace mágico | incluido en plan inicial de Resend hasta su cupo |

Precios de OpenAI/Vercel/Neon/Resend: **referencia pública a confirmar** en el
momento de contratar.

### 5.5 Proyección Argentina (24 meses, escenario base)

Supuestos explícitos: tipo de cambio paramétrico **T** ARS/USD; 3 % de usuarios
activos pasan a Premium; 15 % de iglesias activas pagan algún nivel; donación
media del 1 % de usuarios activos.

| Hito | Iglesias | Usuarios activos/mes | Costo mensual (USD) | Ingreso mensual (ARS) |
|---|---|---|---|---|
| Mes 3 (piloto) | 1–3 | 300 | ~80 (IA ≈ US$5) | donaciones simbólicas |
| Mes 12 | 40 | 6.000 | ~150 (IA ≈ US$60) | Premium 180×2.000 = 360k + iglesias 6×15k = 90k + donaciones |
| Mes 24 | 200 | 30.000 | ~500 (IA ≈ US$300) | Premium 900×2.000 = 1,8 M + iglesias 30×~25k = 750k + donaciones |

Lectura: la IA no es el costo dominante si se usa caché; el riesgo real es el
**costo de soporte y verificación de iglesias** (horas humanas). Punto de
equilibrio operativo (infra) alcanzable hacia el mes 9–12; financiar equipo
requiere donaciones/alianzas institucionales al principio.

### 5.6 Expansión internacional

1. Argentina (piloto, Ley 25.326).
2. Hispanohablantes: Uruguay, Paraguay, Chile, México, Colombia — mismo idioma,
   recursos de crisis por país (estructura ya preparada), precios en moneda
   local o USD.
3. Hispanos en EE. UU. y España (GDPR).
4. Portugués (Brasil) con i18n de interfaz; la traducción bíblica de dominio
   público en portugués es "Almeida" (verificar edición).

## 6. Crecimiento

- **La iglesia es el canal.** Programa de incorporación: verificación →
  perfil → QR en el culto → código/enlace de invitación → plan de 7 días que el
  pastor anuncia el domingo.
- **Contenido compartible**: versículo/devocional con página pública y vista
  previa para WhatsApp (Open Graph). Cada página compartida lleva a la app.
- **SEO**: páginas públicas indexables de cada capítulo bíblico, cada iglesia
  verificada y cada evento público; `sitemap.xml` y `robots.txt`.
- **Campañas estacionales**: Año Nuevo (plan de 30 días), Semana Santa,
  Navidad — momentos de pico ya observados en el mercado.
- **Medición**: analítica agregada (instalaciones, lecturas, etapas iniciadas,
  contactos a pastores, visitas a iglesias). Métrica norte: **personas
  conectadas con una iglesia local por mes**.
- **Respeto**: sin notificaciones no solicitadas, sin compra de datos, sin
  "dark patterns".
