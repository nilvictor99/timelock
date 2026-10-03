<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Opciones de caducidad
    |--------------------------------------------------------------------------
    |
    | El cliente manda la clave, nunca los minutos: así el servidor decide qué
    | se puede pedir y "never" es un null explícito (el token no caduca) en lugar
    | de un número que habría que interpretar. Las claves son parte de la API.
    |
    */

    'ttl_options' => [
        'never' => null,
        '5m' => 5,
        '10m' => 10,
        '1d' => 1440,
        '1w' => 10080,
        '1m' => 43200,
    ],

    /*
    |--------------------------------------------------------------------------
    | Opciones de reutilización
    |--------------------------------------------------------------------------
    |
    | null en max_uses significa usos ilimitados. El par (never, unlimited) es
    | una credencial permanente sin caducidad: se permite, pero se avisa.
    |
    */

    'use_options' => [
        '1' => 1,
        '5' => 5,
        '10' => 10,
        '25' => 25,
        'unlimited' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Valores por defecto
    |--------------------------------------------------------------------------
    |
    | Mantienen el comportamiento anterior a esta opción: 10 minutos y un solo
    | uso, de modo que /auth/qr sin cuerpo sigue devolviendo lo de siempre.
    |
    */

    'defaults' => [
        'ttl' => '10m',
        'uses' => '1',
    ],

    /*
    |--------------------------------------------------------------------------
    | Límites de peticiones
    |--------------------------------------------------------------------------
    |
    | /auth/qr-login se ha subido de 10 a 30 por minuto porque un token con
    | varios usos, o configurable desde el propio panel, hace que se pruebe
    | desde varios dispositivos. auth/qr queda igual de estricto.
    |
    */

    'throttle' => [
        'generate' => '10,1',
        'login' => '30,1',
    ],

];
