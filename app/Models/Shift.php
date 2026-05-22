<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'break_duration_minutes',
        'overtime_limit_minutes',
        'color',
        'is_active',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'break_duration_minutes' => 'integer',
            'overtime_limit_minutes' => 'integer',
        ];
    }

    /**
     * Get the users assigned to this shift.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }
}
