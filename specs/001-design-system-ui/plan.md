# Implementation Plan: Sistema de Diseño UI — Tokens, Charts y Primitivas (Fase 1)

**Branch**: `001-design-system-ui` | **Date**: 2026-09-24 | **Spec**: `specs/001-design-system-ui/spec.md`

## Summary

Normalizar la estética inconsistente de Timelock sustituyendo los tokens de charts en grises por una paleta semántica de 7 colores con variantes light/dark (AA), prohibiendo hex inline en gráficas recharts; añadir las primitivas UI faltantes (skeleton, tabs, tooltip, separator, dropdown-menu) en estilo minimalista; migrar los inputs nativos de Settings a primitivas; y documentar la convención de alias de componentes. Es la base visual que consumirá el rediseño del módulo Estadísticas (Fase 2).

## Technical Context

**Language/Version**: PHP 8.3 (Laravel 13) · TypeScript + React 19 (Inertia 3.7)

**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/vite`, tokens en `resources/css/app.css`), shadcn/ui estilo `radix-nova` (`components.json`), recharts 3.10, Radix UI

**Storage**: N/A (sin cambios de datos; solo CSS/componentes)

**Testing**: Pest 4 (backend, `php artisan test`) · `npm run build` + render visual manual light/dark (frontend)

**Target Platform**: Web responsive (desktop + móvil PWA-like)

**Project Type**: Web app monolítica (Inertia SSR)

**Performance Goals**: Sin regresión; CSS tokens = 0 coste runtime

**Constraints**: Retrocompatible con páginas ya migradas; no cambiar el primary monocromo; i18n es/en en todo texto

**Scale/Scope**: 1 archivo de tokens, 5 primitivas nuevas, 1 página (Settings) refactorizada, Stats solo cambio de colores

## Constitution Check

- **I. Repository Pattern**: OK — sin cambios de backend.
- **II. Spec-Driven**: OK — spec `001-design-system-ui` aprobada previa.
- **III. Test-First**: OK — suite Pest existente debe seguir en verde; build Vite como gate frontend.
- **IV. Design System Tokenizado**: CORE de esta fase — lo define y aplica.
- **V. Paridad Frontend-Backend**: N/A aquí (agregación a backend es Fase 2).

## Missions (What) — en orden

### Mission 1 — Paleta de charts tokenizada
**REQUIRES**: ninguno · **WHEN**: siempre · **WHERE**: `resources/css/app.css`, `resources/js/Pages/Dashboard/Stats.tsx`
Tokens `--chart-1..7` light con saturación real + variantes `.dark`; mapa semántico-secuencial; reemplazar los 7 hex de `Stats.tsx:46` y los inline `stroke`/`fill` (`Stats.tsx:412,423,434,473`) por `var(--chart-N)` vía CSS custom classes o el prop `fill` con `var()`. Constraint: contraste AA (gráficos ≥3:1) contra `--card` en ambos temas.

### Mission 2 — Primitivas UI minimalistas
**REQUIRES**: Mission 1 (tokens) · **WHEN**: falta primitiva · **WHERE**: `resources/js/components/ui/`
Instalar vía shadcn CLI los 5 componentes (skeleton, tabs, tooltip, separator, dropdown-menu) y ajustarlos al lenguaje minimalista: sin sombras decorativas, bordes 1px `--border`, radius existente, light/dark heredado de tokens. Textos de UI placeholder → i18n es/en.

### Mission 3 — Settings sin inputs nativos
**REQUIRES**: Mission 2 (Input existe ya; verificar) · **WHEN**: haya `<input>` con `inputClass` · **WHERE**: `resources/js/Pages/Dashboard/Settings.tsx`
Eliminar `inputClass` (`Settings.tsx:380`); migrar los 10 inputs listados en la spec a `Input`; excepciones `type="time"`/`type="range"` estilizadas por CSS con tokens y documentadas. Verificación: grep sin `inputClass`, foco uniforme.

### Mission 4 — Convención documentada + verificación
**REQUIRES**: Missions 1-3 · **WHEN**: al cierre · **WHERE**: `AGENTS.md`, `.specify/memory/`
Añadir sección "Convención de componentes" a AGENTS.md; registrar tabla de contraste de la paleta en `.specify/memory/design-tokens-charts.md`; correr Pest + build; commit atómico `design-system: tokens, charts y primitivas`.

## What Changes

```text
resources/css/app.css                        # tokens --chart-1..7 light + dark
resources/js/Pages/Dashboard/Stats.tsx        # hex → var(--chart-N) (solo colores, estructura en Fase 2)
resources/js/components/ui/skeleton.tsx       # nuevo
resources/js/components/ui/tabs.tsx           # nuevo
resources/js/components/ui/tooltip.tsx        # nuevo
resources/js/components/ui/separator.tsx      # nuevo
resources/js/components/ui/dropdown-menu.tsx # nuevo
resources/js/Pages/Dashboard/Settings.tsx     # inputs nativos → Input
AGENTS.md                                     # convención de alias
.specify/memory/design-tokens-charts.md       # tabla contraste AA
```

## Risks / Mitigations

- Radix tooltip/dropdown en React 19: usar builds recientes de radix-ui (ya usados por dialog/select existentes) — verificación por build.
- recharts no re-resuelve `var()` en SVG en SSR: si recharts pinta en cliente (sí, tras hydration) `var()` funciona; mitigación: uso de variables CSS estándar, no objetos JS.
- `type="time"`/`range` nativos: no forzar primitiva; estilizar con `accent-color` tokenizado.

## Rollout / Verification

1. `npm run build` en verde.
2. `php artisan test` en verde (80+).
3. Render visual de Stats y Settings en light/dark con contraste verificado (tabla en memory).
4. `grep -rE 'fill="#|stroke="#' resources/js` → vacío.
5. Commit atómico.
