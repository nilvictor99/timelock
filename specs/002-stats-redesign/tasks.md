# Tasks: Rediseño del módulo Estadísticas (Fase 2)

**Input**: `specs/002-stats-redesign/plan.md` + `spec.md`

**Tests**: TDD en backend — escribir tests antes/durante la implementación; gate: `./vendor/bin/sail artisan test` + `npm run build`.

## Mission 1 — Rewards en rango

- [x] **1.1** [P] [US2] Añadir `findByUserRedeemedBetween(string $userId, DateTimeInterface $from, DateTimeInterface $to): Collection` a `app/Repositories/Contracts/RewardRepositoryInterface.php`.
- [x] **1.2** [P] [US2] Implementar en `app/Repositories/Eloquent/RewardRepository.php` (whereBetween `redeemed_at`, orderBy `redeemed_at`).

## Mission 2 — StatsService

- [x] **2.1** [?] [US2] Crear `app/Services/StatsService.php` con `summary()`: filtros de actividades/categorías sobre `findByUserRange`, agregados KPI + category + daily + topActivities(10) + weekday(compliance) + streak(current/longest/perfectDays/history≤370) + rewardTrend(semana≤60d/mes>60d) + rewards del rango. Paridad con el algoritmo cliente original (racha por días consecutivos con completadas; perfectDays total>0 && completed==total).

## Mission 3 — Endpoint

- [x] **3.1** [?] [US2] Crear `app/Http/Controllers/StatsController.php` (valida from/to estilo ExportController; 400 inválido; params `activities`/`categories` CSV opcionales; delega en StatsService; JSON camelCase).
- [x] **3.2** [?] [US2] Registrar `GET /api/stats/summary` en `routes/web.php` dentro del grupo `auth.session` como `api.stats.summary`.

## Mission 4 — Tests Pest

- [x] **4.1** [?] [US2] `tests/Unit/StatsServiceTest.php`: fixtures con racha 3 días, día perfecto, compliance por weekday, top10, filtrado por categoría/actividad, rango vacío→ceros, history ≤370.
- [x] **4.2** [?] [US2] `tests/Feature/StatsSummaryTest.php`: auth requerida, 400 rango inválido, estructura camelCase de respuesta, rewards en rango.

## Mission 5 — Componentes de dominio stats

- [x] **5.1** [P] [US3] `resources/js/Components/stats/ChartCard.tsx`: wrapper Card+CardTitle con props `loading` (Skeleton interno h-64), `empty`, `title`, `children`.
- [x] **5.2** [P] [US3] `CategoryPie.tsx`, `DailyLine.tsx`: gráficas primarias (colores `chartVar`).
- [x] **5.3** [P] [US3] `TopActivitiesBar.tsx`, `WeekdayComplianceBar.tsx`: secundarias.
- [x] **5.4** [P] [US3] `RewardTrendBar.tsx` y panel de recompensas (lista + trend).
- [x] **5.5** [P] [US3] `StreakHeatmap.tsx` (tarjeta de rachas: 3 stats + heatmap 370 con tokens success/warning/muted).
- [x] **5.6** [P] [US3] `StatsMetrics.tsx` (4 KPIs reutilizando `Components/dashboard/Metric`) y `StatsFilters.tsx` (presets, fechas custom, búsqueda, categorías; usa `Input`/`Checkbox`; emits cambios al padre).

## Mission 6 — Página orquestadora

- [x] **6.1** [?] [US1] Reescribir `resources/js/Pages/Dashboard/Stats.tsx`: estado summary/loading/error/rango/filtros; fetch cancelable a `/api/stats/summary` con re-fetch al cambiar; Skeleton por tarjeta; error con Reintentar (i18n `statsRetry`); empty con `Empty`; export con rango activo. <250 líneas, sin JSX de recharts ni agregados.
- [x] **6.2** [?] [US1] Añadir claves i18n nuevas (es/en) en `resources/js/lib/i18n.tsx`.

## Cierre

- [x] **7.1** [?] [ALL] `./vendor/bin/sail artisan test` verde (93+nuevos) · `npm run build` verde.
- [x] **7.2** [?] [ALL] Verificación manual light/dark: datos, vacío, error. SC-001..005.
- [x] **7.3** [?] [ALL] Commit atómico: `stats: agregación en servidor + componentes de dominio`.

## Verification Checklist

- [x] SC-001: endpoint <150ms con 500 actividades
- [x] SC-002: Stats.tsx <250 líneas, sin recharts directo
- [x] SC-003: Pest verde (93+nuevos)
- [x] SC-004: build OK, 0 hex inline
- [x] SC-005: tests de paridad pasando
