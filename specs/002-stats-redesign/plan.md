# Implementation Plan: Rediseño del módulo Estadísticas (Fase 2)

**Branch**: `002-stats-redesign` | **Date**: 2026-09-24 | **Spec**: `specs/002-stats-redesign/spec.md`

## Summary

Mover la agregación de Stats del cliente al backend (`StatsService` + `GET /api/stats/summary`, rango+filtros por query), añadiendo `findByUserRedeemedBetween` a rewards. Frontend: extraer 8 componentes de dominio en `Components/stats/` con Skeleton/empty states, reutilizar `Metric`/`Empty` de dashboard, dejar `Stats.tsx` como orquestación (<250 líneas). Layout dashboard-design: KPIs → primarias → secundarias → recompensas → rachas.

## Technical Context

**Language/Version**: PHP 8.3 (Laravel 13, tests en Sail/PHP 8.5) · React 19 + Inertia
**Primary Dependencies**: Eloquent, Repository Pattern existente, Pest 4, recharts 3.10 (solo en Components/stats)
**Storage**: PostgreSQL (tablas activities/rewards/users existentes, sin migraciones)
**Testing**: Pest — `StatsServiceTest` (unit, fixtures) + `StatsControllerTest` (HTTP: auth, 400, estructura) + suite completa
**Constraints**: Payload del summary no incluye actividades crudas; sin N+1 (`findByUserRange` eager-loads category); camelCase JSON

## Constitution Check

- **I. Repository Pattern**: `RewardRepositoryInterface` gana un método con contrato; `StatsService` consume interfaces. ✓
- **II. Spec-Driven**: spec 002 aprobada. ✓
- **III. Test-First**: tests de paridad escritos con la spec; implementación contra tests. ✓
- **IV. Design System**: gráficas consumen `chartVar`/tokens; Skeleton en cargas; sin hex. ✓
- **V. Paridad Frontend-Backend**: la agregación pasa al backend — núcleo de esta fase. ✓

## Missions (What)

### Mission 1 — Contrato de rewards en rango
**REQUIRES**: nada · **WHERE**: `app/Repositories/Contracts/RewardRepositoryInterface.php`, `app/Repositories/Eloquent/RewardRepository.php`
Añadir `findByUserRedeemedBetween(string $userId, DateTimeInterface $from, DateTimeInterface $to): Collection` (recompensas con `redeemed_at` entre fechas, orden asc).

### Mission 2 — StatsService
**REQUIRES**: M1 · **WHERE**: `app/Services/StatsService.php`
Firma: `summary(string $userId, User $user, DateTimeInterface $from, DateTimeInterface $to, ?array $activityIds, ?array $categoryIds): array`. Estructura de salida (spec FR-002): kpis{totalMinutes, completed, points, rewardsRedeemed, pointsSpent}, category[{name, minutes, color}], daily[{date, minutes, completed, total}], topActivities[{name, count}] (top 10), weekday[0..6 con compliance], streak{current, longest, perfectDays, history[≤370]}, rewardTrend[{date, count}] (semana ≤60 días, mes >60), rewards[{id,title,cost,redeemedAt}]. Paridad con el algoritmo cliente actual (rachas consecutivas por día con ≥1 completada; perfectDays = día con total>0 y completed==total; weekday compliance = completed/total*100 redondeado).

### Mission 3 — Endpoint
**REQUIRES**: M2 · **WHERE**: `app/Http/Controllers/StatsController.php`, `routes/web.php`
`GET /api/stats/summary` — `auth.session`, validación `from`/`to` (reusar patrón `parseRange` de ExportController, extraerlo a concern compartido si conviene), params opcionales `activities`/`categories` (CSV de UUIDs), 400 en rango inválido. Ruta `api.stats.summary`.

### Mission 4 — Tests Pest backend
**REQUIRES**: M2, M3 · **WHERE**: `tests/Feature/Stats*`, `tests/Unit/StatsServiceTest.php`
Casos: paridad de agregados con fixtures (incluye racha de 3 días, día perfecto, compliance 0 actividades=0%, filtrado por categoría/actividad), auth requerida, rango inválido 400, estructura camelCase, sin actividades → ceros.

### Mission 5 — Componentes de dominio stats
**REQUIRES**: Fase 1 (tokens/primitivas) · **WHERE**: `resources/js/Components/stats/`
8 componentes con props tipadas + Skeleton: `StatsMetrics` (KPIs vía Metric), `StatsFilters` (presets/fechas/búsqueda/categorías), `CategoryPie`, `DailyLine`, `TopActivitiesBar`, `WeekdayComplianceBar`, `RewardTrendBar`, `StreakHeatmap` (+ `ChartCard` wrapper con estado loading/empty). Colores solo `chartVar`.

### Mission 6 — Página Stats orquestadora
**REQUIRES**: M5 · **WHERE**: `resources/js/Pages/Dashboard/Stats.tsx`
Estado: summary|null, loading, error, rango (preset hoy/semana/mes/custom), filtros; fetch `/api/stats/summary` con re-fetch al cambiar (cancelable); Skeleton por tarjeta; error con Reintentar; empty con `Empty`; export igual con rango activo. Elimina `/api/bootstrap` y todas las funciones de cálculo. Meta <250 líneas.

## What Changes

```text
app/Repositories/Contracts/RewardRepositoryInterface.php   # +findByUserRedeemedBetween
app/Repositories/Eloquent/RewardRepository.php             # impl
app/Services/StatsService.php                              # nuevo
app/Http/Controllers/StatsController.php                  # nuevo
routes/web.php                                             # +GET /api/stats/summary
tests/Unit/StatsServiceTest.php                            # nuevo
tests/Feature/StatsSummaryTest.php                         # nuevo
resources/js/Components/stats/*.tsx                        # 8-9 nuevos
resources/js/Pages/Dashboard/Stats.tsx                    # reescritura como orquestación
resources/js/lib/i18n.tsx                                  # claves nuevas (retry, etc.) es/en
```

## Risks / Mitigations

- Paridad de rachas con el cálculo previo: tests de paridad con fixtures que replican casos del cliente original (guardado en git history).
- `rewardTrend` cambia de criterio (amplitud del rango en servidor vs preset en cliente): asumido en spec, documentado.
- Zona horaria: misma base que hoy (`start_at` del servidor); no se introduce TZ usuario.

## Rollout / Verification

1. `./vendor/bin/sail artisan test` (93 + nuevos en verde).
2. `npm run build` verde.
3. Render manual light/dark de Stats con datos, vacío y error.
4. Commit atómico: `stats: agregación en servidor + componentes de dominio`.
