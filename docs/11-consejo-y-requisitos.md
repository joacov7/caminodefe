# 11. Consejo pastoral → requisitos funcionales

Reunión simulada del consejo pastoral y espiritual con producto y UX. Cada
conclusión termina en un requisito (RF) trazable. Lo que no resuelve una
necesidad real quedó afuera.

## 1. Voces del consejo

**Pastor principal (visión).** "La app no es el destino: es el camino hacia
Jesús y hacia una comunidad real. Si alguien usa la app un año y nunca pisa una
iglesia, fallamos." → El producto mide *conexiones con comunidad*, no minutos de
pantalla.

**Pastor evangelista (quien todavía no conoce a Jesús).** "Llegan por una
crisis, una pregunta o un amigo. No entienden el lenguaje de iglesia
('santificación', 'unción'). Necesitan una puerta sin vergüenza, sin registro
obligatorio, y una presentación clara del Evangelio." → Contenido inicial sin
cuenta; lenguaje llano; etapa "Quiero conocer a Jesús" pública.

**Pastor de formación.** "Crecer no es acumular lecturas. Es Palabra +
oración + comunidad + obediencia. Los planes deben tener objetivo, pasaje,
reflexión y una acción concreta." → Planes y etapas con estructura fija:
pasaje, explicación, pregunta, práctica.

**Pastor de jóvenes.** "Los jóvenes abandonan lo que se siente obligatorio o
infantil. Quieren autenticidad, breve, compartible, y pertenecer a algo." →
Formato corto, compartir por WhatsApp/Instagram, grupos cerrados (F4, posterior).

**Pastor de acompañamiento.** "La persona en crisis no necesita un chatbot:
necesita una persona. Y nadie debe sentir que lo que escribió en su diario lo
lee el pastor." → Crisis siempre derivada a humanos y sin límite de plan;
privacidad absoluta de diario y conversaciones.

**Pastor de iglesias.** "Al pastor le falta tiempo. Quiere saber quién vino por
primera vez, quién pidió oración y quién necesita seguimiento — en una sola
pantalla." → Panel pastoral con bandeja unificada (contactos, visitantes,
oración) y eventos.

**Consejo doctrinal.** "Interdenominacional no es relativista. Afirmamos lo
común evangélico (Escritura, Trinidad, salvación por gracia mediante la fe en
Cristo) y en lo secundario mostramos posturas con respeto y derivamos al pastor
local. Toda respuesta curada pasa por revisión humana." → Biblioteca curada con
aprobación; etiquetado texto/interpretación; declaración doctrinal de plataforma.

## 2. Necesidades por perfil

| Perfil | Necesidad central | Riesgo si no la cubrimos |
|---|---|---|
| Recién se acerca | Entender el Evangelio sin barreras | Se va en el primer minuto |
| Creyente activo | Constancia en la lectura, profundidad | App de una semana |
| Busca iglesia | Saber cuándo, dónde, cómo es y a quién hablar | No da el paso presencial |
| Pastor | Ver y acompañar a personas reales | No la recomienda desde el púlpito |
| Jóvenes | Brevedad, autenticidad, pertenencia | Indiferencia |

## 3. Del visitante a la comunidad (embudo pastoral)

1. **Descubre** (contenido público compartido, búsqueda, invitación de su iglesia).
2. **Explora** sin cuenta (Biblia, devocional, etapa 1 del camino).
3. **Se registra** para guardar su progreso (beneficio claro, no obligación).
4. **Camina** (camino guiado / plan de lectura con recordatorio).
5. **Se conecta** (encuentra iglesia, ve un evento, avisa "quiero visitar").
6. **Pertenece** (se vincula a la iglesia, grupo, oración, servicio).

**Contra el abandono:** recordatorio elegido por la persona (no impuesto),
progreso visible sin puntajes, "retomá donde dejaste" en el inicio, contenido
diario breve, y vínculo con su iglesia local (el lazo humano es lo que retiene).

## 4. Requisitos funcionales (MVP ampliado)

| ID | Requisito | Prioridad | Estado |
|---|---|---|---|
| RF-01 | Leer la Biblia completa (RVR1909) sin cuenta, también sin conexión para capítulos visitados | P0 | esta fase |
| RF-02 | Camino guiado de 10 etapas con pasaje, explicación, reflexión, práctica y opción de hablar con un pastor | P0 | esta fase |
| RF-03 | Progreso del camino y de planes privado, sin puntos ni rankings | P0 | esta fase |
| RF-04 | Planes de lectura de 7 y 30 días con progreso diario | P0 | esta fase |
| RF-05 | Recordatorio configurable (hora, días) exportable al calendario del teléfono | P1 | esta fase |
| RF-06 | Eventos de iglesia: listado público, detalle, agregar a calendario; gestión pastoral (crear/editar/borrar) | P0 | esta fase |
| RF-07 | Respuesta de crisis siempre disponible, sin límite de plan | P0 | esta fase |
| RF-08 | Biblioteca curada de respuestas aprobadas por revisores + caché por similitud con umbral conservador | P1 | esta fase |
| RF-09 | Rate limiting de endpoints sensibles; registro de auditoría de accesos administrativos | P0 | esta fase |
| RF-10 | Borrar mi cuenta y exportar mis datos | P0 | esta fase |
| RF-11 | Analítica agregada sin datos personales ni cookies de seguimiento | P1 | esta fase |
| RF-12 | PWA instalable con página sin conexión | P1 | esta fase |
| RF-13 | Páginas públicas indexables y compartibles (versículo, devocional, iglesia, evento) | P1 | esta fase |
| RF-14 | Pedido de oración con alcance elegido (privado / mi iglesia) | P1 | siguiente |
| RF-15 | "Quiero visitar" (formulario de primer visitante) a una iglesia | P1 | siguiente |
| RF-16 | Invitación de iglesia por enlace/QR | P1 | siguiente |
| RF-17 | Grupos cerrados moderados (F4) | P2 | posterior (requiere moderación) |

## 5. Principios que no se negocian

- Nada de métricas de "nivel espiritual", rachas punitivas ni competencia.
- La Biblia y la ayuda en crisis nunca están detrás de un pago ni de un límite.
- Lo privado (diario, notas, conversaciones, progreso, reflexiones) no lo ve
  nadie más. El pastor solo ve lo que la persona **le envía**.
- El asistente no es pastor, ni psicólogo, ni médico, y lo dice.
