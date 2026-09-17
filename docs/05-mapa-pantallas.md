# F. Mapa de navegación y pantallas

## F.1. Navegación principal (móvil: tab bar / web: barra)

```
[ Inicio ] [ Asistente ] [ Biblia ] [ Mi Camino ] [ Iglesias ] [ Perfil ]
```

La navegación podrá ajustarse tras validar con prototipos y pruebas de usuario.

## F.2. Árbol de pantallas (MVP)

```
Público / Onboarding
├─ Landing / bienvenida
├─ Registro / Inicio de sesión / Recuperar contraseña
├─ Verificación de email
└─ Onboarding (preferencias, tema, ¿tenés iglesia?)

1. INICIO
├─ Saludo personalizable
├─ Versículo / lectura del día
├─ Acceso rápido al Asistente
├─ Continuar lectura
├─ Recomendaciones de contenido
├─ Próximas actividades de la iglesia elegida
└─ Acceso a oración

2. ASISTENTE IA
├─ Chat (input natural, streaming, disclaimers)
├─ Respuesta con secciones: texto bíblico / interpretación / aplicación / "hablá con un pastor"
├─ Acciones por mensaje: citar/abrir referencia, feedback 👍/👎, reportar
├─ Historial de conversaciones (listar, abrir, eliminar)
├─ Indicador de límite de uso del plan
└─ Estados: cargando, error del proveedor, límite alcanzado, modo crisis (recursos)

3. BIBLIA
├─ Selector libro / capítulo / versículo
├─ Lector (tipografía cómoda, modo claro/oscuro)
├─ Acciones: favorito, nota, "preguntar al asistente sobre este pasaje"
└─ Versión bíblica (según licencia disponible)

4. MI CAMINO (privado)
├─ Resumen de progreso (lectura / planes)
├─ Planes de lectura activos
├─ Favoritos
├─ Notas personales
├─ Diario espiritual
├─ Temas guardados
├─ Recordatorios configurables
└─ Configuración de privacidad (qué comparto con mi iglesia)

5. IGLESIAS
├─ Descubrir / buscar iglesias
├─ Perfil de iglesia (descripción, doctrina, horarios, contacto, eventos, contenido)
├─ "Contactar a un pastor" (motivo, quién lo recibe, expectativa, enviar/retirar)
├─ Estado de mis solicitudes de contacto
└─ Vincularme a una iglesia (con consentimiento)

6. PERFIL
├─ Datos de cuenta
├─ Suscripción (plan actual, beneficios, límites) [sin cobro real en MVP]
├─ Privacidad y consentimientos
├─ Notificaciones / recordatorios
├─ Eliminar historial / datos
└─ Cerrar sesión

CONTENIDOS (transversal)
├─ Devocional del día
├─ Lista de estudios / planes (7 / 30 días)
└─ Detalle de estudio (con etiqueta de origen: IA / persona / iglesia)

PANEL PASTORAL (rol verificado)  → /pastoral
├─ Resumen (datos agregados, sin datos privados de miembros)
├─ Perfil de la iglesia (editar)
├─ Contenido (crear/publicar devocionales y estudios autorizados)
├─ Eventos (agenda)
├─ Solicitudes de contacto (bandeja, estado, responder canal autorizado)
└─ Solicitudes de oración (según consentimiento)

ADMIN DE PLATAFORMA  → /admin
├─ Verificación de iglesias/pastores (pendiente/verificado/rechazado/suspendido)
├─ Moderación de contenido reportado
├─ Gestión de planes y límites
├─ Métricas (uso, retención, coste de IA, errores) — datos agregados
└─ Auditoría de accesos sensibles
```

## F.3. Estados y accesibilidad (aplican a todas las pantallas)
- Estados de **carga**, **vacío** y **error** con mensajes comprensibles.
- Manejo de **conexión inestable** (PWA / service worker).
- Accesibilidad **AA**: contraste, foco visible, navegación por teclado, roles
  ARIA, tamaños táctiles, texto escalable.
- **Modo claro/oscuro**; mobile-first.

## F.4. Identidad visual (propuesta, a validar en diseño)
- Tono: moderno, cálido, espiritual sin recargar, profesional, legible para
  distintas edades. Ni comercial agresivo ni gamificado.
- Paleta base sugerida: tonos tierra/oliva o azul sereno + acento cálido, con
  variantes para modo oscuro. (Se definirá en la Fase 1 de diseño; no copiar
  identidades protegidas de otras apps.)
