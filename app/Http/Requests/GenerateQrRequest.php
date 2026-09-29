<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateQrRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Only the keys from config/qr.php are accepted, so the client can never
     * ask for an arbitrary lifetime or an arbitrary number of uses.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ttl' => ['sometimes', 'string', Rule::in(array_keys(config('qr.ttl_options')))],
            'uses' => ['sometimes', 'string', Rule::in(array_keys(config('qr.use_options')))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ttl.in' => 'Caducidad no válida.',
            'uses.in' => 'Número de usos no válido.',
        ];
    }

    public function ttlKey(): string
    {
        return (string) ($this->validated('ttl') ?? config('qr.defaults.ttl'));
    }

    public function useKey(): string
    {
        return (string) ($this->validated('uses') ?? config('qr.defaults.uses'));
    }
}
