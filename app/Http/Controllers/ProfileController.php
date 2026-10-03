<?php

namespace App\Http\Controllers;

use App\Http\Concerns\InteractsWithSessionCookie;
use App\Http\Requests\ProfileEmailRequest;
use App\Http\Requests\ProfilePasswordRequest;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class ProfileController extends Controller
{
    use InteractsWithSessionCookie;

    public function __construct(
        private readonly UserRepositoryInterface $users,
        private readonly AuthService $auth,
    ) {}

    public function avatar(Request $request): JsonResponse
    {
        try {
            $user = $request->attributes->get('auth_user');
            $file = $request->file('file');

            if (! $file instanceof UploadedFile
                || ! in_array($file->getMimeType(), ['image/jpeg', 'image/png', 'image/webp'], true)
                || $file->getSize() > 5 * 1024 * 1024
                || $file->getSize() <= 0) {
                return response()->json(['error' => 'La imagen debe ser JPG, PNG o WebP y pesar hasta 5 MB.'], 400);
            }

            if (! $this->looksLikeImage($file)) {
                return response()->json(['error' => 'El archivo no parece ser una imagen válida.'], 400);
            }

            $extension = match ($file->getMimeType()) {
                'image/png' => 'png',
                'image/webp' => 'webp',
                default => 'jpg',
            };

            $filename = $user->id.'-'.time().'-'.bin2hex(random_bytes(6)).'.'.$extension;

            $dir = public_path('uploads');

            if (! is_dir($dir) && ! mkdir($dir, 0775, true) && ! is_dir($dir)) {
                throw new \RuntimeException('No se pudo crear el directorio de subidas.');
            }

            $file->move($dir, $filename);

            $avatarUrl = '/uploads/'.$filename;

            if (! $this->users->update($user->id, ['avatar_url' => $avatarUrl])) {
                throw new \RuntimeException('No se pudo guardar el avatar.');
            }

            return response()->json(['avatarUrl' => $avatarUrl]);
        } catch (\Throwable) {
            return response()->json(['error' => 'No se pudo guardar la imagen.'], 500);
        }
    }

    public function email(ProfileEmailRequest $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validated();
        $newEmail = mb_strtolower(trim($validated['email']));

        try {
            if (! $user->password_hash || ! $this->auth->verifyPassword($validated['currentPassword'], $user->password_hash)) {
                return response()->json(['error' => 'La contraseña actual no es válida.'], 401);
            }

            if ($newEmail === $user->email) {
                return response()->json(['error' => 'El correo nuevo debe ser diferente.'], 400);
            }

            if ($this->users->findByEmail($newEmail) !== null) {
                return response()->json(['error' => 'Ese correo ya está en uso.'], 409);
            }

            $this->users->update($user->id, ['email' => $newEmail]);
            $this->auth->invalidateUserSessions($user->id);

            $session = $this->auth->createSession($user, true);

            $response = response()->json(['ok' => true]);

            return $this->withSessionCookie($response, $session['token'], $session['expiresAt']);
        } catch (\Throwable) {
            return response()->json(['error' => 'No se pudo actualizar el correo.'], 500);
        }
    }

    public function password(ProfilePasswordRequest $request): JsonResponse
    {
        $user = $request->attributes->get('auth_user');
        $validated = $request->validated();

        try {
            if (! $user->password_hash || ! $this->auth->verifyPassword($validated['currentPassword'], $user->password_hash)) {
                return response()->json(['error' => 'La contraseña actual no es válida.'], 401);
            }

            if ($this->auth->verifyPassword($validated['newPassword'], $user->password_hash)) {
                return response()->json(['error' => 'La nueva contraseña debe ser diferente.'], 400);
            }

            $this->users->update($user->id, ['password_hash' => $this->auth->hashPassword($validated['newPassword'])]);
            $this->auth->invalidateUserSessions($user->id);

            $session = $this->auth->createSession($user, true);

            $response = response()->json(['ok' => true]);

            return $this->withSessionCookie($response, $session['token'], $session['expiresAt']);
        } catch (\Throwable) {
            return response()->json(['error' => 'No se pudo actualizar la contraseña.'], 500);
        }
    }

    private function looksLikeImage(UploadedFile $file): bool
    {
        $handle = fopen($file->getRealPath(), 'rb');
        if (! $handle) {
            return false;
        }

        $head = (string) fread($handle, 12);
        fclose($handle);

        if (str_starts_with($head, "\xFF\xD8\xFF")) {
            return true;
        }

        if (str_starts_with($head, "\x89\x50\x4E\x47\x0D\x0A\x1A\x0A")) {
            return true;
        }

        return substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP';
    }
}
