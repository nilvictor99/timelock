<div align="center">

# TimeLock

**Agenda tus actividades, gana puntos, mantén la racha y desbloquea recompensas.**

Una app de productividad personal donde el tiempo que registras se convierte en progreso visible.

[![Laravel](https://img.shields.io/badge/Laravel-13.32-ff2d20?logo=laravel&logoColor=white)](https://laravel.com)
[![Inertia](https://img.shields.io/badge/Inertia-3.3-8080ff?logo=inertiajs&logoColor=white)](https://inertiajs.com)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PHP](https://img.shields.io/badge/PHP-8.5-777bb4?logo=php&logoColor=white)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169e1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Pest](https://img.shields.io/badge/tests-Pest%20119%20passed-4b9560?logo=pestphp&logoColor=white)](#testing)
[![License](https://img.shields.io/badge/license-MIT-8b8b8b)](#licencia)

[English](README.en.md) · [INVENTARIO](INVENTARIO.md) · [AGENTS](AGENTS.md)

</div>

---

## Qué es

TimeLock es una aplicación web de productividad personal. El usuario planifica actividades con
hora de inicio y fin, las completa, acumula **puntos** y una **racha** de días consecutivos, y gasta
esos puntos en **recompensas**. Cada día se registra contra un calendario, y un generador de
**sugerencias** (con IA o por reglas, según configuración) propone nuevas actividades a partir del
perfil del usuario.

El proyecto nació como una app Next.js (`timelock-v`) y fue migrada a Laravel + Inertia +
React, conservando paridad funcional y visual. Ese proceso está documentado paso a paso en
[`INVENTARIO.md`](INVENTARIO.md).

> **Todo el stack corre en Docker.** Las dependencias del proyecto exigen PHP ≥ 8.4.1, así que
> `php artisan` y `composer` **no funcionan en el host**: úsalos siempre dentro del contenedor.
> Ver [Arranque rápido](#arranque-rápido).

---

## Features

| Feature | Dónde vive | Endpoint |
|---|---|---|
| Registro, login, logout | `Pages/{Register,Login}.tsx` | `POST /register` · `POST /login` · `POST /logout` |
| **Login por QR** (generar, escanear, auto-renovar 60 s, descargar PNG/PDF) | `Pages/Login.tsx` · `Pages/Dashboard/Profile.tsx` · `Components/QrCode.tsx` · `Components/Auth/QrScanner.tsx` | `POST /auth/qr` · `POST /auth/qr-login` |
| Onboarding guiado (nombre, zona horaria, idioma, modo) | `Pages/Onboarding.tsx` | `POST /api/bootstrap` `{action:"onboarding"}` |
| Crear / eliminar actividades | `Components/dashboard/ActivityForm.tsx` · `Pages/Dashboard/Activities.tsx` | `POST` / `DELETE /api/bootstrap` |
| Completar actividad y ganar puntos (una sola vez) | `Pages/Dashboard/Index.tsx` · `Activities.tsx` | `PATCH /api/bootstrap` |
| Timer flotante con pausa / snooze / finalizar | `Components/dashboard/FloatingTimer.tsx` | `PATCH /api/bootstrap` |
| Puntos y rachas (actual, mejor, hitos 3→25 días) | `Pages/Dashboard/Streak.tsx` | `GET /api/bootstrap` |
| Recompensas: listar y canjear | `Pages/Dashboard/Rewards.tsx` | `PATCH /api/rewards/{reward}` |
| Sugerencias por IA o por reglas + "añadir a hoy" | `Pages/Dashboard/Suggestions.tsx` | `GET` / `POST /api/suggestions` |
| Estadísticas: 4 gráficos, KPIs, panel de rachas y recompensas | `Pages/Dashboard/Stats.tsx` · `Components/stats/*` (9 componentes) | `GET /api/stats/summary` |
| Filtros de stats: rango de fechas + multi-select de actividades y categorías | `Components/stats/StatsFilters.tsx` · `@/components/ui/multi-select` | idem anterior (`?from&to&activities&categories`) |
| Calendario día / semana / mes, sincronizado con la zona horaria | `Pages/Dashboard/Calendar.tsx` | `GET /api/bootstrap` |
| Exportar datos (CSV, JSON curado, PDF) | `Pages/Dashboard/Export.tsx` · `Stats.tsx` | `GET /api/export` |
| Perfil con ~30 campos y autosave por campo | `Pages/Dashboard/Profile.tsx` | `POST /api/bootstrap` `{action:"settings"}` |
| Subir avatar (jpg/png/webp, máx 5 MB) | `Pages/Dashboard/Profile.tsx` | `POST /api/profile/avatar` |
| Cambiar email (confirma contraseña, invalida sesiones) | `Pages/Dashboard/Profile.tsx` | `POST /api/profile/email` |
| Modo pausa (con motivo y vencimiento) | `Pages/Dashboard/Settings.tsx` · `Components/dashboard/PauseBanner.tsx` | `POST /api/bootstrap` `{action:"pause"}` |
| Eliminar cuenta (requiere escribir `DELETE_ACCOUNT`) | `Pages/Dashboard/Settings.tsx` | `DELETE /api/bootstrap` |
| Tema claro / oscuro / sistema, con anti-FOUC | `lib/theme.tsx` · `views/app.blade.php` | `{action:"settings", theme}` |
| Idioma es / en (526 claves, conmutables en caliente) | `lib/i18n.tsx` | `{action:"settings", language}` + cookie `timelock_locale` |
| Modo sincrónico (hora fija) o libre (solo duración) | transversal | `{action:"settings", operationMode}` |
| Reloj en vivo en el header | `Components/dashboard/LiveClock.tsx` | local |

---

## Stack

Versiones exactas según `composer.lock` y `package.json`.

**Backend**

| | |
|---|---|
| PHP | 8.5.10 (contenedor) |
| Laravel | 13.32.0 |
| Inertia Laravel | 3.3.4 |
| Laravel Sail | 1.67.0 |
| Pest | 4.7.8 · PHPUnit 12.5.33 |
| Pint | 1.32.1 (formato de código PHP) |
| Base de datos | PostgreSQL 18.6 (imagen `postgres:18-alpine`) |
| Autenticación | Propia: cookie `timelock_session` (hash SHA-256 + b64url, 30 días, bcrypt 12) |

**Frontend**

| | |
|---|---|
| React | 19.3 |
| TypeScript | 7.0 |
| Vite | 8.0 |
| Tailwind CSS | 4.0 (CSS-first, sin `tailwind.config.js`) |
| Design system | shadcn sobre primitivas **radix-nova** |
| Gráficos | Recharts 3.10 |
| Fechas | date-fns 4.4 · react-day-picker 10.0 |
| QR | qrcode 1.5 (generación) · html5-qrcode 2.3 (escaneo) |
| PDF | jspdf 4.2 |
| Validación | zod 4.6 |
| Iconos | lucide-react |

**Proveedores de IA** (todos opcionales, configurables en *Ajustes*): `OPENAI`, `OPENROUTER`,
`NVIDIA_NIM`, `ANTHROPIC`, `GEMINI`, `OLLAMA`, `CUSTOM`, `OPENCODE`. Sin claves, el generador de
sugerencias funciona por reglas.

---

## Requisitos

- **Docker** con **Compose v2** (único requisito real: el host no necesita PHP ni Node).
- Puertos libres: `80` (app) y `5173` (Vite). Configurables con `APP_PORT` / `VITE_PORT`.
- About 2 GB de RAM libres para el contenedor PHP + PostgreSQL.

---

## Arranque rápido

```bash
# 1. Clonar
git clone https://github.com/nilvictor99/timelock.git
cd timelock

# 2. Variables de entorno
cp .env.example .env

# 3. Levantar contenedores y abrir una shell dentro del contenedor PHP
./start.sh
```

`./start.sh` ejecuta `docker compose up -d` y te deja una shell en `laravel.test`. Desde ahí:

```bash
# 4. Esquema de base de datos
php artisan migrate

# 5. (Opcional) Datos de ejemplo: demo@timelock.dev / password
php artisan db:seed

# 6. Dependencias de JS y assets de producción
npm install
npm run build

# 7. Arrancar Vite con hot reload (en otra terminal, o deja esta en background)
./start.sh dev
```

Abre **http://localhost** e inicia sesión con `demo@timelock.dev` / `password`.

Los pasos 2 a 5 están encapsulados en `composer setup` y `composer seed`; los dos de Vite, en
`./start.sh dev` y `./start.sh build`.

> Vite **debe** correr dentro del contenedor: `compose.yaml` publica el puerto 5173 y monta el
> proyecto en `/var/www/html`. `./start.sh dev` ya se encarga de esto.

### Sin Docker

También funciona con un PHP 8.5 y PostgreSQL 18 instalados en el host, pero hay que replicar a mano
el `compose.yaml` (extensiones de `vendor/laravel/sail/runtimes/8.5`, usuario `www-data`, volumen del
proyecto). El camino soportado es Sail.

---

## Comandos

Como el host no puede ejecutar PHP (ver arriba), los scripts de `composer.json` delegan en Docker.
Estos atajos funcionan tal cual desde la raíz del proyecto:

```bash
composer setup      # install + .env + key:generate + migrate + npm install + build
composer dev        # Vite con HMR (:5173)
composer build      # Vite build
composer test       # suite Pest completa
composer lint       # Pint en modo check (no modifica nada)
composer fix        # Pint aplica el formato
composer typecheck  # tsc --noEmit
composer seed       # php artisan db:seed
```

Y para trabajar dentro del contenedor directamente:

```bash
./start.sh                                   # shell interactiva (equivalente a "docker compose exec")

# Tests
docker compose exec laravel.test php artisan test
docker compose exec laravel.test php artisan test --filter=StatsServiceTest

# Formato de código PHP
docker compose exec laravel.test ./vendor/bin/pint          # aplica cambios
docker compose exec laravel.test ./vendor/bin/pint --test   # solo verifica

# Frontend
docker compose exec laravel.test npm run typecheck
docker compose exec laravel.test npm run test:frontend   # lógica pura de cámara
docker compose exec laravel.test npm run build

# Base de datos
docker compose exec laravel.test php artisan migrate
docker compose exec laravel.test php artisan migrate:fresh --seed

# Mantenimiento
docker compose exec laravel.test php artisan qr:prune   # purga tokens QR caducados
```

Dentro de una sesión Sail también funcionan los atajos habituales:

```bash
./vendor/bin/sail artisan test
./vendor/bin/sail up -d
./vendor/bin/sail down
```

**`php artisan` y `composer <script>` que invoquen PHP fallan en el host** con
`Composer detected issues in your platform: requires PHP >= 8.4.1`. No es un bug: es la razón por la
que todo el flujo pasa por Docker.

### Datos de ejemplo

`composer seed` crea un usuario demo con el mismo proceso que un registro real (4 categorías por
defecto, 3 recompensas) más 14 días de historial, puntos y racha:

```
demo@timelock.dev / password
```

El seed es idempotente: si el usuario ya existe, no toca nada.

---

## Variables de entorno

`.env.example` cubre todo lo necesario, incluido `APP_TIMEZONE` y el bloque de IA. Los puntos que
conviene conocer:

| Variable | Por qué importa |
|---|---|
| `APP_TIMEZONE` | **Obligatoria.** Postgres almacena e interpreta el wall-clock en esta zona horaria, y la app serializa fechas sin offset (`Y-m-d\TH:i:s`). Si falta o no coincide, el calendario y los filtros por rango se desplazan de día. |
| `DB_*` | Host `pgsql` (el nombre del servicio en Compose), no `127.0.0.1`. Las mismas credenciales se pasan a Postgres como `POSTGRES_*`, así que deben coincidir. |
| `SESSION_DRIVER=file` · `CACHE_STORE=array` · `QUEUE_CONNECTION=sync` | Valores que usa el entorno de desarrollo. |
| `APP_PORT` · `VITE_PORT` | Puertos publicados por Compose (`80` y `5173` por defecto). |
| `WWWUSER` · `WWWGROUP` | Los usa `compose.yaml` para el usuario del contenedor. En Linux, normalmente tu `id -u` / `id -g`. |
| `AI_PROVIDER` + `<PROVIDER>_API_KEY` | Opcionales. Configurables también desde la UI en *Ajustes → Integración IA*, que tiene prioridad sobre estas variables. |
| `APP_KEY` | Se genera con `composer setup` o `php artisan key:generate` dentro del contenedor. |

### Proveedores de IA

Si prefieres configurarlos por entorno en vez de por la UI:

```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
```

Claves reconocidas: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
(o `GOOGLE_GEMINI_API_KEY`), `NVIDIA_API_KEY` (o `NVIDIA_NIM_API_KEY`), `OLLAMA_API_KEY`,
`CUSTOM_AI_API_KEY` y `OPENCODE_BASE_URL`. Sin ninguna clave, la app funciona igual con el generador
por reglas.

---

## Arquitectura

### Capas

```
routes/web.php          (35 rutas de la app; no existe routes/api.php)
        ↓
app/Http/Controllers    8 controladores, delgados
        ↓
app/Services            10 servicios — toda la lógica de negocio vive aquí
        ↓
app/Repositories        7 interfaces (Contracts) + 7 implementaciones Eloquent
        ↓
app/Models              7 modelos Eloquent con UUID
```

`RepositoryServiceProvider` hace el binding de cada interfaz a su implementación. **Nunca hay
Eloquent directo en controladores.** Esta regla es innegociable según la constitución del proyecto
(`.specify/memory/constitution.md`).

Servicios: `ActivityService`, `AiService`, `AuthService`, `CategoryService`, `QrLoginTokenService`,
`RewardService`, `SessionService`, `StatsService`, `SuggestionService`, `UserService`.

### Autenticación

No se usa el driver de sesión de Laravel para autenticar. `AuthService` emite una cookie propia,
`timelock_session`, cuyo valor es un token aleatorio del que solo se guarda el hash (SHA-256 en
base64url). El middleware `auth.session` la resuelve, la añade a la lista de `except` de
`EncryptCookies`, y refresca su expiración (30 días) cuando se cambia el email o la contraseña.
Cambiar cualquiera de los dos invalida el resto de las sesiones del usuario.

**Login por QR:** `AuthService::createQrToken` genera un token de un solo uso con TTL de 10 minutos y
revoca los pendientes anteriores, de modo que cada QR nuevo anula al viejo. `POST /auth/qr-login`
tiene throttle de 10/min por IP, y el comando programado `qr:prune` purga los caducados cada día.

**Escáner QR multi-cámara:** `Components/Auth/QrScanner.tsx` arranca siempre por `deviceId`. Cuando la
cámara pedida no existe, el navegador recurre a la que quiera en lugar de fallar, así que pedir
`facingMode: 'environment'` deja la elección en manos del navegador y no en las nuestras. El
componente enumera los dispositivos con `Html5Qrcode.getCameras()` y elige la trasera por etiqueta; si
hay más de una cámara muestra un botón que cicla todas ellas. La linterna solo aparece cuando
`torchFeature().isSupported()` lo confirma y **arranca apagada**. Como respaldo hay carga de imagen
(`scanFile`), que detiene la cámara antes porque la librería rechaza un escaneo de fichero con una
cámara activa. Al ocultar la pestaña la cámara se libera.

La lógica de selección vive aparte, en `resources/js/lib/camera.ts`, como funciones puras sin React ni
DOM (`classifyCamera`, `pickInitialCamera`, `nextCameraIndex`, `classifyCameraError`, `qrboxFor`), con
tests en `tests/frontend/camera.test.ts` que corren con el runner de Node y sin dependencias nuevas:

```sh
npm run test:frontend
```

Los fallos de cámara se clasifican y se traducen por separado (`permission-denied`, `no-camera`,
`in-use`, `not-found`, `insecure-context`, `unsupported`), en lugar de reportar siempre "revisa los
permisos", que era la causa de que el error real fuera indescifrable en escritorio.

### Frontend

Tres niveles de componentes, con convención de capitalización como parte del contrato:

| Ruta | Contiene |
|---|---|
| `resources/js/components/ui/*` (minúsculas) | 18 primitivas shadcn/radix-nova: `badge`, `button`, `calendar`, `card`, `checkbox`, `date-picker`, `dialog`, `dropdown-menu`, `input`, `multi-select`, `popover`, `select`, `separator`, `skeleton`, `tabs`, `textarea`, `time-picker`, `tooltip`. |
| `resources/js/Components/<dominio>/*` (mayúsculas) | Componentes de dominio: `dashboard/` (8), `stats/` (9), `Auth/QrScanner`, `QrCode`. Encapsulan la lógica del módulo. |
| `resources/js/Pages/*` | 14 páginas Inertia. **Solo orquestan**: piden datos, delegan en componentes, manejan estado de formulario. |

- **Tokens obligatorios.** Todo color y estado visual sale de `resources/css/app.css` (Tailwind v4
  CSS-first, tokens HSL en `:root` y `.dark`). No hay hex inline en JSX. Los gráficos consumen
  `lib/charts.ts` (`CHART_COLORS`, `chartVar(n)`) sobre la paleta `--chart-1..7`, con contraste AA
  en light y dark.
- **Sin inputs nativos.** Las fechas usan `DatePicker` y las horas `TimePicker`. La única excepción
  es `type="range"`. Los estados de carga usan `Skeleton`.
- **i18n.** Todo texto visible pasa por `lib/i18n.tsx` (`useI18n()` → `t()`). 526 claves en español e
  inglés, con el mismo conjunto de claves en ambos idiomas. El idioma se persiste en
  `users.language` y se comparte por cookie `timelock_locale`.
- **Tema.** `lib/theme.tsx` + un script anti-FOUC inline en `app.blade.php` aplican `.dark` antes de
  la hidratación. `ThemeProvider` se inicializa desde `auth.user.theme` y persiste en
  `localStorage['timelock-theme']`.

### Fechas y zona horaria

Contrato deliberado: el backend serializa fechas **naive** (`Y-m-d\TH:i:s`, wall-clock, sin offset)
en los payloads de UI, y la sesión de Postgres usa `APP_TIMEZONE`. El emparejamiento por día de
actividad se hace siempre contra la columna `date` (`a.date.slice(0, 10)`), nunca parseando
`startAt` a fecha local en el cliente.

### Endpoints de IA

`AiService` valida cada petición saliente: solo hosts autorizados por provider, solo HTTPS y solo
resolución a IP pública (guard anti-SSRF). Los proveedores que no responden degradan al generador
por reglas en lugar de fallar.

---

## Rutas

35 rutas de aplicación (más `/up` para health checks). Todas viven en `routes/web.php` bajo el grupo
`web`: **no hay `routes/api.php`**, los endpoints `/api/*` comparten sesión y CSRF con el resto.

**Públicas**

| Método | URI | |
|---|---|---|
| GET | `/` | Landing |
| GET · POST | `/login` | Formulario de login (incluye modo QR por `?qr=`) |
| GET · POST | `/register` | Registro |
| POST | `/logout` | Cierra la sesión |

**Sesión** (`auth.session` salvo cuando se indica)

| Método | URI | |
|---|---|---|
| GET | `/onboarding` | Wizard inicial; redirige al dashboard si ya se completó |
| GET | `/dashboard` | Home; redirige `?tab=` legacy a su ruta de módulo |
| GET | `/dashboard/{activities,calendar,export,profile,rewards,settings,stats,streak,suggestions}` | Páginas de módulo |
| GET | `/auth/me` | Usuario de la sesión actual |
| POST | `/auth/qr` | Genera token QR |
| POST | `/auth/qr-login` | Consume token QR (`throttle:10,1`) |

**API**

| Método | URI | |
|---|---|---|
| GET | `/api/bootstrap` | Carga inicial: usuario, actividades, categorías, recompensas, `today` |
| POST | `/api/bootstrap` | `action: activity` · `settings` · `onboarding` · `pause` · `reward` |
| PATCH | `/api/bootstrap` | Marcar actividad como completada (acredita puntos) |
| DELETE | `/api/bootstrap` | Borrar actividad (`?id=`) o la cuenta (`{email, confirmation}`) |
| PATCH | `/api/rewards/{reward}` | Canjear recompensa |
| GET | `/api/stats/summary` | Agregación de estadísticas con filtros `from`, `to`, `activities`, `categories` |
| GET | `/api/export` | `format=csv` (por defecto) o `format=json`; filtros `from` / `to` |
| GET · POST | `/api/suggestions` | Listar recientes · generar / regenerar |
| POST | `/api/ai/test-connection` | Prueba la configuración de IA |
| POST | `/api/profile/avatar` | Subida de avatar |
| POST | `/api/profile/email` | Cambio de email |
| POST | `/api/profile/password` | Cambio de contraseña |

El cliente habla con la API a través de `lib/api.ts`, que inyecta la cabecera `X-XSRF-TOKEN` leída
de la cookie `XSRF-TOKEN` en cada petición no-GET. Sin ella, Laravel responde 419.

---

## Modelo de datos

7 tablas de dominio, todas con clave primaria UUID de texto.

| Tabla | Contenido |
|---|---|
| `users` | ~60 columnas: perfil, intereses, preferencias, notificaciones, configuración de IA, `points`, `current_streak`, `best_streak`, `pause_*`, `theme`, `language`. `password_hash` está marcado como hidden y nunca se serializa. |
| `sessions` | Sesiones activas: `token_hash` único, `expires_at`. |
| `categories` | `unique(user_id, name)`, `color`, `points_per_hour`. |
| `activities` | `title`, `date`, `start_at`, `end_at`, `status`, `points`, `is_free`, `completed_at`, `category_id`. Índices en `(user_id, date)` y `(user_id, start_at)`. |
| `rewards` | `title`, `cost`, `redeemed_at`. |
| `qr_login_tokens` | `token_hash` único, `expires_at`, `used_at` (un solo uso). |
| `suggestions` | `title`, `category`, `duration`, `reason`, `points`, `source` (`ai` \| `rule`). |

Los "enums" (`PLANNED`/`COMPLETED`, `SYNCHRONOUS`/`FREE`, `LIGHT`/`DARK`/`SYSTEM`) son columnas de
texto con default, no tipos `enum` de Postgres: los modelos de `app/Models` declaran los `casts`
que les corresponden. Además, Laravel crea `cache`, `cache_locks`, `jobs`, `job_batches` y
`failed_jobs` con sus migraciones estándar.

---

## Testing

Suite Pest con **119 tests y 503 aserciones**, todos en verde.

```bash
composer test
docker compose exec laravel.test php artisan test --filter=AuthServiceTest
```

```
tests/
├── Pest.php                     RefreshDatabase en Feature, TestCase en Unit
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

Tres convenciones que conviene conocer antes de escribir un test:

- `tests/Concerns/WithSessionClient.php` resuelve la parte incómoda: `authenticate()` registra un
  usuario vía `AuthService` y devuelve el token, y `withTimelockSession()` lo inyecta como cookie
  **sin cifrar**, que es lo que el middleware espera.
- Los tests de repositorio y de servicio se apoyan en los bindings globales de `tests/Pest.php`;
  los de API y web declaran `uses(RefreshDatabase::class, WithSessionClient::class)` explícitamente.
- `tests/Feature/Database/DatabaseSeederTest.php` cubre la factory y el seeder. No es decorativo:
  ambos fallaban en silencio porque la tabla `users` no es la de Laravel por defecto, así que el
  test es la red de seguridad de esa divergencia.

---

## Workflow de desarrollo

El proyecto sigue **Spec-Driven Development** con [Spec Kit](https://github.com/github/spec-kit).
La regla de la constitución es explícita: *nada de código de implementación sin artefactos
(especificación → plan → tareas) aprobados*.

```
specs/
├── 001-design-system-ui/            spec.md · plan.md · tasks.md
├── 002-stats-redesign/
├── 003-modulos-rutas/
└── 004-calendario-filtros-multiselect/
.specify/memory/
├── constitution.md                  principios no negociables del proyecto
├── decisiones-normalizacion.md
├── design-system-audit.md
└── design-tokens-charts.md
```

Principios que gobiernan el código (`.specify/memory/constitution.md`):

1. **Repository Pattern + Services.** La lógica vive en `app/Services`; los datos entran por las
   interfaces de `app/Repositories/Contracts`.
2. **Spec-Driven Development.** Artefactos Spec Kit antes de implementar.
3. **Test-First.** `php artisan test` en verde antes de cada commit.
4. **Design System tokenizado.** Cero hex inline, cero estilos que dupliquen primitivas.
5. **Paridad frontend-backend.** El cálculo pesado ocurre en el backend; el cliente renderiza.

---

## Documentación relacionada

| Documento | Para qué |
|---|---|
| [`INVENTARIO.md`](INVENTARIO.md) | Historia completa de la migración desde Next.js, con el estado de cada fase. |
| [`AGENTS.md`](AGENTS.md) | Convenciones de UI del design system (obligatorias para agentes y para el equipo). |
| [`CLAUDE.md`](CLAUDE.md) | Resumen operativo para agentes: qué leer, cómo correr comandos, reglas rápidas. |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Principios no negociables y workflow. |
| [`specs/`](specs/) | Especificaciones, planes y tareas de cada ciclo de trabajo. |

---

## Estado del proyecto

Lo que funciona y está verificado, y lo que todavía no:

**Verificado**
- 119 tests Pest en verde (503 aserciones).
- `composer lint` (Pint) sin incidencias en los 101 ficheros.
- `npm run typecheck` sin errores.
- `npm run build` correcto.
- `composer seed` genera un usuario demo loginable, con categorías, recompensas e historial.
- Flujo crítico end-to-end comprobado por `curl` contra el contenedor: landing, login, register,
  login por QR completo (crear → consumir → cookie de sesión), todas las páginas del dashboard, y
  `/api/bootstrap` sin filtrar `password_hash`.

**Pendiente**
- Validación visual manual de light/dark en navegador (el protocolo de captura no está disponible
  en el entorno actual). Hay un checklist manual en `INVENTARIO.md`.
- `POST /api/profile/password` está implementado y testeado en el backend, pero la UI de perfil
  todavía no lo consume.
- El backend admite crear recompensas (`POST /api/bootstrap` con `action: "reward"`), pero no hay
  interfaz para ello; las recompensas se crean por base de datos o por seed.

---

## Licencia

MIT. Este proyecto es software libre; consulta el archivo de licencia para más detalles.
