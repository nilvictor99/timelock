<?php

namespace App\Http\Requests;

class ProfilePasswordRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', 'min:12'],
            'confirmPassword' => ['required', 'string', 'same:newPassword'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'currentPassword.required' => 'Introduce tu contraseña actual.',
            'newPassword.required' => 'La contraseña nueva es obligatoria.',
            'newPassword.min' => 'La contraseña nueva debe tener al menos 12 caracteres.',
            'confirmPassword.required' => 'Confirma la contraseña nueva.',
            'confirmPassword.same' => 'Las contraseñas nuevas no coinciden.',
        ];
    }
}
