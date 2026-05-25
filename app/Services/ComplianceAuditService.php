<?php

namespace App\Services;

use App\Models\AuditLedger;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ComplianceAuditService
{
    /**
     * Write an immutable compliance entry into the cryptographic ledger.
     * Each entry is chained with the SHA-256 HMAC of the preceding entry.
     *
     * @param string $action The action description, e.g., 'access_request.submitted'
     * @param Model $auditable The target Eloquent entity being logged
     * @param array|null $oldState The previous attributes state (optional)
     * @param array|null $newState The new/current attributes state (optional)
     * @param User|null $actor The active user performing the action (null = system)
     */
    public function log(
        string $action,
        Model $auditable,
        ?array $oldState,
        ?array $newState,
        ?User $actor = null
    ): void {
        // Fetch the last chronological audit entry via ordered-UUID sort (deterministic sub-second ordering)
        $lastLog = AuditLedger::orderBy('id', 'desc')->first();
        $previousHash = $lastLog ? $lastLog->checksum : str_repeat('0', 64);

        $ipAddress = request()->ip() ?? '127.0.0.1';
        $userAgent = request()->userAgent() ?? 'System';

        // Deterministically serialize the payload for consistent hashing
        $payload = json_encode([
            'action' => $action,
            'auditable_type' => get_class($auditable),
            'auditable_id' => (string) $auditable->getKey(),
            'old_state' => $oldState,
            'new_state' => $newState,
            'user_id' => $actor?->id,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'previous_hash' => $previousHash,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // Generate the signature using the application key as the secure salt
        $checksum = hash_hmac('sha256', $payload, config('app.key'));

        // Save the immutable audit ledger log entry
        AuditLedger::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'auditable_type' => get_class($auditable),
            'auditable_id' => (string) $auditable->getKey(),
            'old_state' => $oldState,
            'new_state' => $newState,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'checksum' => $checksum,
        ]);
    }
}
