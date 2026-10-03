<?php

namespace App\Http\Requests;

class ProfileEmailRequest extends ApiFormRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'currentPassword' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Introduce un correo válido y tu contraseña actual.',
            'email.email' => 'Introduce un correo válido y tu contraseña actual.',
            'currentPassword.required' => 'Introduce un correo válido y tu contraseña actual.',
        ];
    }
}
