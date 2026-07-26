<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Política aplicada pelo middleware `HandleCors`, já presente na pilha
    | global do Laravel. Ela cobre apenas o boundary de API: rotas web não são
    | consumidas por outra origem.
    |
    | CORS decide quais origens podem *ler* respostas no navegador. Não é
    | autenticação nem autorização e não protege chamadas feitas fora dele.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],

    // Origens vêm do ambiente: desenvolvimento libera apenas o dev server do
    // Angular; outros ambientes declaram as suas em `CORS_ALLOWED_ORIGINS`.
    'allowed_origins' => array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:4200'))
    )),

    'allowed_origins_patterns' => [],

    // Somente o que o cliente precisa enviar. `Authorization` fica de fora
    // enquanto a API não tiver autenticação.
    'allowed_headers' => ['Accept', 'Content-Type', 'Origin'],

    'exposed_headers' => [],

    // Cache do preflight, para não repetir um OPTIONS a cada mutação.
    'max_age' => (int) env('CORS_MAX_AGE', 3600),

    // A API é stateless: não há cookie de sessão nem token para o navegador
    // anexar automaticamente.
    'supports_credentials' => false,

];
