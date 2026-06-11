<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Pharmacy;

class CheckSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $pharmacyId = app()->bound('tenant.id') ? app('tenant.id') : null;

        if ($pharmacyId) {
            $pharmacy = Pharmacy::find($pharmacyId);

            if (!$pharmacy) {
                return response()->json([
                    'message' => 'Pharmacy not found.'
                ], 404);
            }

            // Gating based on status
            if ($pharmacy->status === 'suspended') {
                return response()->json([
                    'message' => 'Your pharmacy account has been suspended. Please contact administrator support.'
                ], 403);
            }

            if ($pharmacy->status === 'trial') {
                if ($pharmacy->trial_ends_at && $pharmacy->trial_ends_at->isPast()) {
                    return response()->json([
                        'message' => 'Your free trial has expired. Please subscribe to a plan to continue.'
                    ], 403);
                }
            } elseif ($pharmacy->status !== 'active') {
                return response()->json([
                    'message' => 'Your subscription is inactive or expired. Please renew your plan to regain access.'
                ], 403);
            }
        }

        return $next($request);
    }
}
