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

> En Laravel los endpoints QR se registraron **sin** prefijo `/api`: `POST /auth/qr` y `POST /auth/qr-login` (web). El resto conserva el prefijo `/api`.

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
- [x] Design system shadcn/ui **registrado vía CLI** (`npx shadcn init -t laravel -b radix -y -p nova`): `components.json` (radix-nova, alias `@/components`/`@/lib/utils`), primitivas en `resources/js/components/ui/*` (minúsculas): button/card/input/badge/checkbox/select/textarea/dialog, ajustadas a las métricas del origen (Button danger + sizes h-8/h-10/h-12, Card rounded-xl shadow-sm, Input h-10, Badge success/warning/danger)
- [x] `resources/css/app.css`: tokens neutrales 1:1 (light/dark, `@theme inline` en forma `hsl(var(--x))`, radios, `--font-sans` v3, success/danger/info/warning) + `@import "shadcn/tailwind.css"` + `tw-animate-css`; **fix bug**: con `var(--muted)` el CSS compilaba `background-color: var(--muted)` (triplete inválido); con `hsl(var(--muted))` compila `background-color: hsl(var(--muted))`
- [x] Todos los `<select>`/checboxes/`<textarea>` nativos de las páginas → `Select`/`Checkbox`/`Textarea` shadcn (Settings, Profile, Onboarding, Stats, Login/Register); modales con `Dialog` (email/password Profile); `SelectItem` sin valores vacíos (placeholder con `SelectValue`)
- [x] **zod reincorporado**: `lib/validations.ts` (`emailSchema`, `passwordSchema`, `dateRangeSchema`) usado en Profile (email/password) y en el rango custom de Stats
- [x] **date-fns reincorporado**: `lib/utils.ts` (`toDateKey`, `formatTime`, `minutesBetween`) migrado a date-fns sin cambiar la API
- [x] `ThemeProvider` propio (API `useTheme`, localStorage `timelock-theme`, default system) con script anti-FOUC en `app.blade.php`; inicializado desde `auth.user.theme` (LIGHT/DARK/SYSTEM → BD)
- [x] `I18nProvider` propio: cookie `timelock_locale` (es/en), `useI18n()` con `t()`; `locale` compartido por `HandleInertiaRequests` (user.language → cookie → es)
- [x] `HandleInertiaRequests` resuelve el usuario desde `auth_user`/cookie y comparte `auth.user` + `locale`
- [x] Páginas Inertia React: `Login`, `Register`, `Onboarding` (useForm/errores), `DashboardLayout` (nav + tema + idioma + logout), `Dashboard/{Index,Profile,Settings,Stats}`
- [x] `Index`: bootstrap (puntos/racha/hoy), alta de actividad con puntos por hora, completar 1 vez, eliminar, recompensas, banner de pausa
- [x] `Profile`: avatar (multipart), cambio de email y contraseña (invalida sesiones y refresca cookie); `Settings`: nombre, tema (persiste en BD vía `bootstrap settings`), idioma, modo
- [x] Rutas `/dashboard/profile|settings|stats` protegidas (`auth.session`) + `tests/Feature/Web/InertiaPagesTest.php` (3 tests)
- [x] `tsconfig.json` sin `baseUrl` (TS7) con rutas relativas; tipos en `resources/js/types.ts`; helper `lib/api.ts`
- [x] **QR login completo v2**: flujo integrado en `Login.tsx` (escáner `html5-qrcode` + fallback pegar token + `?qr=` autologin) y en la tarjeta Seguridad de `Profile.tsx` (generador: `Components/QrCode` (paquete `qrcode`), auto-renovación cada 60s con cuenta atrás, PNG/PDF, botón "Probar en este dispositivo" → `POST /auth/qr-login`); consume `/auth/qr-login` y redirige a dashboard u onboarding según `onboarding_completed`
- [x] **Stats mejoradas**: gráfico de barras de completadas últimos 14 días (recharts), botones Exportar CSV (`/api/export`) y Exportar PDF (`jspdf`)
- [x] Deps nuevas: `qrcode`, `html5-qrcode`, `recharts`, `jspdf`, `@types/qrcode`
- [x] `lib/api.ts`: envía `X-XSRF-TOKEN` (desde cookie) en todas las peticiones — sin esto los POST/PATCH/DELETE de fetch daban 419. `...init` va antes que `headers` para no pisarlos
- [x] Fix HMR dev "can't detect preamble": `import '@vitejs/plugin-react/preamble'` como primer import de `resources/js/app.tsx` (la solución documentada para apps que no usan `transformIndexHtml`, como Laravel). Sin esto, en `npm run dev` los módulos JSX se cargaban sin el runtime de React Refresh y el browser lanzaba el error. Verificado: el módulo virtual sirve `injectIntoGlobalHook` e `i18n.tsx` ya se envuelve con Refresh; el build de producción no se ve afectado
- [x] Verificación de humo (curl contra contenedor): Landing/Login/Register/qr-login 200; todas las páginas dashboard 200 con su `component` correcto; `/api/bootstrap` sin `password_hash`; QR **e2e completo** (crear 200, consumir con token nuevo → `{"ok":true,"redirect"}` + `Set-Cookie: timelock_session` 30 días)

### Estado (Tareas 6 — Mejoras QR, 2026-09-23)
- [x] Fix 404: `Profile.tsx` llamaba `POST /api/auth/qr` (ruta inexistente) → ahora `POST /auth/qr` (mismo path que `qrLogin` consume)
- [x] Revocación: `AuthService::createQrToken` ahora llama `deleteUnused(userId)` antes de insertar → generar un QR nuevo invalida los pendientes (paridad con `deleteUnusedQrTokens` de Next.js)
- [x] CSRF: `Login.tsx` consumía `/auth/qr-login` con `fetch` crudo sin `X-XSRF-TOKEN` (→ 419 en navegador); ahora usa `apiPost` (que lo envía). `api.ts` además expone `message` (ej. too-many-attempts) en el error
- [x] Mismo origen: `normalizeQrValue` (Login) rechaza URL de QR de otro origen (`parsed.origin === window.location.origin`)
- [x] `AuthController::qr` responde `Cache-Control: no-store` (paridad con Next)
- [x] Throttle `POST /auth/qr-login`: 10/min por IP (`throttle:10,1`)
- [x] Comando `qr:prune` (borra tokens caducados) + `Schedule::command('qr:prune')->daily()` en `routes/console.php`
- [x] i18n: eliminadas claves huérfanas (`qrlogin.*`, `qr.title`, `qr.explanation`, `qr.refresh`, `nav.qr`); se reutilizan `qr.expires` y `qr.test`
- [x] Fix tsc: `DashboardLayout` pasaba `NavId` ('home') donde se esperaba `TabId` → guard `isTabId`

### Pendiente
- Verificación visual manual foto a foto con las pantallas Next.js (checklist 21.3) — opcional, el smoke end-to-end ya cubre el flujo crítico