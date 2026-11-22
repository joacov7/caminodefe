# 15. Política técnica de datos: consentimiento, conservación y eliminación

Marco: Ley 25.326 (Argentina). Este documento describe lo que **el sistema hace
hoy**; la política pública está en `/privacidad` (borrador sujeto a revisión legal).

## Clasificación

| Clase | Datos | Quién accede | Protección |
|---|---|---|---|
| Privado personal | conversaciones, mensajes, citas, notas, diario, favoritos, progreso del camino y reflexiones, días de planes, recordatorios | **Solo la persona** | Filtro por `userId` en servidor + `FORCE RLS` (0008, 0010) + `withUserContext` |
| Compartido por decisión de la persona | mensajes a una iglesia, solicitud de membresía (nombre y correo) | Equipo pastoral de **esa** iglesia | `can()` por iglesia; roles válidos solo con iglesia verificada |
| Operativo | iglesias, eventos, horarios, contenidos publicados | Público / gestores | Escritura con `can()` + auditoría |
| Técnico sin contenido | `ai_usage` (tokens, costo), `rate_limits` (claves hasheadas), `audit_log` | Admin | Sin texto del usuario; IP nunca en claro |
| Anónimo agregado | `analytics_daily` (evento + día + conteo) | Admin | Sin identificadores ni cookies |

## Consentimiento
- No se usan cookies de seguimiento ni analítica de terceros → no hace falta
  banner. Única cookie: la de sesión (estrictamente necesaria).
- Compartir con una iglesia es siempre un acto explícito (botón + texto que dice
  quién recibe el dato).
- El asistente envía la pregunta a OpenAI: se informa en `/privacidad`.

## Conservación
- Datos personales: mientras exista la cuenta.
- Conversaciones borradas por la persona: borrado lógico inmediato (no se
  muestran ni se usan). **Pendiente:** purga física programada a 30 días.
- `rate_limits`: limpieza oportunista de ventanas > 24 h.
- Caché del asistente: solo preguntas generales sin datos personales; invalidable.

## Eliminación y portabilidad
- **Exportar**: `GET /api/cuenta/exportar` (JSON con todo lo propio).
- **Eliminar cuenta**: Perfil → Privacidad (confirmación escrita). Borrado en
  cascada de todos los datos personales (probado en integración y E2E). Queda un
  registro de auditoría `account.delete` sin datos personales.
- **Aportes económicos**: hoy se borran con la cuenta (no hay cobro real). Con
  cobro real habrá que conservar los comprobantes el plazo que exija la
  normativa contable, desvinculados de los datos personales que no sean
  necesarios — **decisión legal pendiente antes de activar Mercado Pago**.

## Menores
Plataforma pensada para mayores de 13 años. La sección de niños (backlog) no
usará IA en vivo y requerirá consentimiento de un adulto (docs/06).
