<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait HasUuid
{
    /**
     * Boot the HasUuid trait to automatically generate a UUID during model creation.
     */
    protected static function bootHasUuid(): void
    {
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Str::orderedUuid();
            }
        });
    }

    /**
     * Disable auto-incrementing ID.
     */
    public function getIncrementing(): bool
    {
        return false;
    }

    /**
     * Set the primary key type to string.
     */
    public function getKeyType(): string
    {
        return 'string';
    }
}
