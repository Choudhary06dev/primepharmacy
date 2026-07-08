<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * SecurityHeaders Middleware
 *
 * Sets production-grade security response headers on every API response.
 * Environment-aware: adjusts CSP and HSTS based on APP_ENV.
 *
 * Headers applied:
 * - X-Frame-Options (clickjacking)
 * - X-Content-Type-Options (MIME sniffing)
 * - Referrer-Policy (referrer leakage)
 * - Permissions-Policy (device API lockdown)
 * - Content-Security-Policy (XSS prevention)
 * - Strict-Transport-Security (HTTPS enforcement, production only)
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // ── Clickjacking Protection ──
        $response->headers->set('X-Frame-Options', 'DENY');

        // ── MIME Sniffing Protection ──
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // ── Disable legacy XSS auditor (CSP replaces it) ──
        $response->headers->set('X-XSS-Protection', '0');

        // ── Referrer Policy ──
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // ── Permissions Policy (restrict sensitive device APIs) ──
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

        // ── Content Security Policy ──
        $csp = $this->buildCsp();
        $response->headers->set('Content-Security-Policy', $csp);

        // ── Cache-Control for Authenticated ERP API Endpoints ──
        // Prevents browser and proxy caching of sensitive pharmacy/financial reports
        if ($request->route() && $this->isAuthRoute($request)) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
        }

        // ── HSTS (production only — never set on HTTP localhost) ──
        if (app()->environment('production', 'staging')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        return $response;
    }

    /**
     * Determine if the current route is protected by authentication.
     */
    private function isAuthRoute(Request $request): bool
    {
        $route = $request->route();
        if (!$route) {
            return false;
        }

        $middleware = $route->gatherMiddleware();
        return in_array('auth:sanctum', $middleware) || in_array('auth', $middleware);
    }

    /**
     * Build a Content-Security-Policy string appropriate for the environment.
     */
    private function buildCsp(): string
    {
        $isLocal = app()->environment('local', 'testing');

        $directives = [
            "default-src 'self'",
            "script-src 'self'" . ($isLocal ? " 'unsafe-inline' 'unsafe-eval'" : ''),
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob:",
            "connect-src 'self'" . ($isLocal ? ' ws://localhost:* http://localhost:* http://127.0.0.1:*' : ''),
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ];

        return implode('; ', $directives);
    }
}
