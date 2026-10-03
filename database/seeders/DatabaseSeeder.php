<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Credenciales del usuario demo que deja el seed.
     */
    private const DEMO_EMAIL = 'demo@timelock.dev';

    private const DEMO_PASSWORD = 'password';

    public function run(): void
    {
        if (User::where('email', self::DEMO_EMAIL)->exists()) {
            $this->command?->warn('El usuario demo ya existe; se omite el seed.');

            return;
        }

        $user = User::factory()
            ->onboarded()
            ->withDefaults()
            ->withHistory(days: 14)
            ->create([
                'name' => 'Demo',
                'email' => self::DEMO_EMAIL,
                'password_hash' => bcrypt(self::DEMO_PASSWORD, ['rounds' => 12]),
                'interests' => ['productividad', 'aprendizaje', 'bienestar'],
                'main_goals' => ['Mantener una racha constante', 'Leer más cada semana'],
                'daily_available_minutes' => 180,
            ]);

        $this->command?->info(sprintf(
            'Seed completo: %d categorías, %d recompensas, %d actividades, %d puntos.',
            $user->categories()->count(),
            $user->rewards()->count(),
            $user->activities()->count(),
            $user->points,
        ));

        $this->command?->table(['Email', 'Password'], [[self::DEMO_EMAIL, self::DEMO_PASSWORD]]);
    }
}
