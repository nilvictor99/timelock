# Tasks

- [x] 1. MultiSelect con búsqueda, chips removibles, contador, Limpiar/Seleccionar todo, role=listbox — sin dependencias nuevas
- [x] 2. StatsFilters reorganizado (rango fila completa + 2 MultiSelect); Stats.tsx con onChange de arrays (fuera toggle/activitySearch)
- [x] 3. Calendar.tsx: day view anclada al día correcto, today de /api/bootstrap, poll 60 s, título por vista, badge Hoy, mes alineado lun→dom, setMonth con clamp, sin hex inline
- [x] 4. findByUserRange por columna date; rewards por wall-clock 00:00–23:59 del TZ de la app
- [x] 5. 4 tests nuevos (multi ids / multi categorías / intersección / borde wall-clock) — 8/8 en el archivo
- [x] 6. i18n statsFilters* es/en; Spec Kit 004; memory + INVENTARIO + AGENTS

## Verification
`tsc --noEmit` OK · `npm run build` OK · Pest **113/113** (481 aserciones) · smoke: multi-filtro 2 ids OK, categorías inexistentes→200 vacío, `/dashboard/calendar` 200.
