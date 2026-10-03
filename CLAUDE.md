# CLAUDE.md

TimeLock — Laravel 13 + Inertia 3 + React 19 + Tailwind 4 sobre PostgreSQL 18, todo en Docker.

## Lee esto antes de tocar código

| Documento | Qué te dice |
|---|---|
| **`AGENTS.md`** | **Obligatorio.** Convención de componentes UI, tokens, pickers, i18n, fechas. |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Principios innegociables: Repository Pattern + Services, Spec-Driven Development, Test-First, design system tokenizado, paridad frontend-backend. |
| [`INVENTARIO.md`](INVENTARIO.md) | Historia de la migración desde Next.js y estado de cada fase. |
| [`README.md`](README.md) | Stack, arranque, comandos, arquitectura, rutas, modelo de datos. |
| [`specs/`](specs/) | Artefactos Spec Kit (spec / plan / tasks) de cada ciclo. |

## Entorno

**El host no puede ejecutar PHP.** Las dependencias exigen PHP ≥ 8.4.1 (Symfony 8.1) y el host
tiene 8.3.6, así que `php artisan` y `composer <script>` que invoquen PHP fallan ahí. El
contenedor `laravel.test` corre PHP 8.5.10.

```bash
./start.sh          # docker compose up -d + shell en laravel.test
./start.sh dev      # Vite con HMR (:5173, dentro del contenedor)
./start.sh build    # Vite build
```

Desde dentro del contenedor: `php artisan test`, `./vendor/bin/pint`, `npm run typecheck`,
`npm run build`. Desde el host, los scripts de `composer.json` ya delegan en Docker
(`composer test`, `composer lint`, `composer fix`, `composer typecheck`, `composer build`,
`composer seed`).

## Reglas rápidas

1. La lógica de negocio va en `app/Services`; los datos entran por las interfaces de
   `app/Repositories/Contracts`. **Nunca Eloquent directo en controladores.**
2. Nada de implementación sin artefactos Spec Kit aprobados.
3. `php artisan test` en verde antes de cada commit.
4. Todo color sale de `resources/css/app.css`. Prohibido hex inline en JSX.
5. Fechas: usar `DatePicker` / `TimePicker`, nunca `type="date"` ni `type="time"` nativos.
   Para el día de una actividad, comparar `a.date.slice(0, 10)`, nunca parsear `startAt`.
6. Todo texto visible pasa por `lib/i18n.tsx` (`useI18n()` → `t()`), es y en.
7. Las Pages solo orquestan; la lógica de módulo va en `Components/<dominio>`.
