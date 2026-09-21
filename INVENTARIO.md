# INVENTARIO — Migración TimeLock (Next.js → Laravel)

Generado: 2026-09-21 (Tarea 0 del plan maestro).

## Origen: `~/dev/timelock-v` (Next.js)

### Páginas (App Router)
| Ruta | Archivo origen | Página Inertia destino |
|------|----------------|------------------------|
| `/` | `src/app/page.tsx` | `Pages/Landing.tsx` |
| `/login` | `src/app/login/page.tsx` | `Pages/Login.tsx` |
| `/register` | `src/app/register/page.tsx` | `Pages/Register.tsx` |
| `/onboarding` | `src/app/onboarding/page.tsx` | `Pages/Onboarding.tsx` |
| `/dashboard` | `src/app/dashboard/page.tsx` | `Pages/Dashboard/Index.tsx` |
| `/dashboard/profile` | `src/app/dashboard/profile/page.tsx` | `Pages/Dashboard/Profile.tsx` |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | `Pages/Dashboard/Settings.tsx` |
| `/dashboard/stats` | `src/app/dashboard/stats/page.tsx` | `Pages/Dashboard/Stats.tsx` |

### API routes
`POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` · `POST /api/auth/qr` · `POST /api/auth/qr-login` · `GET /api/bootstrap` (GET/POST/PATCH/DELETE) · `GET /api/export` · `POST /api/profile/avatar` · `POST /api/api/profile/email` · `POST /api/profile/password` · `GET /api/suggestions` · `POST /api/ai/test-connection`

### Componentes
`auth-form`, `dashboard-shell`, `dashboard`, `onboarding`, `profile-screen`, `qr-scanner`, `settings-screen`, `stats-screen`, `theme-provider`, `ui/{button,card,input,badge}`.

### Librerías
react 18.3, zod, bcryptjs, date-fns, recharts, qrcode, html5-qrcode, jspdf, lucide-react, cva(clsx/tailwind-merge), next-themes. Stack: Tailwind v3 + shadcn/ui hand-rolled.

### Base de datos (PostgreSQL)
`users`, `categories`, `activities`, `rewards`, `sessions`, `qr_login_tokens`, `suggestions` (7 tablas). Enums: `activity_status`, `theme`, `operation_mode`.

### Acceso a datos
`src/lib/db.ts` (Pool pg) + `src/lib/data.ts` (~40 funciones SQL crudas) → migrado a `app/Repositories/` + `app/Models/`.

## Destino: `~/dev/app` (Laravel 13.32 + Inertia+React + Sail + pgsql + Pest)

### Estado (Tarea 0)
- [x] Deps PHP: inertia-laravel, breeze, sail, pest 4.7 + plugin
- [x] compose.yaml único (laravel.test PHP 8.5 + pgsql postgres:18)
- [x] .env pgsql (timelock/timelock/timelock), SESSION_DRIVER=file
- [x] Inertia: app.blade.php, HandleInertiaRequests, app.tsx, vite react
- [x] Design tokens shadcn → resources/css/app.css (Tailwind v4)
- [x] Migraciones: users(schema real) + sessions/categories/activities/rewards/qr_login_tokens/suggestions
- [x] Models: User/Activity/Category/Reward/Session/QrLoginToken/Suggestion
- [x] Repos: 7 Interfaces + 7 impls Eloquent
- [x] RepositoryServiceProvider registrado
- [x] Pest tests repositorios: 17 verdes (feature + unit)

### Estado (Tareas 1-3)
- [x] Services: User/Session/Category/Activity/Reward/QrLoginToken/Suggestion + AuthService (cookie `timelock_session`, hash sha256+b64url, bcrypt 12, defaults registro, sesiones 30d, QR TTL 10min single-use) + AiService (guard SSRF portado: PROVIDER_HOSTS/LOCAL_HOSTNAMES/isPrivateIp)
- [x] Auth HTTP: middleware `auth.session`, LoginRequest/RegisterRequest (validación 1:1 zod, mensajes ES), AuthController (login/register/logout/me/qr/qr-login), rutas web + Inertia stubs (Login/Register/Onboarding/Dashboard)
- [x] Cookie en `except` de EncryptCookies; responde por `Set-Cookie` con expiry real (DateTimeInterface), logout–3600s
- [x] Pest tests services + auth HTTP: 40 verdes (138 assertions)

