<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class AuthService
{
    public const SESSION_COOKIE = 'timelock_session';

    public const SESSION_DAYS = 30;

    /**
     * @deprecated Kept so existing callers and tests keep working; the value now
     *             lives in config('qr.defaults.ttl') as a whitelist key.
     */
    public const QR_TTL_MINUTES = 10;

    /**
     * Categorías por defecto al registrar (port 1:1 de api/auth/register).
     *
     * @var list<array{name: string, color: string, pointsPerHour: int}>
     */
    public const DEFAULT_CATEGORIES = [
        ['name' => 'Estudio', 'color' => '#2563eb', 'pointsPerHour' => 5],
        ['name' => 'Deporte', 'color' => '#16a34a', 'pointsPerHour' => 8],
        ['name' => 'Personal', 'color' => '#ea580c', 'pointsPerHour' => 4],
        ['name' => 'Descanso', 'color' => '#7c3aed', 'pointsPerHour' => 3],
    ];

    /**
     * Recompensas por defecto al registrar (port 1:1 de api/auth/register).
     *
     * @var list<array{title: string, cost: int}>
     */
    public const DEFAULT_REWARDS = [
        ['title' => '30 min de serie', 'cost' => 30],
        ['title' => 'Videojuegos', 'cost' => 80],
        ['title' => 'Salir a caminar', 'cost' => 50],
    ];

    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly SessionRepositoryInterface $sessions,
        private readonly QrLoginTokenRepositoryInterface $tokens,
        private readonly CategoryRepositoryInterface $categories,
        private readonly RewardRepositoryInterface $rewards,
    ) {}

    public function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    public function hashPassword(string $password): string
    {
        return bcrypt($password, ['rounds' => 12]);
    }

    public function verifyPassword(string $password, string $passwordHash): bool
    {
        return password_verify($password, $passwordHash);
    }

    public function register(array $data, bool $remember = false): array
    {
        $user = $this->users->createWithDefaults([
            'email' => $data['email'],
            'name' => $data['name'],
            'password_hash' => $this->hashPassword($data['password']),
        ]);

        foreach (self::DEFAULT_CATEGORIES as $category) {
            $this->categories->create([
                'user_id' => $user->id,
                'name' => $category['name'],
                'color' => $category['color'],
                'points_per_hour' => $category['pointsPerHour'],
            ]);
        }

        foreach (self::DEFAULT_REWARDS as $reward) {
            $this->rewards->create([
                'user_id' => $user->id,
                'title' => $reward['title'],
                'cost' => $reward['cost'],
            ]);
        }

        $session = $this->createSession($user, $remember);

        return ['user' => $user, 'token' => $session['token'], 'expiresAt' => $session['expiresAt']];
    }

    public function login(string $email, string $password, bool $remember = false): ?array
    {
        $user = $this->users->findByEmail($email);
        if (! $user || ! $user->password_hash) {
            return null;
        }

        if (! $this->verifyPassword($password, $user->password_hash)) {
            return null;
        }

        $session = $this->createSession($user, $remember);

        return ['user' => $user, 'token' => $session['token'], 'expiresAt' => $session['expiresAt']];
    }

    /**
     * @return array{token: string, expiresAt: CarbonImmutable}
     */
    public function createSession(User $user, bool $remember = false): array
    {
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

        $expiresAt = CarbonImmutable::now()->addDays($remember ? self::SESSION_DAYS : 1);

        $this->sessions->create($user->id, $this->hashToken($token), $expiresAt);

        return ['token' => $token, 'expiresAt' => $expiresAt];
    }

    public function getUserByToken(string $token): ?User
    {
        $result = $this->sessions->findWithUser($this->hashToken($token));

        $session = $result['session'] ?? null;
        $user = $result['user'] ?? null;

        if (! $session || ! $user) {
            return null;
        }

        if ($session->expires_at->lte(CarbonImmutable::now())) {
            $this->sessions->deleteByTokenHash($session->token_hash);

            return null;
        }

        $this->users->touchLastAccess($user->id);

        return $user;
    }

    public function logout(string $token): bool
    {
        return $this->sessions->deleteByTokenHash($this->hashToken($token));
    }

    public function invalidateUserSessions(string $userId): int
    {
        return $this->sessions->deleteByUser($userId);
    }

    /**
     * @return int|null null is a real option ("never"/"unlimited"), not a miss.
     */
    private function qrOption(string $table, string $key): ?int
    {
        $options = config("qr.{$table}");

        if (! is_array($options) || ! array_key_exists($key, $options)) {
            throw new InvalidArgumentException("Opción QR desconocida: {$table}.{$key}");
        }

        $value = $options[$key];

        return $value === null ? null : (int) $value;
    }

    /**
     * Issues the single active QR of a user, revoking whatever came before.
     *
     * The lifetime and the use budget are whitelist keys, not raw values, so the
     * caller cannot ask for something the UI does not offer.
     *
     * @return array{token: string, expiresAt: ?CarbonImmutable, maxUses: ?int, ttlKey: string, useKey: string, perpetual: bool}
     */
    public function createQrToken(User $user, ?string $ttlKey = null, ?string $useKey = null): array
    {
        $ttlKey ??= (string) config('qr.defaults.ttl');
        $useKey ??= (string) config('qr.defaults.uses');

        // config() returns null for an unknown key, which for both options means
        // "no limit". Falling through to a permanent credential because of a typo
        // is the worst possible failure here, so the keys are checked explicitly.
        $minutes = $this->qrOption('ttl_options', $ttlKey);
        $maxUses = $this->qrOption('use_options', $useKey);
        $expiresAt = $minutes === null ? null : CarbonImmutable::now()->addMinutes((int) $minutes);
        $perpetual = $expiresAt === null && $maxUses === null;

        if ($perpetual) {
            // A token that never expires and never runs out is a permanent
            // password in a QR code. It is allowed because it is a legitimate
            // choice for a shared kiosk, but it has to leave a trace.
            Log::warning('Timelock: se ha creado un token QR permanente (sin caducidad y sin limite de usos).', [
                'user_id' => $user->id,
            ]);
        }

        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');

        $this->tokens->deleteAll($user->id);
        $this->tokens->create($user->id, $this->hashToken($token), $expiresAt, $maxUses);

        return [
            'token' => $token,
            'expiresAt' => $expiresAt,
            'maxUses' => $maxUses,
            'ttlKey' => $ttlKey,
            'useKey' => $useKey,
            'perpetual' => $perpetual,
        ];
    }

    public function loginWithQr(string $token): ?User
    {
        $qrToken = $this->tokens->findByHash($this->hashToken($token));

        if (! $qrToken) {
            return null;
        }

        // Expiry, use budget and the use itself are one atomic statement: a
        // single-use token cannot be spent twice by two simultaneous requests.
        if (! $this->tokens->recordUse($qrToken->id)) {
            return null;
        }

        $user = $this->users->find($qrToken->user_id);
        if ($user) {
            $this->users->touchLastAccess($user->id);
        }

        return $user;
    }
}
