<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\WithSessionClient;

uses(RefreshDatabase::class, WithSessionClient::class);

beforeEach(function () {
    $this->token = $this->authenticate();
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

    $this->get('/dashboard/qr')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Dashboard/Qr'));
});

it('shows the guest QR sign-in page', function () {
    $this->get('/auth/qr-login')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Auth/QrLogin'));
});

it('redirects guests to login', function () {
    $this->withTimelockSession('token-inexistente')
        ->get('/dashboard')
        ->assertStatus(302);
});