<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalLog extends Model
{
    public $timestamps = false; // Using performed_at in migration
    protected $table = 'approval_logs';

    protected $fillable = [
        'request_id',
        'action',
        'performed_by',
        'performed_at',
        'previous_status',
        'new_status',
        'note'
    ];

    protected $casts = [
        'performed_at' => 'datetime',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(FinancialRequest::class, 'request_id');
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
