<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Authentication Rate Limiting (Stricter limits with Exponential Backoff)
    |--------------------------------------------------------------------------
    */
    'auth' => [
        // Number of attempts allowed before backoff kicks in
        'max_attempts' => (int) env('RATE_LIMIT_AUTH_MAX_ATTEMPTS', 5),
        
        // Base backoff time in seconds (e.g. 30 seconds after 5 failed attempts)
        'base_backoff_seconds' => (int) env('RATE_LIMIT_AUTH_BASE_BACKOFF', 30),
        
        // Maximum backoff duration in seconds (e.g. 1 hour = 3600 seconds)
        'max_backoff_seconds' => (int) env('RATE_LIMIT_AUTH_MAX_BACKOFF', 3600),
    ],

    /*
    |--------------------------------------------------------------------------
    | Public Endpoint Rate Limiting (Moderate limits)
    |--------------------------------------------------------------------------
    */
    'public' => [
        'attempts_per_minute' => (int) env('RATE_LIMIT_PUBLIC_ATTEMPTS', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authenticated User Actions (Looser limits)
    |--------------------------------------------------------------------------
    */
    'general' => [
        'authenticated_attempts_per_minute' => (int) env('RATE_LIMIT_GENERAL_AUTH', 120),
        'guest_attempts_per_minute' => (int) env('RATE_LIMIT_GENERAL_GUEST', 30),
    ],

    'pos' => [
        'authenticated_attempts_per_minute' => (int) env('RATE_LIMIT_POS_AUTH', 200),
        'guest_attempts_per_minute' => (int) env('RATE_LIMIT_POS_GUEST', 60),
    ],

    'reports' => [
        'authenticated_attempts_per_minute' => (int) env('RATE_LIMIT_REPORTS_AUTH', 30),
        'guest_attempts_per_minute' => (int) env('RATE_LIMIT_REPORTS_GUEST', 10),
    ],
];
