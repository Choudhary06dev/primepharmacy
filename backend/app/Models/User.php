<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, HasRoles, BelongsToTenant;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'pharmacy_id',
        'branch_id',
        'name',
        'email',
        'username',
        'password',
        'phone',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->username) && !empty($user->email)) {
                $emailPrefix = explode('@', $user->email)[0];
                $username = strtolower(preg_replace('/[^a-zA-Z0-9_.]/', '', $emailPrefix));
                if (empty($username)) {
                    $username = 'user_' . \Illuminate\Support\Str::lower(\Illuminate\Support\Str::random(5));
                }

                $original = $username;
                $counter = 1;
                while (static::where('username', $username)->exists()) {
                    $username = $original . $counter;
                    $counter++;
                }
                $user->username = $username;
            }
        });
    }

    /**
     * Get the branch that the user is assigned to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Resolve route binding bypassing TenantScope for Super Admins.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if (auth()->check() && auth()->user()->pharmacy_id === null) {
            return $this->where($field ?? $this->getRouteKeyName(), $value)
                ->withoutGlobalScope(\App\Scopes\TenantScope::class)
                ->firstOrFail();
        }

        return parent::resolveRouteBinding($value, $field);
    }
}
