# Seguridad

## Reporte de vulnerabilidades
Si encontrás un problema de seguridad, reportalo de forma privada al equipo
responsable antes de divulgarlo públicamente.

## Deuda de seguridad conocida (dependencias)

Estado al momento del andamiaje (Paso 1). `npm audit` reporta advisories en
dependencias **transitivas**; se documentan aquí con su plan:

| Paquete | Severidad | Situación | Plan |
|---------|-----------|-----------|------|
| `next-auth` / `@auth/core` (v5 beta) | crítica | Advisories de Auth.js v5 (binding de cookies OAuth, normalización de email, `getToken`) aún sin release estable parcheado. En el MVP todavía **no hay proveedores OAuth configurados** ni uso de `getToken`, por lo que las rutas afectadas no están activas. | Seguir las betas y fijar la primera versión estable/parcheada antes de habilitar login real (Paso 2). |
| `postcss` (anidado en `next`) | alta | El fix disponible exige **Next.js 16** (cambio mayor). Es herramienta de **build**, no se ejecuta en runtime con entrada del usuario. | Evaluar la actualización a Next 16 en una tarea aparte, con su regresión. |
| `vitest`/`esbuild`/`vite` | moderada | Solo **dependencias de desarrollo/test**, no se despliegan. El fix exige Vitest 5 (mayor). | Actualizar a Vitest 5 en mantenimiento de tooling. |

> Regla: no se habilitará autenticación real ni pagos sin antes cerrar los
> advisories que afecten esos caminos. Las decisiones de no actualizar ahora se
> toman para no romper el build verde por saltos mayores no validados, y quedan
> registradas aquí como deuda explícita.
