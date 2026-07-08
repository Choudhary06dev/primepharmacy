<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind('tenant.id', function () {
            return null;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ── 1. Brute-force protection for login/register ──
        RateLimiter::for('login', function (Request $request) {
            $key = $request->input('email')
                ? strtolower($request->input('email')) . '|' . $request->ip()
                : $request->ip();

            return Limit::perMinute(5)->by($key)->response(function (Request $request, array $headers) {
                return response()->json([
                    'message' => 'Too many login attempts. Please try again in ' . $headers['Retry-After'] . ' seconds.',
                ], 429, $headers);
            });
        });

        // ── 2. General authenticated API Rate Limiting ──
        RateLimiter::for('api_general', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(120)->by($user->id)
                : Limit::perMinute(30)->by($request->ip());
        });

        // ── 3. High throughput cashier/POS Rate Limiting ──
        RateLimiter::for('api_pos', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(200)->by($user->id)
                : Limit::perMinute(60)->by($request->ip());
        });

        // ── 4. Expensive reporting and dashboard query protection ──
        RateLimiter::for('api_reports', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(30)->by($user->id)
                : Limit::perMinute(10)->by($request->ip());
        });
    }
}
