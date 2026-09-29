# Plan 005 – Asistencias

## Arquitectura
Repository Pattern + Services. Modelos UUID, fechas naive, APP_TIMEZONE.

## Datos
- Migration `attendances`: id uuid, user_id uuid, type WORK|BREAK, started_at timestampTz, ended_at timestampTz, duration_minutes int, location text, notes text, timestamps.
- Migration `attendance_qr_tokens`: id uuid, user_id uuid, type WORK|BREAK, token_hash text unique, expires_at timestampTz nullable, used_at timestampTz nullable, timestamps.
- `users`: attendance_qr_ttl int default 5, attendance_qr_ttl_unit enum minutes|days|never default minutes, attendance_close_on_rescan bool default true.

## Backend
- Model `Attendance`, `AttendanceQrToken`.
- Repository Contract `AttendanceRepositoryInterface` + Eloquent impl.
- Service `AttendanceService` con toggle, clockIn/Out, list, summary.
- Controller rutas:
  GET /dashboard/attendance
  GET /api/attendance?from&to
  POST /api/attendance/toggle
  POST /auth/attendance/qr
  POST /auth/attendance/qr-scan

## Frontend
- Página `Dashboard/Attendance` con configuración TTL, emisores QR Trabajo/Descanso, botones manuales, lista sesiones.
- Componentes dominio `@/Components/attendance/*`.
- i18n claves attendance.*.

## Stats
- `AttendanceService::summary` integrado en `StatsService` para KPIs y gráficos.

## Tests
- Feature toggle, QR generación/consumo, cálculo duración, TTL.
