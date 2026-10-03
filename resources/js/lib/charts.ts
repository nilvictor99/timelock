export const chartVar = (index: number): string => `var(--chart-${((index - 1) % 7) + 1})`;

export const CHART_COLORS: readonly string[] = Array.from({ length: 7 }, (_, i) => chartVar(i + 1));
