<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    protected const COMMON_COMPROMISED = [
        'passwordpassword',
        '123456789012',
        '1234567890123456',
        'qwertyuiopasdf',
        'correcthorsebatterystaple',
        'letmeinletmein',
        'adminadminadmin',
    ];

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2'],
            'email' => ['required', 'email'],
            'password' => ['required', 'min:4', Rule::notIn(self::COMMON_COMPROMISED)],
            'acceptTerms' => ['accepted'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Introduce tu nombre.',
            'name.min' => 'Introduce tu nombre.',
            'email.required' => 'Introduce un correo válido.',
            'email.email' => 'Introduce un correo válido.',
            'password.required' => 'La contraseña debe tener al menos 4 caracteres.',
            'password.min' => 'La contraseña debe tener al menos 4 caracteres.',
            'password.not_in' => 'Elige una contraseña menos común.',
            'acceptTerms.accepted' => 'Debes aceptar los términos.',
        ];
    }
}
