# Timelock Constitution

## Core Principles

### I. Repository Pattern + Services (NO NEGOCIABLE)
Toda lógica de negocio vive en `app/Services`; el acceso a datos exclusivamente vía interfaces en `app/Repositories/Contracts` con binding en `RepositoryServiceProvider`. Controladores delgados; nunca Eloquent directo en controladores.

### II. Spec-Driven Development
Nada de código de implementación sin artefactos Spec Kit (Specify → Plan → Tasks) aprobados. Las desviaciones se documentan en `.specify/memory/`.

### III. Test-First con Pest
Suite Pest en verde obligatoria antes de cada commit (`php artisan test`). Los 80+ tests existentes no se rompen nunca; cada módulo nuevo aporta sus propios tests.

### IV. Design System Tokenizado
La UI consume exclusivamente tokens CSS (`resources/css/app.css`) y primitivas `@/components/ui`. Prohibido: colores hex inline, inputs nativos sin primitiva, estilos ad-hoc que dupliquen primitivas. Dirección visual: **dashboard-design + minimalismo** (jerarquía tipográfica, whitespace generoso, charts con paleta semántica `--chart-1..7` con contraste AA en light/dark).

### V. Paridad Frontend-Backend
La agregación/cálculo pesado ocurre en el backend (Services); el cliente renderiza. Los componentes de dominio (`@/Components/<dominio>`) encapsulan módulos; las Pages solo orquestan. i18n es/en obligatorio en todo texto visible.

## Development Workflow
- Commits atómicos por fase con mensaje descriptivo.
- `timelock-v/` (Next.js) es solo fuente de lectura; todo el trabajo ocurre en `app/`.
- Verificación por fase: `php artisan test` + `npm run build` en verde.

## Governance
Esta constitución prima sobre cualquier práctica contradictoria. Enmiendas requieren actualización de este documento y registro en el commit correspondiente.

**Version**: 1.0 | **Ratified**: 2026-09-24 | **Last Amended**: 2026-09-24
