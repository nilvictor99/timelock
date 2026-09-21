<?php

namespace App\Http\Controllers;

use App\Http\Concerns\InteractsWithSessionCookie;
use App\Http\Concerns\SerializesDomain;
use App\Models\Activity;
use App\Models\User;
use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\AuthService;
use App\Services\SessionService;
use App\Support\ProfileUpdateMapper;
use DateTimeImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use InteractsWithSessionCookie;
    use SerializesDomain;

    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly ActivityRepositoryInterface $activities,
        private readonly CategoryRepositoryInterface $categories,
        private readonly RewardRepositoryInterface $rewards,
        private readonly AuthService $auth,
        private readonly SessionService $sessions,
        private readonly ProfileUpdateMapper $profileMapper,
    ) {}

    public function bootstrap(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        $this->clearExpiredPause($user);

        return response()->json([
            'user' => $this->publicUser($user->refresh()),
            'activities' => $this->activities->findByUser($user->id)->map(fn (Activity $a) => $this->activityPayload($a))->values(),
            'categories' => $this->categories->findByUser($user->id)->map(fn ($c) => $this->categoryPayload($c))->values(),
            'rewards' => $this->rewards->findByUser($user->id)->map(fn ($r) => $this->rewardPayload($r))->values(),
            'today' => now()->format('Y-m-d'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $body = $request->json()->all();
        $action = $body['action'] ?? null;

        return match ($action) {
            'activity' => $this->createActivity($user, $body),
            'reward' => $this->createReward($user, $body),
            'settings', 'onboarding' => $this->updateProfile($user, $body, $action),
            'pause' => $this->updatePause($user, $body),
            default => response()->json(['error' => 'Acción no soportada.'], 400),
        };
    }

    public function patchActivity(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $body = $request->json()->all();

        if (empty($body['id'])) {
            return response()->json(['error' => 'Falta el id.'], 400);
        }

        $existing = $this->activities->findByIdAndUser($body['id'], $user->id);

        if (! $existing) {
            return response()->json(['error' => 'La actividad ya no existe.'], 404);
        }

        $data = ['status' => $body['status'] ?? $existing->status];

        if (($body['status'] ?? null) === 'COMPLETED') {
            $data['completed_at'] = $existing->completed_at ?? now();
        }

        if (($body['status'] ?? null) !== 'COMPLETED' && $existing->status === 'COMPLETED') {
            $data['completed_at'] = null;
        }

        if (! empty($body['startAt'])) {
            $data['start_at'] = new DateTimeImmutable($body['startAt']);
        }

        if (! empty($body['endAt'])) {
            $data['end_at'] = new DateTimeImmutable($body['endAt']);
        }

        try {
            $this->activities->update($existing->id, $user->id, $data);

            $activity = $this->activities->findByIdAndUser($existing->id, $user->id);

            if (($body['status'] ?? null) === 'COMPLETED' && $existing->status !== 'COMPLETED') {
                $this->users->incrementPoints($user->id, $activity?->points ?? 0);
            }

            return response()->json($this->activityPayload($activity));
        } catch (\Throwable) {
            return response()->json(['error' => 'No se pudo actualizar la actividad.'], 500);
        }
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');

        if ($request->query('id')) {
            $deleted = $this->activities->deleteByIdAndUser($request->query('id'), $user->id);

            if (! $deleted) {
                return response()->json(['error' => 'La actividad ya no existe.'], 404);
            }

            return response()->json(['ok' => true]);
        }

        $body = $request->json()->all();

        $email = is_string($body['email'] ?? null) ? trim($body['email']) : '';
        $confirmation = $body['confirmation'] ?? null;

        if ($email === '' || $email !== $user->email || $confirmation !== 'DELETE_ACCOUNT') {
            return response()->json(['error' => 'La confirmación de eliminación no es válida.'], 400);
        }

        $token = $request->attributes->get('auth_token');

        $this->users->delete($user->id);

        if (is_string($token)) {
            $this->sessions->deleteByTokenHash($this->auth->hashToken($token));
        }

        $response = response()->json(['ok' => true]);

        return $this->clearSessionCookie($response);
    }

    private function createActivity(User $user, array $body): JsonResponse
    {
        $title = trim((string) ($body['title'] ?? ''));

        try {
            $start = ! empty($body['startAt']) ? new DateTimeImmutable($body['startAt']) : new DateTimeImmutable;
            $end = ! empty($body['endAt'])
                ? new DateTimeImmutable($body['endAt'])
                : $start->modify('+1 hour');
        } catch (\Throwable) {
            return response()->json(['error' => 'Título y horario válido son obligatorios.'], 400);
        }

        if ($title === '' || $end <= $start) {
            return response()->json(['error' => 'Título y horario válido son obligatorios.'], 400);
        }

        $category = ! empty($body['categoryId'])
            ? $this->categories->findByIdAndUser($body['categoryId'], $user->id)
            : null;

        $points = $category
            ? max(1, (int) round(((int) ($end->getTimestamp() - $start->getTimestamp())) / 3600 * $category->points_per_hour))
            : 0;

        $isFree = $user->operation_mode === 'FREE' || (bool) ($body['isFree'] ?? false);

        $activity = $this->activities->create([
            'user_id' => $user->id,
            'title' => $title,
            'description' => trim((string) ($body['description'] ?? '')) ?: null,
            'category_id' => $category?->id,
            'date' => $start->format('Y-m-d'),
            'start_at' => $start,
            'end_at' => $end,
            'is_free' => $isFree,
            'points' => $points,
        ]);

        return response()->json($this->activityPayload($activity->load('category')), 201);
    }

    private function createReward(User $user, array $body): JsonResponse
    {
        $title = trim((string) ($body['title'] ?? ''));
        $costValue = $body['cost'] ?? null;
        $cost = is_string($costValue) && ctype_digit($costValue) ? (int) $costValue : $costValue;

        if ($title === '' || ! is_int($cost) || $cost < 1) {
            return response()->json(['error' => 'Título y costo válido son obligatorios.'], 400);
        }

        $reward = $this->rewards->create([
            'user_id' => $user->id,
            'title' => $title,
            'cost' => $cost,
            'description' => trim((string) ($body['description'] ?? '')) ?: null,
        ]);

        return response()->json($this->rewardPayload($reward), 201);
    }

    private function updateProfile(User $user, array $body, string $action): JsonResponse
    {
        $data = $this->profileMapper->map($body, $action);

        $this->users->update($user->id, $data);

        return response()->json($this->publicUser($this->users->find($user->id)));
    }

    private function updatePause(User $user, array $body): JsonResponse
    {
        $active = (bool) ($body['active'] ?? false);
        $startsAt = $active ? now() : null;
        $endsAt = null;

        if ($active && ! empty($body['endsAt'])) {
            try {
                $endsAt = new DateTimeImmutable($body['endsAt']);
            } catch (\Throwable) {
                return response()->json(['error' => 'La fecha de reanudación no es válida.'], 400);
            }

            if ($endsAt <= now()) {
                $active = false;
                $startsAt = null;
                $endsAt = null;
            }
        }

        if (! $active && $user->pause_active && $user->pause_starts_at) {
            $elapsed = max(0, now()->getTimestamp() - $user->pause_starts_at->getTimestamp());

            $planned = $this->activities->findByPlannedAfter($user->id, $user->pause_starts_at);

            foreach ($planned as $activity) {
                $this->activities->updateTimes(
                    $activity->id,
                    $user->id,
                    $activity->date->modify("+{$elapsed} seconds"),
                    $activity->start_at->modify("+{$elapsed} seconds"),
                    $activity->end_at->modify("+{$elapsed} seconds"),
                );
            }
        }

        $this->users->update($user->id, [
            'pause_active' => $active,
            'pause_reason' => $active ? (trim((string) ($body['reason'] ?? '')) ?: null) : null,
            'pause_starts_at' => $startsAt,
            'pause_ends_at' => $endsAt,
        ]);

        return response()->json($this->publicUser($this->users->find($user->id)));
    }

    private function clearExpiredPause(User $user): void
    {
        if (! $user->pause_active || ! $user->pause_ends_at) {
            return;
        }

        if ($user->pause_ends_at->lte(now())) {
            $this->users->update($user->id, [
                'pause_active' => false,
                'pause_reason' => null,
                'pause_starts_at' => null,
                'pause_ends_at' => null,
            ]);
        }
    }
}
