# Spec 005 – Módulo Asistencias

## Contexto
TimeLock registra actividades planificadas con puntos y racha. Se requiere control de tiempo laborado y descanso real del día con registro rápido y QR, inspirado en Clockwise `Timesheet`.

## Objetivos
- Registrar jornadas WORK y BREAK por usuario con inicio/fin.
- Emisión de QR por tipo con expiración configurable global por usuario.
- Registro manual por botones.
- Integración de horas de asistencia en Estadísticas.

## User Stories
1. Como usuario quiero iniciar/finalizar jornada WORK con un botón para registrar tiempo laborado.
2. Como usuario quiero iniciar/finalizar descanso BREAK con un botón.
3. Como usuario quiero generar QR de Trabajo y QR de Descanso para escanear con escáner externo.
4. Como usuario quiero configurar TTL del QR en minutos/días/nunca de forma global.
5. Como usuario quiero ver resumen diario de horas trabajadas/descansadas y historial.

## Criterios de aceptación
- Registro open/close por tipo y día, cálculo de duración en minutos.
- QR distinto al de login, token único por tipo, expiración según configuración usuario.
- Configuración TTL visible en página Asistencias, persiste en `users`.
- Estadísticas muestra KPIs de asistencia y gráfico de horas por día.
- Tests Pest pasan, sin romper suite existente.

## No-go
- No mezclar asistencias con actividades planificadas.
- No usar inputs nativos, solo primitivas UI.
