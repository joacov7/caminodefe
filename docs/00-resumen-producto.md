# A. Resumen del producto

## A.1. Qué es

**Camino de Fe** es una aplicación web progresiva (PWA), pensada mobile-first y
con camino claro hacia app móvil, que acerca la Palabra de Dios a las personas
todos los días y las conecta con la iglesia local. Su núcleo es un **asistente
bíblico de IA** con recuperación de fuentes autorizadas (RAG), acompañado de
lectura bíblica, devocionales, estudios, oración, un espacio personal privado
("Mi Camino") y un módulo de iglesias con panel pastoral.

Es un producto **SaaS multi-tenant**: una plataforma pública para personas y, a
la vez, una red de iglesias y ministerios que la usan como herramienta a su
servicio.

## A.2. Visión central

> "Acercar la Palabra de Dios a las personas todos los días y conectarlas con la
> iglesia local, sin reemplazar al pastor, la congregación ni la relación humana."

## A.3. Propuestas de valor

**Para la persona**
- Entender la Biblia en lenguaje natural, con respuestas claras que distinguen
  texto bíblico, interpretación y aplicación práctica.
- Hábitos saludables de lectura y estudio, sin presión ni culpa.
- Un espacio personal privado para notas, diario y progreso.
- Un puente respetuoso hacia una iglesia local cuando la persona lo desea.

**Para la iglesia / el pastor**
- Mayor alcance digital y un canal de comunicación con sus miembros.
- Publicación de contenido autorizado, agenda de eventos y gestión de
  solicitudes de contacto/oración.
- Herramientas de acompañamiento respetuosas con la privacidad, con datos
  operativos agregados (nunca vigilancia ni "perfiles espirituales").
- Independencia doctrinal: cada iglesia configura su declaración de fe.

**Para la plataforma**
- Suscripción Premium que amplía valor real (no que bloquea lo esencial).
- Colaboraciones/donaciones transparentes con fondos separados por destinatario.

## A.4. Usuarios y roles

| Rol | Descripción resumida |
|-----|----------------------|
| A. Visitante | Sin registro; acceso limitado de solo lectura. |
| B. Usuario registrado | Cuenta gratuita; asistente con límites, "Mi Camino". |
| C. Usuario Premium | Límites ampliados, estudios personalizados, contenido premium. |
| D. Pastor | Verificado; responde/atiende, publica contenido de su iglesia. |
| E. Líder de iglesia | Permisos operativos delegados por el administrador de iglesia. |
| F. Administrador de iglesia | Configura la iglesia, gestiona roles y responsables. |
| G. Administrador de plataforma | Operación global, verificaciones, soporte. |
| H. Moderador de contenido | Modera contenido de comunidad y respuestas reportadas. |
| I. Responsable financiero autorizado | Ve/gestiona reportes de aportes (permiso separado). |

Reglas clave:
- Nadie es pastor por auto-declararse: **verificación administrativa** con
  estados `pendiente / verificado / rechazado / suspendido`.
- Un usuario puede pertenecer a **una o varias iglesias** según reglas de
  vinculación con consentimiento.
- **Autorización en el servidor** (y RLS en base de datos), nunca solo ocultando
  UI.

## A.5. Principios pastorales y éticos (requisitos funcionales)

1. **La IA no reemplaza al pastor.** Se presenta como herramienta de orientación
   y estudio. No afirma ser Dios, Jesús, el Espíritu Santo, profeta ni autoridad
   espiritual; no reclama revelaciones. Distingue siempre: *texto bíblico ·
   interpretación · aplicación · recomendación de hablar con una persona.*
2. **Interdenominacional.** Ante temas doctrinalmente controvertidos, reconoce
   distintas interpretaciones, las presenta con respeto, cita base bíblica cuando
   corresponde y sugiere conversar con un pastor de confianza. La declaración de
   fe y materiales doctrinales son **configurables por la organización**.
3. **Conexión con la iglesia**, siempre respetuosa, no insistente y sin
   "evaluación espiritual secreta".
4. **Protección de las personas.** Sin diagnósticos médicos/psicológicos/
   espirituales. Ante riesgo, violencia, abuso, autolesiones o crisis: empatía,
   priorizar la seguridad, derivar a ayuda humana y recursos de emergencia del
   país; nunca sustituir servicios profesionales.
5. **Sin manipulación.** Prohibido usar culpa, miedo al castigo divino, presión
   emocional o falsas promesas para vender suscripciones o recibir donaciones.
6. **Privacidad por diseño.** Notas, diario, oraciones y conversaciones privadas
   no son visibles para pastores/administradores por defecto; no se construyen
   perfiles de vulnerabilidad con fines comerciales.

## A.6. Alcance geográfico inicial

Público hispanohablante, con **Argentina como primer mercado** (referencia de
precio ARS, medios de pago tipo Mercado Pago). La arquitectura debe soportar
multi-moneda y multi-país sin acoplarse a un único proveedor de pagos.

## A.7. Métricas de éxito (resumen)

Producto: usuarios activos, retención, uso del asistente, finalización de planes,
conversión y cancelación de Premium, **coste de IA por usuario**, errores
técnicos. Pastorales: iglesias activas, contenidos publicados, eventos,
solicitudes respondidas, participación voluntaria.

> El tiempo de permanencia **no** es la métrica de éxito, y **nunca** se
> presentan métricas como evaluación de la espiritualidad de personas o pastores.
