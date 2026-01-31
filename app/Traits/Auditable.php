<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::logAudit('created', $model);
        });

        static::updated(function ($model) {
            self::logAudit('updated', $model);
        });

        static::deleted(function ($model) {
            self::logAudit('deleted', $model);
        });
    }

    protected static function logAudit($action, $model)
    {
        $oldValues = null;
        $newValues = null;

        if ($action === 'updated') {
            $oldValues = $model->getOriginal();
            $newValues = $model->getChanges();
        } elseif ($action === 'created') {
            $newValues = $model->getAttributes();
        } elseif ($action === 'deleted') {
            $oldValues = $model->getAttributes();
        }

        AuditLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'module' => class_basename($model),
            'module_id' => $model->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
