# Tasks: Sistema de Diseño UI — Tokens, Charts y Primitivas (Fase 1)

**Input**: `specs/001-design-system-ui/plan.md` + `spec.md`

**Prerequisites**: plan.md, spec.md

**Tests**: Gate de verificación por task: `npm run build` verde; al cierre `php artisan test` verde.

**Organization**: Tasks agrupadas por user story (US1 charts, US2 inputs, US3 primitivas) + shared.

## Phase 1: Tokens de charts (US1)

- [x] **1.1** [P?] [US1] Definir en `resources/css/app.css` los tokens `--chart-1..--chart-7` para tema claro: paleta semántico-secuencial con saturación real (ej. 1=azul primario, 2=verde éxito, 3=naranja alerta, 4=violeta, 5=cian, 6=rosa, 7=ámbar), contraste ≥3:1 contra `--card`.
- [x] **1.2** [P?] [US1] Definir las 7 contrapartes en el bloque `.dark` con luminosidad ajustada a fondos oscuros (contraste ≥3:1 contra `--card` oscuro).
- [x] **1.3** [P?] [US1] Crear utilidad `chartVar(n)` o constante `CHART_COLORS` en `resources/js/lib/charts.ts` que devuelva `var(--chart-N)` — único punto de referencia para recharts.
- [x] **1.4** [P?] [US1] Reemplazar en `resources/js/Pages/Dashboard/Stats.tsx:46` el array de 7 hex por la utilidad de 1.3; sustituir `stroke="#2563eb"` (l.412), `fill="#16a34a"` (l.423), `fill="#9333ea"` (l.434), `fill="#ea580c"` (l.473) por `var(--chart-N)` según mapeo.
- [x] **1.5** [P?] [US1] Verificación: `grep -rE 'fill="#|stroke="#' resources/js` vacío; render light/dark con contraste OK. Documentar tabla de contraste en `.specify/memory/design-tokens-charts.md`.

## Phase 2: Primitivas UI (US3)

- [x] **2.1** [P] [US3] Añadir `resources/js/components/ui/skeleton.tsx` (pulse, sin sombra, radius token, light/dark).
- [x] **2.2** [P] [US3] Añadir `resources/js/components/ui/tabs.tsx` (Radix tabs, estilo minimal: indicador 1px, sin sombra).
- [x] **2.3** [P] [US3] Añadir `resources/js/components/ui/tooltip.tsx` (Radix tooltip, fondo `--popover`, borde 1px).
- [x] **2.4** [P] [US3] Añadir `resources/js/components/ui/separator.tsx` (1px `--border`).
- [x] **2.5** [P] [US3] Añadir `resources/js/components/ui/dropdown-menu.tsx` (Radix dropdown, alineado con dialog/select existentes).
- [x] **2.6** [P] [US3] Verificación: `npm run build` verde; render manual de cada primitiva en light/dark.

## Phase 3: Settings (US2)

- [x] **3.1** [?] [US2] Eliminar `inputClass` de `resources/js/Pages/Dashboard/Settings.tsx:380`.
- [x] **3.2** [?] [US2] Migrar a `Input` los inputs de texto de `Settings.tsx:462,569,591,677,678,707,763`.
- [x] **3.3** [?] [US2] Estilizar `type="time"` (l.549,553) y `type="range"` (l.564) con tokens (`accent-color`) y documentar la excepción en el plan/memory.
- [x] **3.4** [?] [US2] Verificación: `grep -n 'inputClass' Settings.tsx` vacío; focus ring uniforme en todos los campos.

## Phase 4: Cierre

- [x] **4.1** [?] [ALL] Documentar convención de alias en `AGENTS.md` (`@/components/ui` primitivas · `@/Components/<dominio>` dominio).
- [x] **4.2** [?] [ALL] Correr `php artisan test` (80+ en verde) y `npm run build`.
- [x] **4.3** [?] [ALL] Commit atómico: `design-system: tokens charts AA, 5 primitivas UI, Settings a Input`.

## Verification Checklist

- [x] SC-001: 0 hex inline en JSX de gráficas
- [x] SC-002: tabla de contraste AA documentada
- [x] SC-003: 5 primitivas renderizando light/dark
- [x] SC-004: Pest + build en verde
- [x] SC-005: Settings sin `inputClass`
