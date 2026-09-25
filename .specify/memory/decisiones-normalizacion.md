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

## Ciclo 2 — Sincronización horaria + pickers (2026-09-25)

- **Root cause del desfase**: columnas `timestampTz` + sesión Postgres en UTC + APP_TIMEZONE=America/Lima (seteado por el usuario) → Laravel escribía wall-clock Lima interpretado como UTC → tokens QR (TTL 10 min) nacían vencidos y las fechas se movían de día. Fix: `config/database.php` pgsql `'timezone' => env('APP_TIMEZONE', 'UTC')` (PostgresConnector emite `SET TIME ZONE`).
- **Serialización naive**: `SerializesDomain::dateValue` y Stats/Suggestions emiten `Y-m-d\TH:i:s` sin offset (paridad con origen Next.js: el navegador interpreta wall-clock como local). QR `expiresAt` conserva ISO con offset (instante absoluto correcto para countdown).
- **Match por día**: calendario/activities usan la columna `date` (`a.date.slice(0,10)`) en vez de parsear `startAt`; Index usa hoy local del cliente.
- **Pickers**: registry ReUI requiere auth (401) → se usó shadcn `calendar` (react-day-picker, mismo patrón "Calendar with date picker" de reui.io) + `date-picker.tsx`/`time-picker.tsx` propios con idéntico lenguaje visual (popover, borde 1px, tokens, selected bg-primary).
- **react-live-clock descartado**: requiere moment+react-moment (peer React 16-18, incompat con React 19). `LiveClock` interno con date-fns (ya instalada).
- **Stats**: presets hoy/semana/mes eliminados; solo from/to con DatePicker, default hoy.
- Button ganó size `icon` (lo usa el calendario shadcn).
- Conocimiento: la convención UI vive en ambos AGENTS.md (dev/ como instrucción del agente, app/ versionada en repo).
