# Tasks: Módulos como rutas propias (Fase 3)

**Input**: `specs/003-modulos-rutas/`

- [x] **1.1** [?] [US1] `resources/js/lib/navigation.ts`: navigationPath a rutas reales; eliminar TabId/tabIds/isTabId.
- [x] **1.2** [?] [US1] `routes/web.php`: 6 rutas Inertia + redirect legacy `?tab=x` → ruta nueva.
- [x] **1.3** [?] [US1] `resources/js/Layouts/DashboardLayout.tsx`: eliminar isRouteNav/onTabChange; todos los items `<Link>`; activeFromUrl por pathname.
- [x] **1.4** [?] [US1] Las 6 vistas: wrapper `<DashboardLayout active="...">`; Calendar: `router.get('/dashboard/activities')`.
- [x] **1.5** [?] [US1] `Index.tsx`: solo Home (sin imports de módulos, sin estado tab).
- [x] **1.6** [?] [US2] Upgrade ligero de estados de carga: Skeleton en las 6 vistas donde haya texto plano "cargando" (sin rediseño).
- [x] **1.7** [?] [ALL] Tests: ajustar los que usen `?tab=`, añadir test de rutas nuevas; Pest + build verde.
- [x] **1.8** [?] [ALL] Commit: `modulos: rutas propias para activities/suggestions/rewards/calendar/streak/export`.
