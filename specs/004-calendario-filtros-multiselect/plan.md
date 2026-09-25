# Implementation Plan

| # | Tarea | Archivos |
|---|-------|----------|
| 1 | Primitiva MultiSelect (Popover+Checkbox+Input+Badge, chips, a11y listbox) | `resources/js/components/ui/multi-select.tsx` (nuevo) |
| 2 | StatsFilters: rango (2 DatePicker) fila 1; MultiSelect Actividades \| Categorías fila 2; Limpiar filtros | `Components/stats/StatsFilters.tsx`, `Pages/Dashboard/Stats.tsx` |
| 3 | Calendario: fix vista Día (`[anchor]`), hoy desde bootstrap + polling 60 s, título por vista, badge "Hoy", mes 7-col alineado, shift con setMonth clamp, tokens | `Pages/Dashboard/Calendar.tsx` |
| 4 | Rango por `date` (wall-clock) en actividad y rewards | `Repositories/Eloquent/{ActivityRepository,RewardRepository}.php` |
| 5 | Tests: multi ids, multi categorías (excluye sin categoría), intersección, borde 23:30 | `tests/Feature/Api/StatsSummaryApiTest.php` |
| 6 | i18n es/en + docs (memory, INVENTARIO, AGENTS) | `lib/i18n.tsx`, docs |
