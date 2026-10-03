<?php

namespace App\Support;

use DateTimeImmutable;
use Illuminate\Support\Str;

/**
 * Port 1:1 de la construcción de `data` en POST /api/bootstrap (settings/onboarding).
 *
 * Reglas: claves presentes → se incluyen (null persistido); claves ausentes → no se tocan.
 * Campos de array (JSON) se guardan como arrays; updateUser los serializa.
 */
class ProfileUpdateMapper
{
    private const STRINGS = ['occupation', 'bio', 'interests', 'goals', 'workHours'];

    private const NULLABLE = [
        'genderIdentity', 'fitnessLevel', 'physicalLimitations', 'exerciseIntensity',
        'preferredDuration', 'preferredTimesOfDay', 'soloGroupPreference', 'energyLevel',
        'indoorOutdoorPreference', 'activityBudget', 'workStudyStart', 'workStudyEnd',
        'motivationLevel', 'timezoneOverride', 'quietHoursStart', 'quietHoursEnd',
        'notificationVoice',
    ];

    private const JSON_ARRAYS = [
        'skillsWithExperience', 'hobbies', 'sports', 'creativeActivities',
        'learningInterests', 'preferredActivityTypes', 'freeDays', 'resourcesAccess',
        'mainGoals', 'notificationTypes',
    ];

    /**
     * @param  array<string, mixed>  $body
     * @return array<string, mixed> Datos snake_case listos para updateUser.
     */
    public function map(array $body, string $action): array
    {
        $data = [];

        if (isset($body['name'])) {
            $data['name'] = trim((string) $body['name']);
        }

        if (array_key_exists('birthDate', $body)) {
            $data['birth_date'] = $body['birthDate'] === '' ? null
                : new DateTimeImmutable($body['birthDate'].'T00:00:00.000Z');
        }

        foreach (self::NULLABLE as $key) {
            if (array_key_exists($key, $body)) {
                $data[static::snake($key)] = $body[$key] ?? null;
            }
        }

        foreach (self::JSON_ARRAYS as $key) {
            if (array_key_exists($key, $body)) {
                $data[static::snake($key)] = $body[$key] ?? null;
            }
        }

        foreach (self::STRINGS as $key) {
            if (array_key_exists($key, $body)) {
                $value = trim((string) ($body[$key] ?? ''));

                $data[static::snake($key)] = $value === '' ? null : $value;
            }
        }

        if (array_key_exists('dailyAvailableMinutes', $body)) {
            $data['daily_available_minutes'] = $body['dailyAvailableMinutes'] === null
                ? null : (int) $body['dailyAvailableMinutes'];
        }

        foreach ([
            'theme' => [static::class, 'themes'],
            'language' => null,
            'timezone' => null,
            'timeFormat' => null,
            'measurementUnit' => null,
            'notificationsEnabled' => 'bool',
            'notificationFrequency' => null,
            'generationPersonalization' => null,
            'avoidRecentActivities' => 'bool',
            'includeCompletedHistory' => 'bool',
            'profileVisibility' => null,
            'aiTemperature' => 'float',
            'aiMaxTokens' => 'int',
            'country' => null,
            'city' => null,
        ] as $key => $rule) {
            if (array_key_exists($key, $body)) {
                $data[static::snake($key)] = $this->apply($body[$key], $rule);
            }
        }

        if (array_key_exists('operationMode', $body) && in_array($body['operationMode'], ['FREE', 'SYNCHRONOUS'], true)) {
            $data['operation_mode'] = $body['operationMode'];
        }

        if (array_key_exists('recentActivitiesWindow', $body)) {
            $value = $body['recentActivitiesWindow'];
            $data['recent_activities_window'] = is_string($value) ? (int) $value : $value;
        }

        if (array_key_exists('voiceEnabled', $body) && is_bool($body['voiceEnabled'])) {
            $data['voice_enabled'] = $body['voiceEnabled'];
        }

        if (array_key_exists('notifyVolume', $body) && is_int($body['notifyVolume'])) {
            $data['notify_volume'] = min(100, max(0, $body['notifyVolume']));
        }

        foreach (['aiProvider', 'aiModel', 'aiBaseUrl'] as $key) {
            if (array_key_exists($key, $body)) {
                $data[static::snake($key)] = $body[$key] ?? null;
            }
        }

        if (array_key_exists('avatarUrl', $body) && is_string($body['avatarUrl'])) {
            $data['avatar_url'] = $body['avatarUrl'];
        }

        if ($action === 'onboarding') {
            $data['onboarding_completed'] = true;
        }

        return $data;
    }

    private function apply(mixed $value, mixed $rule): mixed
    {
        if ($rule === 'bool') {
            return (bool) $value;
        }

        if ($rule === 'int') {
            return (int) $value;
        }

        if ($rule === 'float') {
            return (float) $value;
        }

        if (is_callable($rule)) {
            return $rule($value);
        }

        return $value;
    }

    private static function themes(mixed $value): mixed
    {
        return in_array($value, ['DARK', 'LIGHT', 'SYSTEM'], true) ? $value : null;
    }

    private static function snake(string $key): string
    {
        return (string) Str::snake($key);
    }
}
