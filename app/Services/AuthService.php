<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\CarbonImmutable;

class AuthService
{
    public const SESSION_COOKIE = 'timelock_session';

    public const SESSION_DAYS = 30;

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

    public function createQrToken(User $user): array
    {
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $expiresAt = CarbonImmutable::now()->addMinutes(self::QR_TTL_MINUTES);

        $this->tokens->create($user->id, $this->hashToken($token), $expiresAt);

        return ['token' => $token, 'expiresAt' => $expiresAt];
    }

    public function loginWithQr(string $token): ?User
    {
        $qrToken = $this->tokens->findByHash($this->hashToken($token));

        if (! $qrToken || $qrToken->used_at !== null) {
            return null;
        }

        if ($qrToken->expires_at->lte(CarbonImmutable::now())) {
            $this->tokens->consume($qrToken->id);

            return null;
        }

        $this->tokens->consume($qrToken->id);

        $user = $this->users->find($qrToken->user_id);
        if ($user) {
            $this->users->touchLastAccess($user->id);
        }

        return $user;
    }
}
