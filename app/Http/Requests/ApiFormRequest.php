<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\ValidationException;

/**
 * FormRequest para endpoints JSON de la SPA: 400 con {error} en vez de 422.
 */
abstract class ApiFormRequest extends FormRequest
{
    /**
     * @return array<string, mixed>
     */
    abstract public function rules(): array;

    protected function failedValidation(Validator $validator): void
    {
        $errors = (new ValidationException($validator))->errors();

        $first = [];
        foreach ($errors as $messages) {
            $first = $messages;
            break;
        }

        throw new HttpResponseException(
            response()->json(['error' => $first[0] ?? 'Datos no válidos.'], 400),
        );
    }
}
