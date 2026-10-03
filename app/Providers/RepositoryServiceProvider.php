<?php

namespace App\Providers;

use App\Repositories\Contracts\ActivityRepositoryInterface;
use App\Repositories\Contracts\AttendanceRepositoryInterface;
use App\Repositories\Contracts\CategoryRepositoryInterface;
use App\Repositories\Contracts\QrLoginTokenRepositoryInterface;
use App\Repositories\Contracts\RewardRepositoryInterface;
use App\Repositories\Contracts\SessionRepositoryInterface;
use App\Repositories\Contracts\SuggestionRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\ActivityRepository;
use App\Repositories\Eloquent\AttendanceRepository;
use App\Repositories\Eloquent\CategoryRepository;
use App\Repositories\Eloquent\QrLoginTokenRepository;
use App\Repositories\Eloquent\RewardRepository;
use App\Repositories\Eloquent\SessionRepository;
use App\Repositories\Eloquent\SuggestionRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(SessionRepositoryInterface::class, SessionRepository::class);
        $this->app->bind(CategoryRepositoryInterface::class, CategoryRepository::class);
        $this->app->bind(ActivityRepositoryInterface::class, ActivityRepository::class);
        $this->app->bind(RewardRepositoryInterface::class, RewardRepository::class);
        $this->app->bind(QrLoginTokenRepositoryInterface::class, QrLoginTokenRepository::class);
        $this->app->bind(SuggestionRepositoryInterface::class, SuggestionRepository::class);
        $this->app->bind(AttendanceRepositoryInterface::class, AttendanceRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