### Estado (Tarea 4) — 77 tests verdes (263 assertions)
- [x] Traits `SerializesDomain` (payloads camelCase → api) e `InteractsWithSessionCookie` (refresh de cookie en email/password)
- [x] `DashboardController` (`/api/bootstrap` GET/POST/PATCH/DELETE): bootstrap lists, activity/reward/settings/onboarding/pause (pausa vencida → no activa), completar actividad con puntos 1 vez, borrar actividad o cuenta con `DELETE_ACCOUNT`
- [x] `ProfileController`: avatar (validación mime + magic bytes + 5MB → `public/uploads`), email (verifica pw, 409 si en uso, invalida sesiones + nueva cookie), password (401/400, invalida + nueva cookie)
- [x] `SuggestionController`: GET recent (rule|ai), POST generate/regenerate (rate-limit file-cache 5/10min + 429 Retry-After), persiste con `source`, fallback a transients si DB cae
- [x] `ExportController`: CSV por defecto / JSON curado, filtros `from/to` (400), 401 sin sesión
- [x] `AiController` + `AiService` `testConnection/suggest/chat/parseSuggestions/fallbackSuggestions`: providers OPENAI/OPENROUTER/NVIDIA_NIM/ANTHROPIC/GEMINI/OLLAMA/CUSTOM/OPENCODE, validación SSRF (hosts autorizados + HTTPS + resolución pública), 400/502 según caso
- [x] Fix bug de `defaultBaseUrlFor` OPENAI (base por defecto), fallback building de intereses sin claves, `SuggestionRepository::createMany` genera uuid (PK), `updatePause` reason seguro
- [x] Tests `tests/Feature/Api/{Bootstrap,Profile,Export,Suggestions,Ai}ApiTest.php` + trait `WithSessionClient` (authenticate + cookie sin cifrar)

### Estado (Tareas 4.5 y 5) — 80 tests verdes, `tsc` limpio, `npm run build` OK
- [x] Design system shadcn/ui: `resources/css/app.css` con tokens neutrales 1:1 (light/dark, `@theme inline`, radios, `--font-sans` v3, success/danger/info/warning), primitivas `ui/{Button,Card,Input,Badge}` + `cn()`, alias `@/`
- [x] `ThemeProvider` propio (API `useTheme`, localStorage `timelock-theme`, default system) con script anti-FOUC en `app.blade.php`; inicializado desde `auth.user.theme` (LIGHT/DARK/SYSTEM → BD)
- [x] `I18nProvider` propio: cookie `timelock_locale` (es/en), `useI18n()` con `t()`; `locale` compartido por `HandleInertiaRequests` (user.language → cookie → es)
- [x] `HandleInertiaRequests` resuelve el usuario desde `auth_user`/cookie y comparte `auth.user` + `locale`
- [x] Páginas Inertia React: `Login`, `Register`, `Onboarding` (useForm/errores), `DashboardLayout` (nav + tema + idioma + logout), `Dashboard/{Index,Profile,Settings,Stats}`
- [x] `Index`: bootstrap (puntos/racha/hoy), alta de actividad con puntos por hora, completar 1 vez, eliminar, recompensas, banner de pausa
- [x] `Profile`: avatar (multipart), cambio de email y contraseña (invalida sesiones y refresca cookie); `Settings`: nombre, tema (persiste en BD vía `bootstrap settings`), idioma, modo
- [x] Rutas `/dashboard/profile|settings|stats` protegidas (`auth.session`) + `tests/Feature/Web/InertiaPagesTest.php` (3 tests)
- [x] `tsconfig.json` sin `baseUrl` (TS7) con rutas relativas; tipos en `resources/js/types.ts`; helper `lib/api.ts`
- [x] **QR login completo**: `Components/QrCode` (paquete `qrcode`), `/dashboard/qr` (página autenticada con token único auto-renovable cada 60s + consumo de prueba), `/auth/qr-login` (página invitado con escáner `html5-qrcode` + fallback a pegar token) → consume `/auth/qr-login` y redirige a dashboard/onboarding
- [x] **Stats mejoradas**: gráfico de barras de completadas últimos 14 días (recharts), botones Exportar CSV (`/api/export`) y Exportar PDF (`jspdf`)
- [x] Deps nuevas: `qrcode`, `html5-qrcode`, `recharts`, `jspdf`, `@types/qrcode`
- [x] `lib/api.ts`: envía `X-XSRF-TOKEN` (desde cookie) en todas las peticiones — sin esto los POST/PATCH/DELETE de fetch daban 419. `...init` va antes que `headers` para no pisarlos
- [x] Fix HMR dev "can't detect preamble": `import '@vitejs/plugin-react/preamble'` como primer import de `resources/js/app.tsx` (la solución documentada para apps que no usan `transformIndexHtml`, como Laravel). Sin esto, en `npm run dev` los módulos JSX se cargaban sin el runtime de React Refresh y el browser lanzaba el error. Verificado: el módulo virtual sirve `injectIntoGlobalHook` e `i18n.tsx` ya se envuelve con Refresh; el build de producción no se ve afectado
- [x] Verificación de humo (curl contra contenedor): Landing/Login/Register/qr-login 200; todas las páginas dashboard 200 con su `component` correcto; `/api/bootstrap` sin `password_hash`; QR **e2e completo** (crear 200, consumir con token nuevo → `{"ok":true,"redirect"}` + `Set-Cookie: timelock_session` 30 días)

### Pendiente
- Verificación visual manual foto a foto con las pantallas Next.js (checklist 21.3) — opcional, el smoke end-to-end ya cubre el flujo crítico
- `git init` + primer commit ya hecho (7789544); falta commit de `lib/api.ts` (CSRF)