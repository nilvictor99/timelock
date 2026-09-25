<laravel-boost-guidelines>
# Laravel Application

This repository contains a Laravel application. Complete the following setup before working on the user's request.

## Prerequisites

Verify that PHP and Composer are available:

```sh
php -v
composer -V
```

If either command is unavailable, detect the user's operating system and install the prerequisites with the appropriate command:

macOS:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/mac/8.5)"
```

Windows PowerShell:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://php.new/install/windows/8.5'))
```

Linux:

```sh
/bin/bash -c "$(curl -fsSL https://php.new/install/linux/8.5)"
```

After installation, ask the user to restart their terminal. If the agent needs the restarted shell to continue, ask the user to reopen their terminal and rerun their original prompt.

## Agent Setup

Install Laravel Boost from the application root before making application changes:

```sh
composer require laravel/boost --dev
php artisan boost:install
```

Boost replaces these bootstrap instructions with guidelines tailored to the application. After installation, read `AGENTS.md` again and continue with the user's original request using the generated guidelines.
</laravel-boost-guidelines>

## Convención de componentes UI (design system Timelock)

- **`@/components/ui/*`** (minúsculas): primitivas shadcn/radix-nova (button, card, input, badge, checkbox, select, textarea, dialog, skeleton, tabs, tooltip, separator, dropdown-menu, popover, calendar, date-picker, time-picker, multi-select). Nunca duplicar sus estilos con clases manuales.
- **`@/Components/<dominio>/*`** (mayúsculas): componentes de dominio (dashboard, stats, auth...). Encapsulan lógica de módulo; las Pages solo orquestan.
- **Tokens obligatorios**: todo color/estado visual sale de `resources/css/app.css`. Prohibido hex inline en JSX (verificar: `grep -rE 'fill="#|stroke="#' resources/js`).
- **Charts**: consumir `resources/js/lib/charts.ts` (`CHART_COLORS`, `chartVar(n)`) — paleta `--chart-1..7` con contraste AA light/dark (ver `.specify/memory/design-tokens-charts.md`).
- **Inputs de fecha**: usar `DatePicker` (`@/components/ui/date-picker`); nunca `type="date"` nativo.
- **Inputs de hora**: usar `TimePicker` (`@/components/ui/time-picker`); nunca `type="time"` nativo.
- **Excepción nativa restante**: solo `type="range"` (`accent-ring`).
- **Estados de carga**: usar `Skeleton`; no spinners improvisados.
- **Fechas y zona horaria**: backend serializa naive (`Y-m-d\TH:i:s`, wall-clock, sin offset) en payloads de UI; la sesión Postgres usa `APP_TIMEZONE` (`.env`). El match por día de actividades usa la columna `date` (`a.date.slice(0,10)`), nunca parsear `startAt` a fecha local.
- **Dirección visual**: dashboard-design + minimalismo (jerarquía tipográfica, whitespace generoso, bordes 1px, sin sombras decorativas).
- **Texto visible**: siempre vía `lib/i18n.tsx` (es/en).
