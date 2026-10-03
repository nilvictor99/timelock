# Feature Specification: Rediseño del módulo Estadísticas — Agregación en servidor + sistema de diseño (Fase 2)

**Feature Branch**: `002-stats-redesign`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Mejorar el módulo de Estadísticas: mover toda la agregación del cliente (`/api/bootstrap` + cálculos en browser) al backend con Repository/Service, endpoint `/api/stats/summary`, extraer gráficas a componentes de dominio `Components/stats/`, estados de carga con Skeleton, y layout dashboard-design (KPIs → primarias → secundarias)."

**Contexto**: Fase 1 (tokens `--chart-1..7`, primitivas skeleton/tabs, `lib/charts.ts`) ya está en main. Hoy `Stats.tsx` (532 líneas) descarga TODAS las actividades/recompensas y calcula todo en el cliente (`Stats.tsx:121-260`): latencia, sin skeleton, sin deep-link de filtros.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estadísticas rápidas y con feedback visual (Priority: P1)

Como usuario, al abrir `/dashboard/stats` quiero ver skeletons con la forma del layout final en <300ms y datos agregados listos sin que mi navegador procese todo el histórico, para que el módulo responda igual de rápido con 10 o 10.000 actividades.

**Why this priority**: El cuello de botella actual (bootstrap completo + agregación en cliente) es la causa funcional del "no muestra correctamente lo que debe".

**Independent Test**: Con un seeder de 500+ actividades, `/dashboard/stats` renderiza skeletons inmediatos y pinta KPIs al resolver `/api/stats/summary` (payload reducido, no el histórico completo).

**Acceptance Scenarios**:

1. **Given** un usuario autenticado **When** abre Stats **Then** ve `Skeleton` con la estructura real (4 KPIs + tarjetas de gráficas) mientras carga.
2. **Given** la red lenta o error **When** el fetch falla **Then** se muestra estado de error con botón Reintentar (no pantalla rota).
3. **Given** rango sin actividades **When** la respuesta llega vacía **Then** se muestra empty state con icono y CTA (patrón `Empty`).

### User Story 2 - Mismos análisis, calculados en el servidor (Priority: P1)

Como usuario, quiero que los KPIs y gráficas (tiempo por categoría, evolución diaria, top actividades, cumplimiento por día de semana, rachas, días perfectos, tendencia de recompensas) sean exactamente los mismos que hoy pero calculados en el servidor, para garantizar consistencia con el resto de la app.

**Why this priority**: La paridad de resultados evita regresiones percibidas; es el corazón de la fase.

**Independent Test**: Con fixtures conocidos, `StatsService` devuelve los mismos valores que producía el cálculo cliente (paridad verificada por tests Pest).

**Acceptance Scenarios**:

1. **Given** actividades en rango **When** se llama `GET /api/stats/summary?from&to` **Then** responde KPIs (totalMinutes, completed, points, rewardsRedeemed, pointsSpent), category[], daily[], topActivities[], weekday[] (con compliance %), streak {current, longest, perfectDays, history[]}, rewardTrend[].
2. **Given** filtros por actividades/categorías **When** se pasan como query params **Then** el summary solo agrega lo seleccionado.
3. **Given** rango inválido (from > to) **When** se llama el endpoint **Then** responde 400 con mensaje.

### User Story 3 - Módulo mantenible con componentes de dominio (Priority: P2)

Como desarrollador, quiero las gráficas como componentes `Components/stats/*` reutilizables que consumen tokens del sistema, para que Stats quede como orquestación limpia y la estética sea la de Fase 1.

**Why this priority**: Endurece el sistema de diseño y desbloquea Fase 3.

**Independent Test**: `Stats.tsx` < 250 líneas, solo orquestación; cada gráfica es un componente con props tipadas y Skeleton integrado.

**Acceptance Scenarios**:

1. **Given** el código fuente **When** se abre Stats.tsx **Then** no contiene JSX de recharts (solo componentes `Components/stats/*`).
2. **Given** cualquier gráfica **When** cambia el tema light/dark **Then** los colores siguen saliendo de `var(--chart-N)`.
3. **Given** el layout **When** se renderiza con datos **Then** el orden visual es: KPIs → gráficas primarias (categoría, evolución) → secundarias (top, weekday) → recompensas → rachas.

