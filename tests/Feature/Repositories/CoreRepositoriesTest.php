<?php

use App\Models\Activity;
use App\Models\Category;
use App\Models\Reward;
use App\Models\Suggestion;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Repositories\Contracts\SuggestionRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Support\Str;

function makeUserB(string $email)
{
    return app(UserRepositoryInterface::class)->createWithDefaults(['email' => $email, 'name' => 'U']);
}

it('manages sessions (create, find, consume, delete)', function () {
    $user = makeUserB('sess@example.com');
    $repo = app(SessionRepositoryInterface::class);

    $repo->create($user->id, hash('sha256', 'token-1'), now()->addDays(30));
    $repo->create($user->id, hash('sha256', 'token-2'), now()->subDay());

    expect($repo->findByTokenHash(hash('sha256', 'token-1')))->not->toBeNull();

    ['session' => $session, 'user' => $found] = $repo->findWithUser(hash('sha256', 'token-1'));
    expect($found?->id)->toBe($user->id);

    expect($repo->deleteByTokenHash(hash('sha256', 'token-1')))->toBeTrue();
    expect($repo->deleteExpired())->toBe(1);
    expect($repo->findByTokenHash(hash('sha256', 'token-1')))->toBeNull();
});

it('deletes all sessions for a user', function () {
    $user = makeUserB('sess2@example.com');
    $repo = app(SessionRepositoryInterface::class);

    $repo->create($user->id, hash('sha256', 'a'), now()->addDay());
    $repo->create($user->id, hash('sha256', 'b'), now()->addDay());

    expect($repo->deleteByUser($user->id))->toBe(2);
});

it('manages qr login tokens (create, recordUse, deleteAll)', function () {
    $user = makeUserB('qr@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $token = $repo->create($user->id, hash('sha256', 'qr-1'), now()->addMinutes(10), 1);

    expect($repo->findByHash(hash('sha256', 'qr-1'))?->id)->toBe($token->id);
    expect($repo->recordUse($token->id))->toBeTrue()
        ->and($token->fresh()->used_at)->not->toBeNull()
        ->and($token->fresh()->uses_count)->toBe(1);

    $expired = $repo->create($user->id, hash('sha256', 'qr-old'), now()->subMinute(), 1);
    expect($repo->deleteAll($user->id))->toBe(2)
        ->and($expired->fresh())->toBeNull();
});

it('only lets a single-use token be spent once', function () {
    $user = makeUserB('qru@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $token = $repo->create($user->id, hash('sha256', 'qr-once'), now()->addMinutes(10), 1);

    expect($repo->recordUse($token->id))->toBeTrue()
        ->and($repo->recordUse($token->id))->toBeFalse()
        ->and($token->fresh()->uses_count)->toBe(1);
});

it('keeps honouring a token until its use budget runs out', function () {
    $user = makeUserB('qrm@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $token = $repo->create($user->id, hash('sha256', 'qr-many'), now()->addMinutes(10), 2);

    expect($repo->recordUse($token->id))->toBeTrue()
        ->and($repo->recordUse($token->id))->toBeTrue()
        ->and($repo->recordUse($token->id))->toBeFalse()
        ->and($token->fresh()->uses_count)->toBe(2);
});

it('treats a null budget or a null expiry as unlimited', function () {
    $user = makeUserB('qrz@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $perpetual = $repo->create($user->id, hash('sha256', 'qr-forever'), null, null);
    $unlimitedUses = $repo->create($user->id, hash('sha256', 'qr-uses'), now()->addMinute(), null);

    expect($repo->recordUse($perpetual->id))->toBeTrue()
        ->and($repo->recordUse($perpetual->id))->toBeTrue()
        ->and($repo->recordUse($unlimitedUses->id))->toBeTrue()
        ->and($repo->recordUse($unlimitedUses->id))->toBeTrue();
});

it('refuses a use once the token has expired', function () {
    $user = makeUserB('qrx@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $token = $repo->create($user->id, hash('sha256', 'qr-gone'), now()->subMinute(), 1);

    expect($repo->recordUse($token->id))->toBeFalse()
        ->and($token->fresh()->uses_count)->toBe(0);
});

it('prunes expired and spent tokens but keeps perpetual ones', function () {
    $user = makeUserB('qrp@example.com');
    $repo = app(QrLoginTokenRepositoryInterface::class);

    $fresh = $repo->create($user->id, hash('sha256', 'qr-fresh'), now()->addMinutes(10), 5);
    $repo->create($user->id, hash('sha256', 'qr-expired'), now()->subMinute(), 5);

    $spent = $repo->create($user->id, hash('sha256', 'qr-spent'), now()->addMinutes(10), 1);
    $repo->recordUse($spent->id);

    $perpetual = $repo->create($user->id, hash('sha256', 'qr-forever'), null, null);

    expect($repo->prune())->toBe(2)
        ->and($repo->findByHash(hash('sha256', 'qr-fresh'))?->id)->toBe($fresh->id)
        ->and($repo->findByHash(hash('sha256', 'qr-expired')))->toBeNull()
        ->and($repo->findByHash(hash('sha256', 'qr-spent')))->toBeNull()
        ->and($repo->findByHash(hash('sha256', 'qr-forever'))?->id)->toBe($perpetual->id);
});

it('manages rewards scoped by user', function () {
    $user = makeUserB('rew@example.com');
    $repo = app(RewardRepositoryInterface::class);

    $reward = $repo->create(['user_id' => $user->id, 'title' => 'Helado', 'cost' => 25, 'description' => null]);

    expect($reward->exists)->toBeTrue();
    expect($repo->findByUser($user->id))->toHaveCount(1);
});

it('manages suggestions (bulk create, by generation, recent)', function () {
    $user = makeUserB('sug@example.com');
    $repo = app(SuggestionRepositoryInterface::class);

    $rows = array_map(fn ($i) => [
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'generation_id' => 'gen-1',
        'title' => "Sug $i",
        'category' => 'Deporte',
        'duration' => 30,
        'reason' => 'Razon',
        'points' => 10,
        'suggested_time' => null,
        'source' => 'rule',
        'created_at' => now(),
    ], range(1, 3));

    expect($repo->createMany($rows))->toBe(3)
        ->and($repo->findByGeneration($user->id, 'gen-1'))->toHaveCount(3)
        ->and($repo->findRecent($user->id, 5))->toHaveCount(3);
});

it('handles category deletion by setting activity category to null', function () {
    $user = makeUserB('catlink@example.com');
    $category = Category::create(['user_id' => $user->id, 'name' => 'Arte']);
    $activity = Activity::create([
        'id' => (string) Str::uuid(),
        'user_id' => $user->id,
        'category_id' => $category->id,
        'title' => 'Dibujo',
        'date' => now(),
        'start_at' => now(),
        'end_at' => now()->addHour(),
    ]);

    $category->delete();

    expect($activity->fresh()->category_id)->toBeNull();
});

it('awards via reward create roundtrip', function () {
    $user = makeUserB('roundtrip@example.com');
    $repo = app(RewardRepositoryInterface::class);
    $reward = $repo->create(['user_id' => $user->id, 'title' => 'X', 'cost' => 5]);

    expect(Reward::find($reward->id)?->title)->toBe('X')
        ->and($repo->findByUser($user->id)->first()->cost)->toBe(5)
        ->and((int) Suggestion::where('user_id', $user->id)->count())->toBe(0);
});
