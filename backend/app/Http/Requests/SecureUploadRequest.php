<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\File;
use Illuminate\Support\Str;

/**
 * SecureUploadRequest
 *
 * A reusable Laravel Form Request blueprint for secure file uploads.
 * Implements rigorous type whitelisting, size restrictions, content checking,
 * and secure storage strategies.
 */
class SecureUploadRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Enforce that only authenticated ERP users can upload files
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                // Enforce mime allowlist and strict size limits (5MB default)
                File::types(['jpg', 'jpeg', 'png', 'pdf', 'csv'])
                    ->max(5 * 1024), // Max 5MB
            ],
            // Type determines sub-folder and validation overrides
            'type' => 'required|in:logo,attachment,import',
        ];
    }

    /**
     * Configure overrides or specific validations after basic rules pass.
     */
    protected function passedValidation(): void
    {
        $file = $this->file('file');
        $type = $this->input('type');

        // Extra image-specific validation for logos
        if ($type === 'logo') {
            // Verify real image MIME type to block double extension / spoofing
            if (!in_array($file->getMimeType(), ['image/jpeg', 'image/png'])) {
                abort(response()->json(['errors' => ['file' => ['The logo must be a valid JPEG or PNG image.']]], 422));
            }
            // Strict 2MB limit for logos
            if ($file->getSize() > 2 * 1024 * 1024) {
                abort(response()->json(['errors' => ['file' => ['The logo size must not exceed 2MB.']]], 422));
            }
        }

        // CSV validation for raw imports
        if ($type === 'import') {
            $allowedMimeTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
            if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
                abort(response()->json(['errors' => ['file' => ['The import file must be a valid CSV.']]], 422));
            }
        }
    }

    /**
     * Store the uploaded file securely.
     * Generates a random name and saves it outside the public folder (using private storage).
     *
     * @param string $disk The disk to store the file to (e.g. S3, local, private).
     * @return string The safe path of the stored file.
     */
    public function storeSecurely(string $disk = 'local'): string
    {
        $file = $this->file('file');
        $type = $this->input('type');

        // 1. Generate a cryptographically secure random filename to prevent execution spoofing
        $extension = $file->getClientOriginalExtension();
        $safeName = Str::random(40) . '.' . $extension;

        // 2. Define safe folder hierarchy
        $folder = 'uploads/' . $type;

        // 3. Store file securely (defaults to local storage, which is outside the public/ directory)
        return $file->storeAs($folder, $safeName, $disk);
    }
}
