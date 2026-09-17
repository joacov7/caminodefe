# C. Definición del MVP mínimo viable

## C.1. Objetivo del MVP

Validar **con usuarios reales** las dos hipótesis centrales:

1. Las personas encuentran **valor recurrente** en un asistente bíblico de IA
   responsable + lectura + devocionales.
2. Las iglesias ven valor en tener **presencia y contenido** en la plataforma.

Todo lo que no sirva directamente a validar esto queda **fuera** del MVP.

## C.2. Alcance INCLUIDO en el MVP

### Cuentas y roles
- Registro / inicio de sesión (email + OAuth), verificación de email.
- Roles base: visitante, usuario registrado, usuario premium, admin de
  plataforma. Roles de iglesia (pastor/líder/admin de iglesia) con **verificación
  manual** por el admin de plataforma.
- Autorización en backend + RLS.

### Asistente IA bíblico (núcleo)
- Chat en lenguaje natural (español) con streaming de respuesta.
- Respuestas que **distinguen** texto bíblico / interpretación / aplicación /
  recomendación de hablar con un pastor.
- **RAG** sobre: traducción(es) bíblica(s) con licencia adecuada + declaración de
  fe configurable + materiales autorizados iniciales.
- Sistema de citas con referencias verificables; no afirmar respaldo si no se
  verifica la cita.
- Filtros de seguridad (crisis, no-diagnóstico, guardarraíles de identidad) y
  disclaimers.
- Historial de conversaciones, eliminación, reporte de respuesta problemática,
  feedback (👍/👎), **límites de uso por plan**, manejo de errores del proveedor,
  rate limiting.

### Biblia
- Lector bíblico (libro/capítulo/versículo) de la(s) traducción(es) licenciada(s).
- "Versículo del día"; continuar lectura; enlace desde citas del asistente.

### Mi Camino (espacio personal privado)
- Favoritos, notas personales, temas guardados, progreso de lectura básico.
- Controles de privacidad; **nada visible a la iglesia por defecto**.

### Contenidos: devocionales y estudios (lectura)
- Devocional diario y algunos estudios/planes iniciales (7/30 días).
- Etiquetado de origen: *generado por IA / revisado por persona / aprobado por
  iglesia*. Flujo editorial mínimo (borrador→revisión→aprobado→publicado) para
  el equipo de plataforma.

### Iglesias (perfil de solo lectura + contacto)
- **Perfil público** de iglesia (nombre, descripción, declaración doctrinal,
  ubicación general, horarios, contacto, redes, eventos).
- Directorio/descubrimiento básico de iglesias.
- Función **"Contactar a un pastor"**: solicitud voluntaria con motivo general,
  información de quién la recibe, expectativa de respuesta, estado y posibilidad
  de retirarla.
- Panel pastoral **mínimo**: editar perfil de la iglesia, publicar contenido
  autorizado, agenda de eventos, gestionar solicitudes de contacto. Datos
  agregados básicos.

### Suscripción Premium (preliminar)
- Definición de planes (gratuito/premium) con **límites configurables**.
- Estado de suscripción y diferenciación de límites de IA.
- **En el MVP puede simularse el estado Premium sin cobro real** para validar la
  propuesta antes de integrar pagos (ver H). No bloquear ayuda de emergencia ni
  recursos gratuitos.

### Plataforma / calidad
- PWA instalable, mobile-first, modos claro/oscuro, accesibilidad AA.
- Estados de carga/vacío/error; manejo de conexión inestable.
- Analítica esencial respetuosa con la privacidad + métrica de coste de IA.
- Seguridad base: validación de entradas, rate limiting, gestión de sesiones,
  auditoría de accesos administrativos, política de eliminación de datos.

## C.3. Alcance EXCLUIDO del MVP (diferido)

- **Pagos reales / diezmos / colaboraciones / comprobantes** (Fase 5; requiere
  marco legal/contable y proveedor de pagos). El MVP solo modela el estado de
  suscripción.
- **Comunidad / red social** (grupos, muro, testimonios públicos, mensajería):
  requiere moderación robusta antes de abrir. (Fase 4+).
- **"Preguntar a un pastor"** con respuestas públicas moderadas, consultas en
  vivo, horarios de atención (Fase 4).
- **App móvil nativa** (Capacitor/React Native): la PWA cubre el MVP (Fase 6).
- **Multi-iglesia avanzado**, roles internos ricos, reportes financieros.
- **Moderación de contenido de comunidad** a gran escala.

## C.4. Criterios de "listo" del MVP (alto nivel)

- Un usuario puede registrarse, chatear con el asistente dentro de sus límites,
  leer la Biblia, guardar notas privadas y encontrar/contactar una iglesia.
- El asistente pasa la **batería de evaluación** mínima (citas correctas,
  manejo de temas controvertidos, flujo de crisis, guardarraíles de identidad)
  con umbrales acordados.
- Una iglesia verificada puede publicar su perfil, contenido y eventos, y ver/
  responder solicitudes de contacto.
- RLS y pruebas de autorización garantizan aislamiento entre tenants y privacidad
  de datos personales.
- Métricas y coste de IA por usuario son observables.

Los criterios de aceptación detallados por historia están en el documento **G**.
