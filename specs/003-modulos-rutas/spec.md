# Feature Specification: Módulos como rutas propias (Fase 3)

**Feature Branch**: `003-modulos-rutas`

**Created**: 2026-09-24

**Status**: Approved (decisión de arquitectura: rutas propias, elegida por el usuario)

**Input**: "Convertir Activities/Calendar/Rewards/Streak/Export/Suggestions de tabs con estado en `Index.tsx` a rutas Inertia propias bajo /dashboard/*, con deep-linking real y estado activo del sidebar correcto."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deep-linking y navegación correcta (Priority: P1)

Como usuario, quiero que cada módulo tenga URL propia (`/dashboard/activities`...) para poder refrescar, marcar favoritos y compartir enlaces directos, con el item correcto resaltado en el sidebar.

**Why this priority**: Es el objetivo de la decisión de arquitectura tomada.

**Independent Test**: Visitar directamente cada una de las 6 URLs → módulo correcto + item activo correcto; click en el sidebar navega por Inertia visit sin recarga completa.

**Acceptance Scenarios**:

1. **Given** URL `/dashboard/rewards` **When** carga **Then** se ve el módulo Recompensas y el nav "Rewards" activo.
2. **Given** navegación por sidebar **When** se hace click **Then** Inertia visit (sin FMP completo) a la ruta del módulo.
3. **Given** la página Home **When** renderiza **Then** ya no contiene imports ni switch de los 6 módulos.

### User Story 2 - Consistencia visual de los módulos (Priority: P2)

Como usuario, cada módulo debe verse coherente con el design system (título de página consistente, spacing, `Empty`/`Skeleton` según F1/F2).

**Independent Test**: Recorrer las 6 rutas: cada página usa `DashboardLayout` con `active` explícito, títulos h2 con `statsTitle`-style, y estados de carga/empty consistentes.

**Acceptance Scenarios**:

1. **Given** cualquier módulo **When** está cargando datos **Then** muestra Skeleton (no texto plano "cargando" si aplica upgrade ligero sin reescribir módulos).
2. **Given** módulo sin datos **Then** empty state con componente `Empty`.

## Requirements *(mandatory)*

- **FR-001**: Backend MUST exponer 6 rutas Inertia: `/dashboard/{activities,suggestions,rewards,calendar,streak,export}` (middleware `auth.session` + redirect onboarding como `/dashboard`).
- **FR-002**: `lib/navigation.ts` MUST mapear cada `NavId` a su ruta real; eliminar `TabId`/`tabIds`/`isTabId`.
- **FR-003**: `DashboardLayout` MUST navegar por `<Link>` de Inertia en todos los items (sin `onTabChange`/`isRouteNav`), y derivar `active` del pathname.
- **FR-004**: Cada vista MUST ser Page de Inertia: `<DashboardLayout active={su id}>` como wrapper.
- **FR-005**: `Index.tsx` MUST reducirse a solo Home (sin imports de módulos ni estado tab).
- **FR-006**: `Calendar` MUST navegar a Activities vía `router.get('/dashboard/activities')` (reemplaza `onNavigate`).
- **FR-007**: Suite Pest en verde; tests Web existentes de navegación actualizados si referencian `?tab=`.
- **FR-008**: Sin regresión de UI: colores/estilos intactos (no se re-diseñan módulos en esta fase, solo navegación).

### Edge Cases

- `?tab=` legacy (bookmarks antiguos): `/dashboard` ignora el parámetro (muestra Home) — documentado como acceptable break; opcional redirect backend de `?tab=x` → ruta nueva.
- Navegación móvil (bottom-nav): mantiene los mismos ids, ahora rutas.

## Success Criteria *(mandatory)*

- **SC-001**: 6 URLs responden 200 autenticadas y renderizan su módulo (tests).
- **SC-002**: `grep 'tab=' resources/js` sin usos de navegación por query (excepto historial/documentación).
- **SC-003**: Pest verde + build verde.
- **SC-004**: Sidebar activo correcto por pathname en las 6 rutas.

## Assumptions

- Los módulos mantienen su fetch propio a `/api/bootstrap` (no se optimiza en esta fase).
- El módulo Home sigue siendo `Index.tsx` en `/dashboard`.
