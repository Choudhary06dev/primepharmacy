<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $pharmacyId = null;

        // 1. Resolve from authenticated user
        if ($request->user()) {
            $pharmacyId = $request->user()->pharmacy_id;
        }
        // 2. Fallback to request header (useful for debug or webhook routes)
        elseif ($request->hasHeader('X-Pharmacy-ID')) {
            $pharmacyId = $request->header('X-Pharmacy-ID');
        }

        // If a tenant is identified, bind it to the container
        if ($pharmacyId) {
            app()->instance('tenant.id', (int) $pharmacyId);

            // Configure Spatie's Teams feature
            if (config('permission.teams')) {
                setPermissionsTeamId((int) $pharmacyId);
            }
        }

        return $next($request);
    }
}
