# B. Análisis de oportunidades y riesgos

## B.1. Oportunidades

1. **Mercado hispanohablante amplio y subatendido** en apps cristianas de
   calidad con IA en español, con orientación pastoral responsable.
2. **Diferenciador ético/pastoral**: un asistente que *no* pretende reemplazar al
   pastor y que es transparente sobre interpretación vs. texto puede ganar la
   confianza de iglesias que desconfían de la IA.
3. **Canal de adopción B2B2C**: cada iglesia que se suma trae a su congregación;
   el crecimiento se apalanca en comunidades existentes (bajo CAC).
4. **Multi-tenant configurable** permite ofrecer la plataforma a redes de
   iglesias y ministerios sin reconstruir el producto.
5. **Monetización múltiple y sana**: suscripción Premium por valor real +
   colaboraciones transparentes, sin depender de publicidad basada en datos
   sensibles.

## B.2. Mapa de riesgos

Severidad: 🔴 alta · 🟠 media · 🟡 baja. Prob.: probabilidad.

### Riesgos pastorales / doctrinales
| # | Riesgo | Sev. | Mitigación |
|---|--------|------|------------|
| P1 | La IA **inventa citas** bíblicas o las cita mal ("alucinación"). | 🔴 | RAG con corpus autorizado; verificación de referencias contra la traducción; no afirmar respaldo si la cita no se verifica; batería de evaluación. |
| P2 | La IA hace **afirmaciones doctrinales excesivas** o toma partido en debates denominacionales. | 🔴 | Prompt de sistema interdenominacional; reconocer diferencias; presentar perspectivas; derivar a pastor; evaluación con preguntas controvertidas. |
| P3 | La IA se **presenta como autoridad espiritual** o reclama revelación. | 🔴 | Guardarraíles en el prompt y filtros de salida; disclaimers persistentes en la UI. |
| P4 | **Rechazo de iglesias** que ven la IA como amenaza al rol pastoral. | 🟠 | Mensaje "no reemplaza a la iglesia"; control doctrinal en manos de la iglesia; panel pastoral que aporta valor. |
| P5 | Contenido generado por IA **presentado como enseñanza humana**. | 🟠 | Etiquetado obligatorio: *generado por IA / revisado por persona / aprobado por iglesia*. |

### Riesgos de protección de personas (seguridad del usuario)
| # | Riesgo | Sev. | Mitigación |
|---|--------|------|------------|
| S1 | Usuario en **crisis** (autolesión, abuso, violencia) recibe respuesta inadecuada. | 🔴 | Detección de señales de riesgo → respuesta empática + recursos de emergencia locales + derivación humana; nunca diagnosticar; pruebas específicas del flujo de crisis. |
| S2 | La app da consejo **médico/psicológico** como certeza espiritual. | 🔴 | Filtros y prompt: no diagnósticos; recomendar profesionales. |
| S3 | **Manipulación emocional** para monetizar. | 🟠 | Prohibido por diseño; revisión de copy; sin culpa/urgencias falsas. |

### Riesgos técnicos
| # | Riesgo | Sev. | Mitigación |
|---|--------|------|------------|
| T1 | **Costo de IA** por usuario se dispara. | 🔴 | Límites por plan; caché de respuestas frecuentes; modelos por tarea; métrica de coste/usuario; rate limiting. |
| T2 | **Fuga de datos entre tenants** (iglesia A ve datos de iglesia B). | 🔴 | RLS en Postgres + autorización en backend + pruebas de autorización automatizadas. |
| T3 | **Exposición de datos sensibles** (oración, diario, conversaciones) a terceros o a la propia iglesia. | 🔴 | Minimización de datos enviados al proveedor de IA; privacidad por defecto; cifrado; auditoría de accesos administrativos. |
| T4 | **Caída/errores del proveedor de IA**. | 🟠 | Capa de abstracción del proveedor; manejo de errores y degradación elegante; reintentos con límite. |
| T5 | **Abuso / uso automatizado** del asistente. | 🟠 | Autenticación, rate limiting, detección de abuso, límites por plan. |

### Riesgos legales / de contenido
| # | Riesgo | Sev. | Mitigación |
|---|--------|------|------------|
| L1 | Uso de **traducciones bíblicas con derechos de autor** sin licencia. | 🔴 | Empezar con traducciones de dominio público / licencia abierta (ver H). No redistribuir traducciones protegidas sin autorización. |
| L2 | **Pagos, diezmos y donaciones** sin marco jurídico/contable. | 🔴 | No implementar descuentos automáticos de diezmos; separar fondos; abstracción de pagos; revisión legal/contable antes de Fase 5. |
| L3 | **Protección de datos personales** (Argentina Ley 25.326 y equivalentes). | 🟠 | Consentimientos, política de retención/eliminación, base legal, minimización. |
| L4 | **Suplantación de pastores/iglesias**. | 🟠 | Verificación administrativa con estados; moderación; auditoría. |

### Riesgos de producto / negocio
| # | Riesgo | Sev. | Mitigación |
|---|--------|------|------------|
| N1 | **Baja disposición a pagar** ARS 2.000/mes. | 🟠 | Validar en Fase 3; precio/moneda/beneficios configurables; no bloquear lo esencial. |
| N2 | **Adopción lenta** de iglesias. | 🟠 | Onboarding simple; página "por qué participar"; foco en pocas iglesias piloto. |
| N3 | **Sobre-construcción** (red social completa, pagos, móvil nativo) antes de validar. | 🟠 | Alcance MVP estricto; fases; comunidad y pagos diferidos. |

## B.3. Decisiones que requieren tu confirmación antes de implementar

Se detallan en el documento **H (preguntas abiertas)**. Las más bloqueantes:
traducción(es) bíblica(s) con licencia, proveedor de IA, y el alcance exacto del
MVP (¿incluye módulo de iglesias de solo lectura o no?).
