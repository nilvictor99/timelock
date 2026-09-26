<div align="center">

# TimeLock

**Schedule your activities, earn points, keep the streak and unlock rewards.**

A personal productivity app where the time you log turns into visible progress.

[![Laravel](https://img.shields.io/badge/Laravel-13.32-ff2d20?logo=laravel&logoColor=white)](https://laravel.com)
[![Inertia](https://img.shields.io/badge/Inertia-3.3-8080ff?logo=inertiajs&logoColor=white)](https://inertiajs.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-8.5-777bb4?logo=php&logoColor=white)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Pest](https://img.shields.io/badge/tests-Pest%20119%20passed-4b9560?logo=pestphp&logoColor=white)](#testing)
[![License](https://img.shields.io/badge/license-MIT-8b8b8b)](#license)

Español · [INVENTARIO](INVENTARIO.md) · [AGENTS](AGENTS.md)

</div>

---

## What it is

TimeLock is a personal productivity web application. The user plans activities with a start and
end time, completes them, accumulates **points** and a **streak** of consecutive days, and spends
those points on **rewards**. Every day is logged against a calendar, and a **suggestion** generator
(powered by AI or by rules, depending on configuration) proposes new activities based on the user's
profile.

The project started as a Next.js app (`timelock-v`) and was migrated to Laravel + Inertia + React,
preserving functional and visual parity. That process is documented step by step in
[`INVENTARIO.md`](INVENTARIO.md).

> **The whole stack runs in Docker.** The project dependencies require PHP ≥ 8.4.1, so
> `php artisan` and `composer` **do not work on the host**: always run them inside the container.
> See [Quick start](#quick-start).

---

## Features

| Feature | Where it lives | Endpoint |
|---|---|---|
| Register, login, logout | `Pages/{Register,Login}.tsx` | `POST /register` · `POST /login` · `POST /logout` |
| **QR login** (generate, scan, auto-renew every 60 s, download PNG/PDF) | `Pages/Login.tsx` · `Pages/Dashboard/Profile.tsx` · `Components/QrCode.tsx` · `Components/Auth/QrScanner.tsx` | `POST /auth/qr` · `POST /auth/qr-login` |
| Guided onboarding (name, timezone, language, mode) | `Pages/Onboarding.tsx` | `POST /api/bootstrap` `{action:"onboarding"}` |
| Create / delete activities | `Components/dashboard/ActivityForm.tsx` · `Pages/Dashboard/Activities.tsx` | `POST` / `DELETE /api/bootstrap` |
| Complete an activity and earn points (only once) | `Pages/Dashboard/Index.tsx` · `Activities.tsx` | `PATCH /api/bootstrap` |
| Floating timer with pause / snooze / finalize | `Components/dashboard/FloatingTimer.tsx` | `PATCH /api/bootstrap` |
| Points and streaks (current, best, milestones 3→25 days) | `Pages/Dashboard/Streak.tsx` | `GET /api/bootstrap` |
| Rewards: list and redeem | `Pages/Dashboard/Rewards.tsx` | `PATCH /api/rewards/{reward}` |
| AI or rule-based suggestions + "add to today" | `Pages/Dashboard/Suggestions.tsx` | `GET` / `POST /api/suggestions` |
| Statistics: 4 charts, KPIs, rewards and streak panels | `Pages/Dashboard/Stats.tsx` · `Components/stats/*` (9 components) | `GET /api/stats/summary` |
| Stats filters: date range + multi-select of activities and categories | `Components/stats/StatsFilters.tsx` · `@/components/ui/multi-select` | same endpoint (`?from&to&activities&categories`) |
| Day / week / month calendar, synced to the timezone | `Pages/Dashboard/Calendar.tsx` | `GET /api/bootstrap` |
| Export data (CSV, curated JSON, PDF) | `Pages/Dashboard/Export.tsx` · `Stats.tsx` | `GET /api/export` |
| Profile with ~30 fields, autosaved per field | `Pages/Dashboard/Profile.tsx` | `POST /api/bootstrap` `{action:"settings"}` |
| Avatar upload (jpg/png/webp, max 5 MB) | `Pages/Dashboard/Profile.tsx` | `POST /api/profile/avatar` |
| Change email (confirms password, invalidates sessions) | `Pages/Dashboard/Profile.tsx` | `POST /api/profile/email` |
| Pause mode (with reason and expiry) | `Pages/Dashboard/Settings.tsx` · `Components/dashboard/PauseBanner.tsx` | `POST /api/bootstrap` `{action:"pause"}` |
| Delete account (requires typing `DELETE_ACCOUNT`) | `Pages/Dashboard/Settings.tsx` | `DELETE /api/bootstrap` |
| Light / dark / system theme, with anti-FOUC | `lib/theme.tsx` · `views/app.blade.php` | `{action:"settings", theme}` |
| Spanish / English (526 keys, hot-swappable) | `lib/i18n.tsx` | `{action:"settings", language}` + `timelock_locale` cookie |
| Synchronous mode (fixed time) or free mode (duration only) | cross-cutting | `{action:"settings", operationMode}` |
| Live clock in the header | `Components/dashboard/LiveClock.tsx` | local |

---

## Stack

Exact versions according to `composer.lock` and `package.json`.

**Backend**

| | |
|---|---|
| PHP | 8.5.10 (container) |
| Laravel | 13.32.0 |
| Inertia Laravel | 3.3.4 |
| Laravel Sail | 1.67.0 |
| Pest | 4.7.8 · PHPUnit 12.5.33 |
| Pint | 1.32.1 (PHP code style) |
| Database | PostgreSQL 18.6 (image `postgres:18-alpine`) |
| Authentication | Custom: `timelock_session` cookie (SHA-256 + b64url hash, 30 days, bcrypt 12) |

**Frontend**

| | |
|---|---|
| React | 19.3 |
| TypeScript | 7.0 |
| Vite | 8.0 |
| Tailwind CSS | 4.0 (CSS-first, no `tailwind.config.js`) |
| Design system | shadcn on **radix-nova** primitives |
| Charts | Recharts 3.10 |
| Dates | date-fns 4.4 · react-day-picker 10.0 |
| QR | qrcode 1.5 (generation) · html5-qrcode 2.3 (scanning) |
| PDF | jspdf 4.2 |
| Validation | zod 4.6 |
| Icons | lucide-react |

**AI providers** (all optional, configurable in *Settings*): `OPENAI`, `OPENROUTER`, `NVIDIA_NIM`,
`ANTHROPIC`, `GEMINI`, `OLLAMA`, `CUSTOM`, `OPENCODE`. With no keys configured, the suggestion
generator falls back to rules.

---

## Requirements

- **Docker** with **Compose v2** (the only real requirement: the host needs neither PHP nor Node).
- Free ports: `80` (app) and `5173` (Vite). Configurable via `APP_PORT` / `VITE_PORT`.
- Roughly 2 GB of free RAM for the PHP + PostgreSQL container.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/nilvictor99/timelock.git
cd timelock

# 2. Environment
cp .env.example .env

# 3. Boot the containers and drop into a shell in the PHP container
./start.sh
```

`./start.sh` runs `docker compose up -d` and gives you a shell inside `laravel.test`. From there:

```bash
# 4. Database schema
php artisan migrate

# 5. (Optional) Sample data: demo@timelock.dev / password
php artisan db:seed

# 6. JS dependencies and production assets
npm install
npm run build

# 7. Start Vite with hot reload (in another terminal, or background this one)
./start.sh dev
```

Open **http://localhost** and log in with `demo@timelock.dev` / `password`.

Steps 2 to 5 are wrapped in `composer setup` and `composer seed`; the two Vite ones, in
`./start.sh dev` and `./start.sh build`.

> Vite **must** run inside the container: `compose.yaml` publishes port 5173 and mounts the project
> at `/var/www/html`. `./start.sh dev` already takes care of that.

### Without Docker

It also works with PHP 8.5 and PostgreSQL 18 installed on the host, but you have to replicate
`compose.yaml` by hand (extensions from `vendor/laravel/sail/runtimes/8.5`, the `www-data` user, the
project volume). The supported path is Sail.

---

## Commands

Since the host cannot execute PHP (see above), the `composer.json` scripts delegate to Docker.
These shortcuts work as-is from the project root:

```bash
composer setup      # install + .env + key:generate + migrate + npm install + build
composer dev        # Vite with HMR (:5173)
composer build      # Vite build
composer test       # full Pest suite
composer lint       # Pint in check mode (changes nothing)
composer fix        # Pint applies the formatting
composer typecheck  # tsc --noEmit
composer seed       # php artisan db:seed
```

And to work inside the container directly:

```bash
./start.sh                                   # interactive shell (same as "docker compose exec")

# Tests
docker compose exec laravel.test php artisan test
docker compose exec laravel.test php artisan test --filter=StatsServiceTest

# PHP code style
docker compose exec laravel.test ./vendor/bin/pint          # apply changes
docker compose exec laravel.test ./vendor/bin/pint --test   # check only

# Frontend
docker compose exec laravel.test npm run typecheck
docker compose exec laravel.test npm run build

# Database
docker compose exec laravel.test php artisan migrate
docker compose exec laravel.test php artisan migrate:fresh --seed

# Maintenance
docker compose exec laravel.test php artisan qr:prune   # purges expired QR tokens
```

The usual Sail shortcuts also work inside a Sail session:

```bash
./vendor/bin/sail artisan test
./vendor/bin/sail up -d
./vendor/bin/sail down
```

**`php artisan` and any `composer <script>` that invokes PHP fail on the host** with
`Composer detected issues in your platform: requires PHP >= 8.4.1`. That is not a bug: it is the
reason the whole workflow goes through Docker.

### Sample data

`composer seed` creates a demo user through the same process as a real registration (4 default
categories, 3 rewards) plus 14 days of history, points and a streak:

```
demo@timelock.dev / password
```

The seed is idempotent: if the user already exists, it changes nothing.

---

## Environment variables

``.env.example` covers everything needed, including `APP_TIMEZONE` and the AI block. These are the
points worth knowing:

| Variable | Why it matters |
|---|---|
| `APP_TIMEZONE` | **Required.** Postgres stores and interprets wall-clock time in this timezone, and the app serializes dates without offset (`Y-m-d\TH:i:s`). If it is missing or mismatched, the calendar and range filters shift by a day. |
| `DB_*` | Host `pgsql` (the Compose service name), not `127.0.0.1`. The same credentials are passed to Postgres as `POSTGRES_*`, so they must match. |
| `SESSION_DRIVER=file` · `CACHE_STORE=array` · `QUEUE_CONNECTION=sync` | The values the development environment uses. |
| `APP_PORT` · `VITE_PORT` | Ports published by Compose (`80` and `5173` by default). |
| `WWWUSER` · `WWWGROUP` | Used by `compose.yaml` for the container user. On Linux, normally your `id -u` / `id -g`. |
| `AI_PROVIDER` + `<PROVIDER>_API_KEY` | Optional. Also configurable from the UI under *Settings → AI integration*, which takes priority over these variables. |
| `APP_KEY` | Generated with `composer setup` or `php artisan key:generate` inside the container. |

### AI providers

If you prefer configuring them through the environment rather than the UI:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

Recognized keys: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
(or `GOOGLE_GEMINI_API_KEY`), `NVIDIA_API_KEY` (or `NVIDIA_NIM_API_KEY`), `OLLAMA_API_KEY`,
`CUSTOM_AI_API_KEY` and `OPENCODE_BASE_URL`. With none of them set, the app still works with the
rule-based generator.

---

## Architecture

### Layers

```
routes/web.php          (35 app routes; there is no routes/api.php)
        ↓
app/Http/Controllers    8 controllers, kept thin
        ↓
app/Services            10 services — all business logic lives here
        ↓
app/Repositories        7 interfaces (Contracts) + 7 Eloquent implementations
        ↓
app/Models              7 Eloquent models with UUIDs
```

`RepositoryServiceProvider` binds each interface to its implementation. **Eloquent never appears
directly in controllers.** This rule is non-negotiable per the project constitution
(`.specify/memory/constitution.md`).

Services: `ActivityService`, `AiService`, `AuthService`, `CategoryService`, `QrLoginTokenService`,
`RewardService`, `SessionService`, `StatsService`, `SuggestionService`, `UserService`.

### Authentication

Laravel's session driver is not used to authenticate. `AuthService` issues its own
`timelock_session` cookie, whose value is a random token of which only the hash is stored (SHA-256
in base64url). The `auth.session` middleware resolves it, it is listed in the `except` array of
`EncryptCookies`, and its expiry (30 days) is refreshed when the email or password changes. Changing
either one invalidates the user's other sessions.

**QR login:** `AuthService::createQrToken` generates a single-use token with a 10-minute TTL and
revokes any previous pending ones, so every new QR invalidates the old one. `POST /auth/qr-login`
is throttled to 10/min per IP, and the scheduled `qr:prune` command purges expired tokens daily.

### Frontend

Three component levels, where the capitalization convention is part of the contract:

| Path | Contains |
|---|---|
| `resources/js/components/ui/*` (lowercase) | 18 shadcn/radix-nova primitives: `badge`, `button`, `calendar`, `card`, `checkbox`, `date-picker`, `dialog`, `dropdown-menu`, `input`, `multi-select`, `popover`, `select`, `separator`, `skeleton`, `tabs`, `textarea`, `time-picker`, `tooltip`. |
| `resources/js/Components/<domain>/*` (uppercase) | Domain components: `dashboard/` (8), `stats/` (9), `Auth/QrScanner`, `QrCode`. They encapsulate each module's logic. |
| `resources/js/Pages/*` | 14 Inertia pages. **They only orchestrate**: they fetch data, delegate to components and handle form state. |

- **Tokens are mandatory.** Every color and visual state comes from `resources/css/app.css`
  (Tailwind v4 CSS-first, HSL tokens in `:root` and `.dark`). There is no inline hex in JSX. Charts
  consume `lib/charts.ts` (`CHART_COLORS`, `chartVar(n)`) on top of the `--chart-1..7` palette, with
  AA contrast in light and dark.
- **No native inputs.** Dates use `DatePicker` and times use `TimePicker`. The only exception is
  `type="range"`. Loading states use `Skeleton`.
- **i18n.** All visible text goes through `lib/i18n.tsx` (`useI18n()` → `t()`). 526 keys in Spanish
  and English, with the same key set in both languages. The language is persisted in
  `users.language` and shared through the `timelock_locale` cookie.
- **Theme.** `lib/theme.tsx` plus an inline anti-FOUC script in `app.blade.php` apply `.dark` before
  hydration. `ThemeProvider` is initialized from `auth.user.theme` and persisted in
  `localStorage['timelock-theme']`.

### Dates and timezone

A deliberate contract: the backend serializes **naive** dates (`Y-m-d\TH:i:s`, wall-clock, no
offset) in UI payloads, and the Postgres session uses `APP_TIMEZONE`. Matching activities by day
always goes through the `date` column (`a.date.slice(0, 10)`), never by parsing `startAt` into a
local date on the client.

### AI endpoints

`AiService` validates every outgoing request: only provider-authorized hosts, HTTPS only, and only
public IP resolution (anti-SSRF guard). Providers that do not respond degrade to the rule-based
generator instead of failing.

---

## Routes

35 application routes (plus `/up` for health checks). All of them live in `routes/web.php` under the
`web` group: **there is no `routes/api.php`**, the `/api/*` endpoints share the session and CSRF
with everything else.

**Public**

| Method | URI | |
|---|---|---|
| GET | `/` | Landing |
| GET · POST | `/login` | Login form (includes QR mode via `?qr=`) |
| GET · POST | `/register` | Register |
| POST | `/logout` | Ends the session |

**Session** (`auth.session` unless noted)

| Method | URI | |
|---|---|---|
| GET | `/onboarding` | First-run wizard; redirects to the dashboard once completed |
| GET | `/dashboard` | Home; redirects legacy `?tab=` links to their module route |
| GET | `/dashboard/{activities,calendar,export,profile,rewards,settings,stats,streak,suggestions}` | Module pages |
| GET | `/auth/me` | Current session user |
| POST | `/auth/qr` | Generates a QR token |
| POST | `/auth/qr-login` | Consumes a QR token (`throttle:10,1`) |

**API**

| Method | URI | |
|---|---|---|
| GET | `/api/bootstrap` | Initial load: user, activities, categories, rewards, `today` |
| POST | `/api/bootstrap` | `action: activity` · `settings` · `onboarding` · `pause` · `reward` |
| PATCH | `/api/bootstrap` | Marks an activity as completed (credits points) |
| DELETE | `/api/bootstrap` | Deletes an activity (`?id=`) or the account (`{email, confirmation}`) |
| PATCH | `/api/rewards/{reward}` | Redeems a reward |
| GET | `/api/stats/summary` | Stats aggregation with `from`, `to`, `activities`, `categories` filters |
| GET | `/api/export` | `format=csv` (default) or `format=json`; `from` / `to` filters |
| GET · POST | `/api/suggestions` | List recent · generate / regenerate |
| POST | `/api/ai/test-connection` | Tests the AI configuration |
| POST | `/api/profile/avatar` | Avatar upload |
| POST | `/api/profile/email` | Email change |
| POST | `/api/profile/password` | Password change |

The client talks to the API through `lib/api.ts`, which injects an `X-XSRF-TOKEN` header read from
the `XSRF-TOKEN` cookie on every non-GET request. Without it, Laravel answers 419.

---

## Data model

7 domain tables, all with a text UUID primary key.

| Table | Contents |
|---|---|
| `users` | ~60 columns: profile, interests, preferences, notifications, AI configuration, `points`, `current_streak`, `best_streak`, `pause_*`, `theme`, `language`. `password_hash` is flagged as hidden and is never serialized. |
| `sessions` | Active sessions: unique `token_hash`, `expires_at`. |
| `categories` | `unique(user_id, name)`, `color`, `points_per_hour`. |
| `activities` | `title`, `date`, `start_at`, `end_at`, `status`, `points`, `is_free`, `completed_at`, `category_id`. Indexes on `(user_id, date)` and `(user_id, start_at)`. |
| `rewards` | `title`, `cost`, `redeemed_at`. |
| `qr_login_tokens` | Unique `token_hash`, `expires_at`, `used_at` (single use). |
| `suggestions` | `title`, `category`, `duration`, `reason`, `points`, `source` (`ai` \| `rule`). |

The "enums" (`PLANNED`/`COMPLETED`, `SYNCHRONOUS`/`FREE`, `LIGHT`/`DARK`/`SYSTEM`) are text columns
with defaults, not Postgres `enum` types: the models in `app/Models` declare the matching `casts`.
Laravel also creates `cache`, `cache_locks`, `jobs`, `job_batches` and `failed_jobs` through its
standard migrations.

---

## Testing

Pest suite with **119 tests and 503 assertions**, all green.

```bash
composer test
docker compose exec laravel.test php artisan test --filter=AuthServiceTest
```

```
tests/
├── Pest.php                     RefreshDatabase in Feature, TestCase in Unit
├── Concerns/WithSessionClient.php
├── Feature/
│   ├── Api/          AiApiTest · BootstrapApiTest · ExportApiTest · ProfileApiTest
│   │                 RewardRedeemTest · StatsSummaryApiTest · SuggestionsApiTest
│   ├── Auth/         AuthHttpTest
│   ├── Database/     DatabaseSeederTest
│   ├── Repositories/ ActivityRepositoryTest · CoreRepositoriesTest · UserRepositoryTest
│   ├── Services/     AuthServiceTest · StatsServiceTest
│   └── Web/          InertiaPagesTest
└── Unit/Services/    AiServiceTest
```

Three conventions worth knowing before writing a test:

- `tests/Concerns/WithSessionClient.php` handles the awkward part: `authenticate()` registers a user
  through `AuthService` and returns the token, and `withTimelockSession()` injects it as an
  **unencrypted** cookie, which is what the middleware expects.
- Repository and service tests rely on the global bindings in `tests/Pest.php`; API and web tests
  declare `uses(RefreshDatabase::class, WithSessionClient::class)` explicitly.
- `tests/Feature/Database/DatabaseSeederTest.php` covers the factory and the seeder. It is not
  decorative: both used to fail silently because the `users` table is not Laravel's default one, so
  the test is the safety net for that divergence.

---

## Development workflow

The project follows **Spec-Driven Development** with [Spec Kit](https://github.com/github/spec-kit).
The constitution is explicit: *no implementation code without approved artifacts (spec → plan →
tasks)*.

```
specs/
├── 001-design-system-ui/            spec.md · plan.md · tasks.md
├── 002-stats-redesign/
├── 003-modulos-rutas/
└── 004-calendario-filtros-multiselect/
.specify/memory/
├── constitution.md                  the project's non-negotiable principles
├── decisiones-normalizacion.md
├── design-system-audit.md
└── design-tokens-charts.md
```

Principles that govern the code (`.specify/memory/constitution.md`):

1. **Repository Pattern + Services.** Logic lives in `app/Services`; data access goes through the
   interfaces in `app/Repositories/Contracts`.
2. **Spec-Driven Development.** Spec Kit artifacts before implementing.
3. **Test-First.** `php artisan test` green before every commit.
4. **Tokenized design system.** No inline hex, no styles that duplicate primitives.
5. **Frontend-backend parity.** Heavy computation happens in the backend; the client renders.

---

## Related documentation

| Document | What it's for |
|---|---|
| [`INVENTARIO.md`](INVENTARIO.md) | Full history of the migration from Next.js, with the state of every phase. |
| [`AGENTS.md`](AGENTS.md) | Design system UI conventions (mandatory for agents and the team). |
| [`CLAUDE.md`](CLAUDE.md) | Operational summary for agents: what to read, how to run commands, key rules. |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Non-negotiable principles and workflow. |
| [`specs/`](specs/) | Specs, plans and tasks for each work cycle. |

---

## Project status

What works and has been verified, and what does not yet:

**Verified**
- 119 Pest tests green (503 assertions).
- `composer lint` (Pint) clean across all 101 files.
- `npm run typecheck` clean.
- `npm run build` succeeds.
- `composer seed` produces a loginable demo user, with categories, rewards and history.
- Critical end-to-end flow verified with `curl` against the container: landing, login, register,
  full QR login (create → consume → session cookie), all dashboard pages, and `/api/bootstrap`
  without leaking `password_hash`.

**Pending**
- Manual light/dark visual validation in a browser (the capture protocol is not available in the
  current environment). There is a manual checklist in `INVENTARIO.md`.
- `POST /api/profile/password` is implemented and tested on the backend, but the profile UI does not
  consume it yet.
- The backend can create rewards (`POST /api/bootstrap` with `action: "reward"`), but there is no
  interface for it; rewards are created directly in the database or by the seed.

---

## License

MIT. This project is open source software; see the license file for details.
