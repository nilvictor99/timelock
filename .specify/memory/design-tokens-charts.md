# Design Tokens — Paleta de Charts (`--chart-1..7`)

Definidos en `resources/css/app.css` (light `:root`, dark `.dark`). Consumidos vía `resources/js/lib/charts.ts` (`CHART_COLORS`, `chartVar(n)`). Hex inline en JSX de gráficas: **prohibido**.

Mapeo semántico-secuencial: 1=primario (línea evolución diaria), 2=éxito (top actividades), 3=alerta (tendencia recompensas), 4=informativo (cumplimiento por día), 5-7=categorías del pie.

## Contraste verificado (WCAG, gráficos ≥3:1 contra `--card`)

| Token | Light HSL | vs card blanco | Dark HSL | vs card #141414 |
|---|---|---|---|---|
| --chart-1 (azul) | 217 91% 48% | 5.42:1 | 217 91% 65% | 6.06:1 |
| --chart-2 (verde) | 142 72% 36% | 3.48:1 | 142 72% 50% | 10.00:1 |
| --chart-3 (naranja) | 21 90% 48% | 3.56:1 | 21 90% 60% | 6.92:1 |
| --chart-4 (violeta) | 271 81% 43% | 8.00:1 | 271 81% 60% | 3.95:1 |
| --chart-5 (cian) | 189 94% 36% | 3.42:1 | 189 94% 50% | 10.24:1 |
| --chart-6 (rosa) | 330 81% 50% | 4.34:1 | 330 81% 60% | 5.18:1 |
| --chart-7 (ámbar) | 45 98% 32% | 3.95:1 | 45 93% 47% | 9.31:1 |

Regla de repetición: la 8ª categoría reinicia el ciclo (`chartVar` aplica módulo 7).
Los colores de categoría definidos por el usuario en BD (`activity.category.color`) tienen prioridad sobre el fallback de paleta — son datos, no estilos del sistema.
