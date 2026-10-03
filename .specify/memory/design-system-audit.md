# Auditoría del Sistema de Diseño — Timelock (Laravel + Inertia + React)

Fecha: 2026-09-24 · Modo: dashboard-design + minimalismo (skills Design It)
Alcance: UI de `resources/js`, tokens en `resources/css/app.css`.

## Dirección de diseño aprobada
- **dashboard-design**: grid modular, jerarquía KPI → charts → listas, fondos muted, tarjetas con borde 1px/sombra sutil, números tabulares.
- **minimalism**: whitespace generoso, jerarquía por tipografía (pesos/tamaños), cero decoración innecesaria.
- Nota: se respeta el tema claro/oscuro existente y los tokens HSL de shadcn; el rediseño es de *consistencia*, no de rebranding.

## Inconsistencias detectadas

### 1. Gráficas de Stats ignoran los tokens de diseño (CRÍTICO — causa principal de estética inconsistente)
- `resources/css/app.css:30-34` define `--chart-1..--chart-5` pero son **escala de grises** (saturación 0%) — inútiles para datos categóricos.
- `resources/js/Pages/Dashboard/Stats.tsx:46` hardcodea 7 colores hex (`#2563eb`, `#16a34a`, `#ea580c`...).
- `Stats.tsx:412,423,434,473` usa `stroke="#2563eb"` / `fill="#16a34a"` inline → **no adaptan a dark mode**, chocan con el tema neutro del resto de la app (primary es monocromo 0 0% 7%).
- Resultado: Stats se ve como una app distinta al resto del dashboard.

### 2. Inputs nativos en Settings (12+ instancias)
- `Settings.tsx:380` define `inputClass` manual replicando estilos del componente `Input` (duplicación, deriva visual).
- `<input>` nativos en `Settings.tsx:462,549,553,564,569,591,677,678,707,763` — sin focus ring, sin estados de error/disabled consistentes con el resto.

### 3. Primitivas UI insuficientes
- Existen solo 8: badge, button, card, checkbox, dialog, input, select, textarea (`resources/js/components/ui/`).
- Faltan: **skeleton** (carga), **tabs**, **tooltip**, **separator**, **dropdown-menu**, **table**.
- Consecuencia: cada página improvisa estados de carga/empty con estilos ad-hoc.

### 4. Arquitectura de componentes confusa (Pages ↔ Components)
- `Activities.tsx`, `Calendar.tsx`, `Rewards.tsx`, `Streak.tsx`, `Export.tsx`, `Suggestions.tsx` viven en `Pages/Dashboard/` pero **no son rutas**: los importa `Index.tsx:4-9` como tabs (`?tab=`).
- Alias dual sin convención documentada: `@/components/ui` (primitivas, minúsculas) vs `@/Components/dashboard` (dominio, mayúsculas).
- Navegación: 10 items en el sidebar (`DashboardLayout.tsx:31-42`) pero solo 3 rutas reales → el estado activo y el deep-linking son frágiles.

### 5. Agregación de Stats en el cliente
- `Stats.tsx:121` hace `apiGet('/api/bootstrap')` y calcula categorías/rachas/heatmap en el browser (`Stats.tsx:176-249`).
- Sin estado de carga (skeleton), sin empty/error state consistente, latencia de render innecesaria. Viola el patrón "lógica en backend" del proyecto.

### 6. Detalles menores
- Footer Landing: "Términos y privacidad próximamente" (`lib/i18n.tsx:337,852`).
- `Export.tsx` (60 líneas) es una vista mínima comparada con el resto.
- Rangos de fechas/filtros no existen en Stats (solo export).

## Decisión de estandarización (para F1 en adelante)
1. Paleta de charts **semántica y tokenizada**: `--chart-1..7` en HSL con saturación real, contrastes AA en light/dark, mapeada a categorías (positivo=verde, alerta=naranja, etc. siguiendo dashboard-design).
2. Toda gráfica consume tokens CSS vía `var(--chart-N)` — prohibido hex inline.
3. Todo input → primitiva `Input`; añadir `skeleton`, `tabs`, `tooltip`, `separator`, `dropdown-menu`.
4. Convención de alias documentada en AGENTS.md: `@/components/ui` primitivas · `@/Components/<dominio>` componentes de dominio.
5. Páginas-tab se refactorizan a componentes de dominio reales bajo `Components/` con rutas propias (se decide en spec F3).

## Próximos pasos (workflow Spec Kit)
- F1 spec: `design-system-tokens-primitivas`
- F2 spec: `stats-redesign` (prioridad)
- F3 spec: `modulos-normalizacion`
- Cada fase: /speckit-specify → /speckit-plan → /speckit-tasks → implementación + Pest + commit atómico.
