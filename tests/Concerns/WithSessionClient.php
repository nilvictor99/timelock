<?php

namespace Tests\Concerns;

use App\Services\AuthService;
use Illuminate\Http\UploadedFile;

trait WithSessionClient
{
    public $sessionEmail;

    /**
     * Autentica con una sesión real y devuelve el token de la cookie.
     */
    private function authenticate(array $user = []): string
    {
        $auth = app(AuthService::class);

        $this->sessionEmail = 'test-'.bin2hex(random_bytes(6)).'@example.com';

        $result = $auth->register(array_merge([
            'email' => $this->sessionEmail,
            'name' => 'Test User',
            'password' => 'clave-super-segura-ok',
        ], $user));

        return $result['token'];
    }

    private function withTimelockSession(string $token): static
    {
        return $this->withUnencryptedCookie(AuthService::SESSION_COOKIE, $token)
            ->withCredentials();
    }

    private function makeUpload(string $bytes, string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $bytes);
    }

    private function cleanupUpload(string $url): void
    {
        $file = public_path(ltrim((string) $url, '/'));

        if (is_file($file)) {
            @unlink($file);
        }
    }
}
