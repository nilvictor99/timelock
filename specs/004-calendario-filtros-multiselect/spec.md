# Feature Specification: Calendario sincronizado + filtros multi-select

**Feature Branch**: `004-calendario-filtros-multiselect` · **Created**: 2026-09-25 · **Status**: Implemented

**Input**: "mejora el componente de filtros de los gráficos: actividades y categorías en un select multi-seleccionable; revisa el calendario que muestra lunes 21 en vez del 25"

## User Scenarios

### US1 — Filtros multi-select (P1)
Como usuario de Stats quiero elegir **varias** actividades y categorías desde un select con búsqueda y chips removibles, en lugar de una lista plana de checkboxes truncada a 12, para filtrar los gráficos con orden.

**Acceptance**:
1. `MultiSelect` (Popover+Checkbox+Input+Badge, sin deps nuevas) en `Components/ui`; chips con X + contador en trigger; "Limpiar" en el panel y "Seleccionar todo" en categorías.
2. `GET /api/stats/summary?activities=id1,id2&categories=catA,catB` (ya existente) interpola como AND; actividades sin categoría quedan fuera del filtro por categoría.
3. Fuera: `slice(0,12)` + "+N", input de búsqueda inline, `toggle` manual en Stats.tsx.

### US2 — Calendario muestra HOY (P0)
Como usuario abro `/dashboard/calendar` y quiero ver el **día actual** con sus actividades; antes la vista Día mostraba el **lunes de la semana** (bug: `days` usaba `weekStart` en day view) y el título solo decía el mes.

**Acceptance**:
1. Vista por defecto = **Día**, celda única = día anclado (`selected ?? today`), con hora (`HH:mm · título`) por actividad.
2. `today` proviene de `/api/bootstrap` (TZ de la app), con refresco cada 60 s → medianoche salta sola al día nuevo; badge "Hoy" + `ring` marcan el día actual en semana/mes.
3. Título por vista: día completo / rango semanal / mes. Vista Mes: grilla 7 columnas alineada a lunes con cabecera lun→dom, semanas necesarias (no 35 fijos), otros meses atenuados.
4. `shift()` con aritmética real de mes (clamp 31→28); sin hex inline ni `bg-green-100` (tokens `--color-success`/`--color-border`).

### US3 — Bordes de rango exactos (P1)
El rango de Stats/Export filtraba `start_at` contra instantes UTC: con `APP_TIMEZONE=America/Lima` la ventana ingería las últimas 5 h del día previo y cortaba la tarde del día final.

**Acceptance**: `findByUserRange` filtra por columna `date` (`where date >= from Y-m-d`); `findByUserRedeemedBetween` compara wall-clock `00:00:00–23:59:59` del TZ de la app. Test de borde: 23:30 del día previo queda fuera, 23:30 del último día queda dentro.

## Out of Scope
`rewardTrend`/`streak` (ya verificados), estilos de Header/Nav, export PDF.
