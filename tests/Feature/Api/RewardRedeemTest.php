<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('redeems a reward and deducts points', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $reward = $user->rewards()->where('cost', 30)->firstOrFail();
    $user->update(['points' => 100]);

    $this->patchJson("/api/rewards/{$reward->id}")
        ->assertOk()
        ->assertJson(['id' => $reward->id]);

    $reward->refresh();
    $user->refresh();

    expect($reward->redeemed_at)->not->toBeNull()
        ->and($user->points)->toBe(70);
});

it('rejects redemption with insufficient points', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $reward = $user->rewards()->where('cost', 30)->firstOrFail();

    $this->patchJson("/api/rewards/{$reward->id}")
        ->assertStatus(422);

    $user->refresh();

    expect($reward->refresh()->redeemed_at)->toBeNull()
        ->and($user->points)->toBe(0);
});

it('rejects redeeming an already redeemed reward', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $reward = $user->rewards()->where('cost', 30)->firstOrFail();
    $user->update(['points' => 100]);
    $reward->update(['redeemed_at' => now()]);

    $this->patchJson("/api/rewards/{$reward->id}")
        ->assertStatus(400);

    $user->refresh();

    expect($user->points)->toBe(100);
});

it('returns 404 for a missing reward', function () {
    $this->patchJson('/api/rewards/no-existe')
        ->assertStatus(404);
});
