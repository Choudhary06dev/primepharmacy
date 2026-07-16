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
        // ── 1. Public Endpoint Rate Limiting (Moderate limits) ──
        RateLimiter::for('api_public', function (Request $request) {
            return Limit::perMinute(config('ratelimit.public.attempts_per_minute', 60))->by($request->ip());
        });

        // ── 2. General authenticated API Rate Limiting ──
        RateLimiter::for('api_general', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(config('ratelimit.general.authenticated_attempts_per_minute', 120))->by($user->id)
                : Limit::perMinute(config('ratelimit.general.guest_attempts_per_minute', 30))->by($request->ip());
        });

        // ── 3. High throughput cashier/POS Rate Limiting ──
        RateLimiter::for('api_pos', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(config('ratelimit.pos.authenticated_attempts_per_minute', 200))->by($user->id)
                : Limit::perMinute(config('ratelimit.pos.guest_attempts_per_minute', 60))->by($request->ip());
        });

        // ── 4. Expensive reporting and dashboard query protection ──
        RateLimiter::for('api_reports', function (Request $request) {
            $user = $request->user();
            return $user
                ? Limit::perMinute(config('ratelimit.reports.authenticated_attempts_per_minute', 30))->by($user->id)
                : Limit::perMinute(config('ratelimit.reports.guest_attempts_per_minute', 10))->by($request->ip());
        });

        // ── 5. Strict Phone Number Validation ──
        \Illuminate\Support\Facades\Validator::extend('phone', function ($attribute, $value, $parameters, $validator) {
            if (!is_string($value)) {
                return false;
            }
            return preg_match('/^\+?[0-9\s\-()]{7,20}$/', $value);
        });

        \Illuminate\Support\Facades\Validator::replacer('phone', function ($message, $attribute, $rule, $parameters) {
            return str_replace(':attribute', $attribute, 'The :attribute field must be a valid phone number (7-20 digits, optionally starting with +).');
        });
    }
}
