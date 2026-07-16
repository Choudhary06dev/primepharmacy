<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Global security headers on every response
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->alias([
            'tenant' => \App\Http\Middleware\IdentifyTenant::class,
            'subscription' => \App\Http\Middleware\CheckSubscription::class,
            'auth.rate.limit' => \App\Http\Middleware\AuthRateLimit::class,
        ]);

        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return null;
            }
            return \Illuminate\Support\Facades\Route::has('login') 
                ? route('login') 
                : null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                \Illuminate\Support\Facades\Log::error('API Database Query Exception: ' . $e->getMessage(), [
                    'exception' => $e,
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json([
                    'message' => 'A database error occurred.'
                ], 500);
            }
        });

        $exceptions->render(function (\PDOException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                \Illuminate\Support\Facades\Log::error('API Database PDO Exception: ' . $e->getMessage(), [
                    'exception' => $e,
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json([
                    'message' => 'A database connection error occurred.'
                ], 500);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->wantsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.'
                ], 401);
            }
        });
    })->create();
