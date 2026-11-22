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
