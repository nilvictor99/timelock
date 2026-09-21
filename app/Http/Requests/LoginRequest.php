<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoginRequest extends FormRequest
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
            'email' => ['required', 'email'],
            'password' => ['required', 'min:12', Rule::notIn(self::COMMON_COMPROMISED)],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Introduce un correo válido.',
            'email.email' => 'Introduce un correo válido.',
            'password.required' => 'La contraseña debe tener al menos 12 caracteres.',
            'password.min' => 'La contraseña debe tener al menos 12 caracteres.',
            'password.not_in' => 'Elige una contraseña menos común.',
        ];
    }
}
