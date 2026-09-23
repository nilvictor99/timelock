<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
    App\Models\User::where('email', $this->sessionEmail)->firstOrFail()->update(['onboarding_completed' => true]);
    $this->withTimelockSession($this->token);
});

it('serves the dashboard page', function () {
    $this->get('/dashboard')->assertOk();
});

it('serves dashboard sub-pages with the session user', function () {
    $this->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Index'));

    $this->get('/dashboard/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Profile')->has('user.id'));

    $this->get('/dashboard/settings')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Settings')->has('user.theme'));

    $this->get('/dashboard/stats')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Stats'));
});

it('redirects an unfinished onboarding user away from the dashboard', function () {
    $newbieToken = $this->authenticate();
    $this->withTimelockSession($newbieToken)
        ->get('/dashboard')
        ->assertRedirect(route('onboarding'));
});

it('redirects a completed onboarding user away from onboarding', function () {
    $this->get('/onboarding')->assertRedirect(route('dashboard'));
});

it('does not expose removed guest QR pages', function () {
    $this->get('/auth/qr-login')->assertStatus(405);
    $this->get('/dashboard/qr')->assertStatus(404);
});

it('redirects guests to login', function () {
    $this->withTimelockSession('token-inexistente')
        ->get('/dashboard')
        ->assertStatus(302);
});