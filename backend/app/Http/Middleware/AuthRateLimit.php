<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class AuthRateLimit
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $ip = $request->ip();
        
        // Retrieve account identifier if present
        $account = $request->input('email') ?: $request->input('username');

        // Retrieve config values with fallbacks
        $maxAttempts = config('ratelimit.auth.max_attempts', 5);
        $baseBackoff = config('ratelimit.auth.base_backoff_seconds', 30);
        $maxBackoff = config('ratelimit.auth.max_backoff_seconds', 3600);

        // Normalize account name
        $normalizedAccount = null;
        if ($account && is_string($account)) {
            $normalizedAccount = strtolower(trim($account));
        }

        // Cache keys
        $ipFailuresKey = 'auth_failures:ip:' . $ip;
        $ipLastFailKey = 'auth_last_fail:ip:' . $ip;
        
        $accountFailuresKey = $normalizedAccount ? 'auth_failures:account:' . md5($normalizedAccount) : null;
        $accountLastFailKey = $normalizedAccount ? 'auth_last_fail:account:' . md5($normalizedAccount) : null;

        // 1. Enforce IP-based lock
        $ipFailures = (int) Cache::get($ipFailuresKey, 0);
        if ($ipFailures >= $maxAttempts) {
            $lastFailTime = (int) Cache::get($ipLastFailKey, 0);
            if ($lastFailTime > 0) {
                $backoffFactor = $ipFailures - $maxAttempts;
                $backoffSeconds = min($baseBackoff * pow(2, $backoffFactor), $maxBackoff);
                $elapsed = now()->timestamp - $lastFailTime;
                
                if ($elapsed < $backoffSeconds) {
                    $retryAfter = (int) ($backoffSeconds - $elapsed);
                    return response()->json([
                        'message' => 'Too many login attempts. Please try again in ' . $retryAfter . ' seconds.',
                    ], 429, [
                        'Retry-After' => $retryAfter,
                        'X-RateLimit-Limit' => $maxAttempts,
                        'X-RateLimit-Remaining' => 0,
                        'X-RateLimit-Reset' => now()->timestamp + $retryAfter,
                    ]);
                }
            }
        }

        // 2. Enforce Account-based lock
        if ($accountFailuresKey) {
            $accountFailures = (int) Cache::get($accountFailuresKey, 0);
            if ($accountFailures >= $maxAttempts) {
                $lastFailTime = (int) Cache::get($accountLastFailKey, 0);
                if ($lastFailTime > 0) {
                    $backoffFactor = $accountFailures - $maxAttempts;
                    $backoffSeconds = min($baseBackoff * pow(2, $backoffFactor), $maxBackoff);
                    $elapsed = now()->timestamp - $lastFailTime;

                    if ($elapsed < $backoffSeconds) {
                        $retryAfter = (int) ($backoffSeconds - $elapsed);
                        return response()->json([
                            'message' => 'Too many attempts on this account. Please try again in ' . $retryAfter . ' seconds.',
                        ], 429, [
                            'Retry-After' => $retryAfter,
                            'X-RateLimit-Limit' => $maxAttempts,
                            'X-RateLimit-Remaining' => 0,
                            'X-RateLimit-Reset' => now()->timestamp + $retryAfter,
                        ]);
                    }
                }
            }
        }

        // 3. Process the request
        $response = $next($request);

        // 4. Update failure/success logs based on response status
        $isSuccess = $response->getStatusCode() === 200 || $response->getStatusCode() === 201;

        if ($isSuccess) {
            // Reset failure count on success
            Cache::forget($ipFailuresKey);
            Cache::forget($ipLastFailKey);

            if ($accountFailuresKey) {
                Cache::forget($accountFailuresKey);
                Cache::forget($accountLastFailKey);
            }
        } else {
            // Increment failure count on errors (e.g. 401, 403, 400, 422)
            $newIpFailures = $ipFailures + 1;
            Cache::put($ipFailuresKey, $newIpFailures, now()->addDays(1));
            Cache::put($ipLastFailKey, now()->timestamp, now()->addDays(1));

            if ($accountFailuresKey) {
                $newAccountFailures = ($accountFailures ?? 0) + 1;
                Cache::put($accountFailuresKey, $newAccountFailures, now()->addDays(1));
                Cache::put($accountLastFailKey, now()->timestamp, now()->addDays(1));
            }
        }

        return $response;
    }
}
