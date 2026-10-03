# Feature Specification: Sistema de Diseño UI — Tokens, Charts y Primitivas (Fase 1)

**Feature Branch**: `001-design-system-ui`

**Created**: 2026-09-24

**Status**: Draft

**Input**: User description: "Normalizar la estética inconsistente de la app Laravel: tokens de diseño unificados (dashboard-design + minimalismo), paleta de charts semántica adaptada a light/dark, primitivas UI faltantes, migración de inputs nativos y convención de componentes documentada. Prioridad en preparar la base que consumirá el rediseño del módulo Estadísticas."

**Contexto**: Ver auditoría completa en `.specify/memory/design-system-audit.md`. Hallazgos clave: tokens `--chart-1..5` en gris inservibles para datos categóricos (`app.css:30-34`); `Stats.tsx` hardcodea 7 hex y no adapta dark mode (`Stats.tsx:46,412-473`); 10+ inputs nativos en `Settings.tsx`; faltan primitivas skeleton/tabs/tooltip/separator/dropdown-menu; convención de alias `@/components/ui` vs `@/Components/*` sin documentar.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gráficas coherentes con el tema (Priority: P1)

Como usuario del dashboard, quiero que las gráficas de Estadísticas usen la misma paleta que el resto de la app y se adapten automáticamente al modo claro/oscuro, para que el módulo se sienta parte del mismo producto y sea legible en ambos temas.

**Why this priority**: Es la causa nº1 de la percepción de "estética inconsistente" y el bloqueo directo del rediseño de Stats (Fase 2).

**Independent Test**: Renderizar Stats en light y dark: todas las barras/líneas/sectores consumen `var(--chart-N)`; al alternar tema los colores cambian sin recargar y mantienen contraste AA.

**Acceptance Scenarios**:

1. **Given** un usuario en tema claro **When** abre `/dashboard/stats` **Then** las 7 categorías del pie usan colores de `--chart-1..7` con contraste AA contra el fondo de tarjeta.
2. **Given** un usuario en tema oscuro **When** abre `/dashboard/stats` **Then** las mismas gráficas muestran variantes oscuras de la paleta (sin hex hardcodeado).
3. **Given** el código fuente de cualquier gráfica **When** se busca `#[0-9a-f]{6}` inline **Then** no existen colores hex literales en JSX de gráficas.

### User Story 2 - Inputs consistentes en todos los formularios (Priority: P2)

Como usuario que configura notificaciones, IA o borra su cuenta, quiero que todos los campos se vean y se comporten igual (focus ring, error, disabled), para que el Settings no parezca parcheado.

**Why this priority**: Los inputs nativos de `Settings.tsx` pierden estados visuales y rompen la uniformidad percibida.

**Independent Test**: Navegar por Settings: los 10+ inputs nativos (`Settings.tsx:462,549,553,564,569,591,677,678,707,763`) usan la primitiva `Input`/`Select`; el `inputClass` manual (`Settings.tsx:380`) desaparece.

**Acceptance Scenarios**:

1. **Given** Settings abierto **When** se enfoca cualquier campo **Then** muestra el focus ring estándar del sistema.
2. **Given** el código de Settings **When** se busca `<input` nativo **Then** solo existen los casos tipo time/range/checkbox envueltos por primitivas o documentados como excepción.

### User Story 3 - Estados de carga y navegación uniformes (Priority: P3)

Como usuario en conexiones lentas, quiero skeletons mientras cargan datos y componentes de tabs/tooltip coherentes, para no ver saltos de layout ni spinners improvisados distintos por módulo.

**Why this priority**: Sin `skeleton`/`tabs`/`tooltip`/`separator`/`dropdown-menu` cada página improvisa, generando las diferencias visuales entre módulos.

**Independent Test**: Las primitivas existen en `resources/js/components/ui/`, renderizan en light/dark, y al menos Stats y Settings las consumen.

**Acceptance Scenarios**:

1. **Given** latencia de red simulada **When** Stats carga **Then** se muestran skeletons con el mismo radius/spacing de las tarjetas.
2. **Given** cualquier tooltip de la app **When** aparece **Then** usa la primitiva `tooltip` con colores de tokens.

### Edge Cases

- Paleta de 7 categorías pero usuario con >7 categorías: la 8ª repite ciclo de la paleta (documentado en plan).
- Daltonismo: los colores no son el único canal de información (las gráficas conservan etiquetas/leyendas).
- Tema "system": los tokens deben responder al cambio en caliente (clase `.dark` en `<html>`, ya existente).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST definir tokens `--chart-1`..`--chart-7` en `app.css` para tema claro con saturación real y contraste AA (≥4.5:1 texto / ≥3:1 gráficos) contra `--card`.
- **FR-002**: El sistema MUST definir las contrapartes de los tokens de charts en `.dark` ajustadas para fondos oscuros.
- **FR-003**: Las gráficas (recharts) MUST consumir exclusivamente `var(--chart-N)`; hex inline en JSX queda prohibido (verificable por grep).
- **FR-004**: El sistema MUST proveer primitivas `skeleton`, `tabs`, `tooltip`, `separator` y `dropdown-menu` con estilo minimalista (borde 1px sutil o sin borde, sin sombras decorativas) y soporte light/dark.
- **FR-005**: Settings MUST reemplazar todos los `<input>` con `inputClass` manual por la primitiva `Input` (excepciones documentadas: `type="time"`, `type="range"`).
- **FR-006**: La convención de alias MUST quedar documentada en `AGENTS.md`: `@/components/ui` primitivas · `@/Components/<dominio>` dominio.
- **FR-007**: Los tokens existentes (colors, radius, spacing actuales) MUST conservarse retrocompatible — este cambio no rompe las páginas ya migradas.
- **FR-008**: Todo texto nuevo visible MUST estar en `lib/i18n.tsx` (es/en).

### Key Entities

- **Design tokens** (`resources/css/app.css`): paleta charts light/dark, resto hereda del sistema shadcn existente.
- **Primitivas UI** (`resources/js/components/ui/`): skeleton, tabs, tooltip, separator, dropdown-menu (estilo radix-nova ya registrado en `components.json`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 colores hex inline en JSX de gráficas (`grep -rE 'fill="#|stroke="#' resources/js` sin resultados).
- **SC-002**: Contraste AA verificado para `--chart-1..7` en light y dark (tabla de ratios en el plan).
- **SC-003**: 5 primitivas nuevas renderizando en light/dark con story visual mínima por primitiva (sección en la página de verificación o tests de render).
- **SC-004**: Suite Pest completa en verde (`php artisan test`) y `npm run build` sin errores tras el cambio.
- **SC-005**: `Settings.tsx` sin `inputClass` manual ni inputs nativos no documentados.

## Assumptions

- Se mantiene la base shadcn/radix-nova y Tailwind v4 existente; no se cambia framework de estilos.
- El primary monocromo de la app se conserva; la paleta de charts es semántica-secuencial (1=primario, 2=éxito, 3=alerta, 4=informativo...).
- `type="time"` y `type="range"` nativos se estilizan via CSS tokens dado que shadcn no los cubre; se documenta como excepción.
- El rediseño completo del layout de Stats (backend, StatsService) es Fase 2 — aquí solo se habilita la base visual.
