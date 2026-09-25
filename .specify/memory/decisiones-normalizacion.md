# Desviaciones y decisiones — Ciclo de normalización (2026-09-24)

Registro exigido por la constitution (regla II: documentar desviaciones en `.specify/memory/`).

## F1 (001-design-system-ui)
- `--chart-7` ajustado de 45 93% 41% → 45 98% 32%: el ámbar original daba 2.60:1 (<3:1 mínimo gráficos) contra tarjeta clara. Ratio final 3.95:1.
- `type="time"`/`type="range"` permanecen nativos (shadcn no los cubre); estilizados con tokens (`timeControlClass`, `accent-ring`) y documentados como excepción en AGENTS.md.
- Laravel Boost (AGENTS.md del repo) no se instaló en este ciclo: añade dependencia dev ajena al alcance del plan; queda como tarea opcional.

## F2 (002-stats-redesign)
- Añadido FR-010: el summary incluye `options` (actividades/categorías) para poblar filtros sin segundo fetch a `/api/bootstrap`. Descubierta la necesidad al implementar StatsFilters.
- `rewardTrend` agrupa por amplitud del rango en servidor (semana ≤60 días / mes >60), no por preset de UI como hacía el cliente. Asumido en spec.
- Tests de rachas usan `max(rango, user.best_streak/current_streak)` — paridad con el cálculo cliente original.
- Pest en `tests/Feature/Services/StatsServiceTest.php` (no Unit) porque consume BD vía repositorios; la suite Unit no usa RefreshDatabase.

## F3 (003-modulos-rutas)
- Decisión de arquitectura (rutas propias vs tabs) tomada con el usuario según comprometía el plan.
- Redirect backend `?tab=x` → `/dashboard/x` para no romper bookmarks legacy (mejora sobre "ignorar" del spec original).
- `activeFromUrl` ahora por pathname (`activeFromPathname` en navigation.ts).

## Validación visual (F4)
- `terminal-browser` no disponible en este terminal (requiere kitty graphics/ghostty). Validación estática completada (tokens en CSS build, var(--chart en bundle, 0 hex inline, Skeleton en componentes, 10 páginas con layout+active). Recorrido visual manual pendiente por el usuario con cuenta demo@timelock.dev.