### Edge Cases

- Filtro que deja 0 actividades → summary válido con ceros (no error).
- Rango > 370 días en heatmap → se recorta a 370 días (como hoy `Stats.tsx:230`).
- Rachas: `current` = máximo entre racha calculada del rango y `user.current_streak` (paridad con lógica actual).
- Categoría sin color → fallback `chartVar(n)` por orden de aparición.
- Query params mal formados (fechas no ISO) → 400, no 500.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST exponer `GET /api/stats/summary` autenticado (middleware `auth.session`) con params `from`, `to` (YYYY-MM-DD), opcionales `activities` (ids CSV) y `categories` (ids CSV).
- **FR-002**: `App\Services\StatsService` MUST calcular todos los agregados (KPIs, categoría, diario, top 10, weekday compliance, rachas incl. perfectDays y history ≤370, rewardTrend agrupado por semana/mes según amplitud) consumiendo `ActivityRepositoryInterface::findByUserRange` y un nuevo método de rewards en rango.
- **FR-003**: `RewardRepositoryInterface` MUST añadir `findByUserRedeemedBetween(userId, from, to)` con implementación Eloquent y binding existente.
- **FR-004**: Los controladores MUST ser delgados: `StatsController::summary` valida, delega al service, responde JSON camelCase (SerializesDomain/convención existente).
- **FR-005**: El frontend MUST reemplazar el fetch a `/api/bootstrap` por `/api/stats/summary` (re-fetch al cambiar rango/filtros) y eliminar todo cálculo de agregados del cliente.
- **FR-006**: Las gráficas MUST vivir en `resources/js/Components/stats/` (CategoryPie, DailyLine, TopActivitiesBar, WeekdayComplianceBar, RewardTrendBar, StreakHeatmap, StatsMetrics, StatsFilters) con props tipadas y Skeleton mientras cargan.
- **FR-007**: La página MUST usar el layout jerárquico dashboard-design y reutilizar `Components/dashboard/Metric` (KPIs) y `Components/dashboard/Empty` (empty state).
- **FR-008**: Tests Pest MUST cubrir StatsService (agregados con fixtures: rachas, perfectDays, compliance, filtrado) y el endpoint (auth, validación de rango, estructura de respuesta).
- **FR-009**: Todo texto nuevo visible MUST estar en `lib/i18n.tsx` (es/en) — reutilizar claves existentes donde aplique.
- **FR-010** (añadido en implementación): El summary MUST incluir `options` (actividades `{id,title}` y categorías `{id,name,color}` del usuario, fuera del rango) para poblar los filtros sin un fetch adicional a `/api/bootstrap`. Desviación documentada conforme a constitution II.

### Key Entities

- **StatsSummary** (DTO/array del service): kpis, category[], daily[], topActivities[], weekday[], streak{current, longest, perfectDays, history[]}, rewardTrend[], rewards[] (listado del rango para el panel).
- **StatsController** (`app/Http/Controllers`): endpoint delgado.
- **Componentes stats** (`Components/stats/*`): presentación pura, sin lógica de datos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `/api/stats/summary` responde con 500 actividades < 150ms (agregación PHP sin N+1).
- **SC-002**: `Stats.tsx` < 250 líneas sin JSX de recharts ni cálculo de agregados.
- **SC-003**: Suite Pest en verde (93 existentes + nuevos de Stats).
- **SC-004**: `npm run build` sin errores; 0 hex inline.
- **SC-005**: Los valores de summary con fixtures coinciden con los cálculos previos del cliente (tests de paridad).

## Assumptions

- Las rachas actuales se derivan igual que hoy: `user.current_streak`/`best_streak` (columnas) + cálculo del rango, tomando el máximo.
- La zona horaria de agregación es la del servidor (misma que el cálculo actual vía `start_at`), sin introducir TZ de usuario en esta fase.
- El heatmap mantiene el techo de 370 días.
- `rewardTrend` agrupa por semana (rango ≤ 60 días) o por mes (rango mayor), como el comportamiento actual (`preset === 'month'` → mes; el backend decide por amplitud del rango real, no por preset).
- El export CSV/PDF existente no cambia (solo se reutiliza el rango activo).
