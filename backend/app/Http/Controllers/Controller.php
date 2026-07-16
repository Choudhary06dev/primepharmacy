<?php

namespace App\Http\Controllers;

abstract class Controller
{
    /**
     * Safely log an exception and return a user-friendly error response without leaking details.
     */
    protected function handleSafeError(\Exception $e, string $defaultMessage, int $status = 500)
    {
        // Log the full traceback and details server-side
        \Illuminate\Support\Facades\Log::error($defaultMessage . ': ' . $e->getMessage(), [
            'exception' => $e,
            'trace' => $e->getTraceAsString(),
        ]);

        // Hide raw database or internal class exceptions, return a clean message
        if ($e instanceof \Illuminate\Database\QueryException || 
            $e instanceof \PDOException || 
            $e instanceof \RuntimeException || 
            $e instanceof \ErrorException || 
            $e instanceof \TypeError) {
            return response()->json([
                'message' => $defaultMessage
            ], $status);
        }

        // For expected business or validation exceptions, we can show their message
        return response()->json([
            'message' => $defaultMessage . ': ' . $e->getMessage()
        ], $status);
    }
}
