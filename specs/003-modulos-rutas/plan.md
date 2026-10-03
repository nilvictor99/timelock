# Implementation Plan: Módulos como rutas propias (Fase 3)

**Branch**: `003-modulos-rutas` | **Date**: 2026-09-24 | **Spec**: `specs/003-modulos-rutas/spec.md`

## Summary

Convertir los 6 módulos-tab en rutas Inertia propias: 6 rutas backend, `navigationPath` real por id, `DashboardLayout` con `<Link>` puro y `active` derivado del pathname, vistas envueltas en el layout con su id, `Index.tsx` reducido a Home, Calendar navega con `router.get`. Legacy `?tab=` recibe redirect backend a la ruta nueva (mejor UX que ignorar).

## Missions

1. **navigation.ts**: `navigationPath` → rutas reales; eliminar TabId/tabIds/isTabId.
2. **Backend routes**: 6 rutas con redirect onboarding; redirect legacy `?tab=x` → ruta nueva.
3. **DashboardLayout**: quitar isRouteNav/onTabChange, todos Link, active por pathname.
4. **Vistas→Pages**: wrapper DashboardLayout active=<id> en las 6; Calendar router.get.
5. **Index.tsx**: solo Home.
6. **Tests**: Web/Navigation tests ajustados + nuevos; suite + build.

## Verification

Pest verde · build verde · navegación manual 6 rutas · sidebar activo correcto.
