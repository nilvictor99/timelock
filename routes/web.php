<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SuggestionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::name('home')->get('/', fn () => Inertia::render('Landing'));

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth.session')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');
    Route::post('/auth/qr', [AuthController::class, 'qr'])->name('auth.qr');
});

Route::post('/auth/qr-login', [AuthController::class, 'qrLogin'])
    ->middleware('throttle:10,1')
    ->name('auth.qr-login');

Route::middleware('auth.session')->group(function () {
    Route::get('/onboarding', function (Request $request) {
        $user = $request->attributes->get('auth_user');
        if ($user !== null && $user->onboarding_completed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Onboarding');
    })->name('onboarding');
    Route::get('/dashboard/profile', fn (Request $request) => Inertia::render('Dashboard/Profile', ['user' => $request->attributes->get('auth_user')]))->name('dashboard.profile');
    Route::get('/dashboard/settings', fn (Request $request) => Inertia::render('Dashboard/Settings', ['user' => $request->attributes->get('auth_user')]))->name('dashboard.settings');
    Route::get('/dashboard/stats', fn () => Inertia::render('Dashboard/Stats'))->name('dashboard.stats');
    Route::get('/dashboard/activities', fn () => Inertia::render('Dashboard/Activities'))->name('dashboard.activities');
    Route::get('/dashboard/suggestions', fn () => Inertia::render('Dashboard/Suggestions'))->name('dashboard.suggestions');
    Route::get('/dashboard/rewards', fn () => Inertia::render('Dashboard/Rewards'))->name('dashboard.rewards');
    Route::get('/dashboard/calendar', fn () => Inertia::render('Dashboard/Calendar'))->name('dashboard.calendar');
    Route::get('/dashboard/streak', fn () => Inertia::render('Dashboard/Streak'))->name('dashboard.streak');
    Route::get('/dashboard/export', fn () => Inertia::render('Dashboard/Export'))->name('dashboard.export');
    Route::get('/dashboard', function (Request $request) {
        $tab = $request->query('tab');
        $legacy = ['activities', 'suggestions', 'rewards', 'calendar', 'streak', 'export'];

        if (is_string($tab) && in_array($tab, $legacy, true)) {
            return redirect()->to('/dashboard/'.$tab);
        }

        $user = $request->attributes->get('auth_user');
        if ($user !== null && ! $user->onboarding_completed) {
            return redirect()->route('onboarding');
        }

        return Inertia::render('Dashboard/Index');
    })->name('dashboard');

    Route::get('/api/bootstrap', [DashboardController::class, 'bootstrap'])->name('api.bootstrap');
    Route::get('/api/stats/summary', [StatsController::class, 'summary'])->name('api.stats.summary');
    Route::post('/api/bootstrap', [DashboardController::class, 'store']);
    Route::patch('/api/bootstrap', [DashboardController::class, 'patchActivity']);
    Route::delete('/api/bootstrap', [DashboardController::class, 'destroy']);
    Route::patch('/api/rewards/{reward}', [DashboardController::class, 'redeemReward']);

    Route::get('/api/export', [ExportController::class, 'show'])->name('api.export');

    Route::post('/api/profile/avatar', [ProfileController::class, 'avatar'])->name('api.profile.avatar');
    Route::post('/api/profile/email', [ProfileController::class, 'email'])->name('api.profile.email');
    Route::post('/api/profile/password', [ProfileController::class, 'password'])->name('api.profile.password');

    Route::get('/api/suggestions', [SuggestionController::class, 'index'])->name('api.suggestions');
    Route::post('/api/suggestions', [SuggestionController::class, 'generate'])->name('api.suggestions.generate');

    Route::post('/api/ai/test-connection', [AiController::class, 'testConnection'])->name('api.ai.test-connection');
});
