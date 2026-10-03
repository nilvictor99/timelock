<?php

use App\Models\Activity;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    $this->withTimelockSession($this->token);
});

it('exports csv by default with headers', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    Activity::create([
        'user_id' => $user->id,
        'title' => 'Tarea, con comilla "dobles"',
        'date' => now()->toDateString(),
        'start_at' => now(),
        'end_at' => now()->addHour(),
        'status' => 'COMPLETED',
        'points' => 5,
        'is_free' => false,
    ]);

    $response = $this->get('/api/export');

    expect($response->headers->get('content-type'))->toContain('text/csv')
        ->and($response->headers->get('content-disposition'))->toContain('timelock-export.csv')
        ->and($response->getContent())
        ->toContain('Actividad,Categoria,Inicio,Fin,Estado,Puntos')
        ->toContain('Tarea, con comilla ""dobles""');
});

it('exports json with curated settings', function () {
    $response = $this->getJson('/api/export?format=json')->assertOk();

    $data = $response->json();

    expect($data['user']['email'])->toBe($this->sessionEmail)
        ->and($data['user']['settings']['profileVisibility'])->toBe('PRIVATE')
        ->and($data['activities'])->toBeArray()
        ->and($data['user'])->not->toHaveKey('passwordHash');
});

it('respects date range filters', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    Activity::create([
        'user_id' => $user->id,
        'title' => 'Pasada',
        'date' => now()->subDays(30)->toDateString(),
        'start_at' => now()->subDays(30),
        'end_at' => now()->subDays(30)->addHour(),
        'status' => 'PLANNED',
        'points' => 1,
        'is_free' => false,
    ]);

    $data = $this->getJson('/api/export?format=json&from='.now()->subDays(5)->toDateString().'&to='.now()->addDays(1)->toDateString())
        ->assertOk()
        ->json();

    expect($data['activities'])->toHaveCount(0);
});

it('rejects an invalid date range', function () {
    $this->getJson('/api/export?from=not-a-date', ['Accept' => 'application/json'])
        ->assertStatus(400)
        ->assertJson(['error' => 'Rango de fechas no válido.']);
});

it('filters the csv by activity ids', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $kept = makeActivity($user, 'Deep work');
    makeActivity($user, 'Gym');

    $csv = $this->get('/api/export?format=csv&activities='.$kept->id)
        ->assertOk()
        ->getContent();

    expect($csv)->toContain('Deep work')->not->toContain('Gym');
});

it('filters the csv by category ids', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();

    $work = Category::create(['user_id' => $user->id, 'name' => 'Filtro Trabajo', 'color' => '#3b82f6']);
    $rest = Category::create(['user_id' => $user->id, 'name' => 'Filtro Descanso', 'color' => '#22c55e']);

    makeActivity($user, 'Reunión', $work->id);
    makeActivity($user, 'Paseo', $rest->id);

    $csv = $this->get('/api/export?format=csv&categories='.$work->id)
        ->assertOk()
        ->getContent();

    expect($csv)->toContain('Reunión', 'Filtro Trabajo')->not->toContain('Paseo', 'Filtro Descanso');
});

it('returns an empty csv when a filter matches nothing', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    makeActivity($user, 'Gym');

    $csv = $this->get('/api/export?format=csv&categories='.Category::create([
        'user_id' => $user->id,
        'name' => 'Sin uso',
        'color' => '#000000',
    ])->id)
        ->assertOk()
        ->getContent();

    expect(explode("\n", trim($csv)))->toHaveCount(1)
        ->and(trim($csv))->toBe('Actividad,Categoria,Inicio,Fin,Estado,Puntos');
});

it('ignores filters on the json dump', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    makeActivity($user, 'Deep work');

    $data = $this->getJson('/api/export?format=json&activities=nonexistent&categories=nonexistent')
        ->assertOk()
        ->json();

    expect($data['activities'])->toHaveCount(1);
});

it('treats an empty id list as no filter', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    makeActivity($user, 'Deep work');

    $csv = $this->get('/api/export?format=csv&activities=&categories=')
        ->assertOk()
        ->getContent();

    expect($csv)->toContain('Deep work');
});

it('ignores duplicated and excessive id lists', function () {
    $user = User::where('email', $this->sessionEmail)->firstOrFail();
    $kept = makeActivity($user, 'Deep work');
    makeActivity($user, 'Gym');

    $ids = array_merge([$kept->id, $kept->id], range(1, 150));

    $csv = $this->get('/api/export?format=csv&activities='.implode(',', $ids))
        ->assertOk()
        ->getContent();

    expect($csv)->toContain('Deep work')->not->toContain('Gym');
});

it('requires a session to export', function () {
    $this->withTimelockSession('token-inexistente')
        ->getJson('/api/export')
        ->assertStatus(401);
});

function makeActivity(User $user, string $title, ?string $categoryId = null): Activity
{
    return Activity::create([
        'user_id' => $user->id,
        'category_id' => $categoryId,
        'title' => $title,
        'date' => now()->toDateString(),
        'start_at' => now(),
        'end_at' => now()->addHour(),
        'status' => 'COMPLETED',
        'points' => 5,
        'is_free' => false,
    ]);
}
