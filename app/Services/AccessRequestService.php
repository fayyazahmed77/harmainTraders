<?php

namespace App\Services;

use App\Models\AccessRequest;
use App\Models\AccessRequestHistory;
use App\Models\User;
use App\Events\AccessRequestCreated;
use App\Events\AccessRequestStatusChanged;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class AccessRequestService
{
    /**
     * Submit a new resource access authorization request.
     *
     * @param array $data Input properties (resource_type, action_type, justification)
     * @param User $requester The user submitting the request
     * @return AccessRequest
     */
    public function createRequest(array $data, User $requester): AccessRequest
    {
        return DB::transaction(function () use ($data, $requester) {
            /** @var \Illuminate\Http\Request $httpRequest */
            $httpRequest = app('request');

            $ipAddress = $httpRequest->ip() ?? '127.0.0.1';
            $userAgent = $httpRequest->userAgent() ?? 'System';

            // Calculate SLA due date (default to 24 hours SLA resolution limit)
            $slaDueAt = now()->addHours(24);

            // Extract additional geographic/browser metadata context safely
            $metadata = [
                'device_type' => $httpRequest->header('Sec-Ch-Ua-Mobile') === '?1' ? 'mobile' : 'desktop',
                'referer' => $httpRequest->header('Referer'),
                'locale' => $httpRequest->getPreferredLanguage() ?? 'en',
            ];

            // 1. Create the access request draft record
            $request = AccessRequest::create([
                'user_id' => $requester->id,
                'resource_type' => $data['resource_type'],
                'action_type' => $data['action_type'],
                'justification' => $data['justification'],
                'status' => 'pending',
                'current_step' => 1,
                'sla_due_at' => $slaDueAt,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'metadata' => $metadata,
            ]);

            // 2. Dispatch the standard event to trigger async queue processing
            event(new AccessRequestCreated($request));

            return $request;
        });
    }

    /**
     * Approve a pending access request.
     *
     * @param string $requestId The UUID of the access request
     * @param int|null $actorId The ID of the administrator executing the approval
     * @return bool
     */
    public function approveRequest(string $requestId, ?int $actorId): bool
    {
        return $this->transitionStatus($requestId, 'approved', null, $actorId);
    }

    /**
     * Reject a pending access request.
     *
     * @param string $requestId The UUID of the access request
     * @param string $reason The reason for rejecting
     * @param int|null $actorId The ID of the administrator executing the rejection
     * @return bool
     */
    public function rejectRequest(string $requestId, string $reason, ?int $actorId): bool
    {
        return $this->transitionStatus($requestId, 'rejected', $reason, $actorId);
    }

    /**
     * Request more information from the submitter.
     *
     * @param string $requestId The UUID of the access request
     * @param string $notes Clarification details required from the submitter
     * @param int|null $actorId The ID of the administrator executing the state change
     * @return bool
     */
    public function requestMoreInfo(string $requestId, string $notes, ?int $actorId): bool
    {
        return $this->transitionStatus($requestId, 'more_info_requested', $notes, $actorId);
    }

    /**
     * Transition workflow state and create cryptographic signatures.
     *
     * @param string $requestId The UUID of the access request
     * @param string $targetStatus Target state enum value
     * @param string|null $notes Audit/Justification notes accompanying the change
     * @param int|null $actorId Administrator user ID performing the change
     * @return bool
     * @throws InvalidArgumentException
     */
    protected function transitionStatus(
        string $requestId,
        string $targetStatus,
        ?string $notes,
        ?int $actorId
    ): bool {
        return DB::transaction(function () use ($requestId, $targetStatus, $notes, $actorId) {
            $request = AccessRequest::findOrFail($requestId);
            $previousStatus = $request->status;

            // Enforce safe transition guidelines
            $this->validateStateTransition($previousStatus, $targetStatus);

            $ipAddress = request()->ip() ?? '127.0.0.1';
            $userAgent = request()->userAgent() ?? 'System';
            $nextStep = $request->current_step + 1;

            // 1. Update the request status and workflow step
            $request->update([
                'status' => $targetStatus,
                'current_step' => $nextStep,
            ]);

            // 2. Generate a secure signature of the transition data
            $payload = json_encode([
                'access_request_id' => $requestId,
                'actor_id' => $actorId,
                'previous_status' => $previousStatus,
                'new_status' => $targetStatus,
                'step_number' => $nextStep,
                'action_notes' => $notes,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

            $signature = hash_hmac('sha256', $payload, config('app.key'));

            // 3. Create the immutable workflow history record
            AccessRequestHistory::create([
                'access_request_id' => $requestId,
                'actor_id' => $actorId,
                'previous_status' => $previousStatus,
                'new_status' => $targetStatus,
                'step_number' => $nextStep,
                'action_notes' => $notes,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'signature' => $signature,
            ]);

            // 4. Log the state difference directly inside the tamper-resistant ComplianceAuditService
            $actor = $actorId ? User::find($actorId) : null;
            app(ComplianceAuditService::class)->log(
                'access_request.' . $targetStatus,
                $request,
                ['status' => $previousStatus, 'step' => $request->current_step - 1],
                ['status' => $targetStatus, 'step' => $nextStep],
                $actor
            );

            // 5. Dispatch status changed event to trigger notifications
            event(new AccessRequestStatusChanged($request, $previousStatus));

            return true;
        });
    }

    /**
     * Enforce strict, valid state-machine workflow state transitions.
     */
    protected function validateStateTransition(string $current, string $target): void
    {
        $allowedTransitions = [
            'pending' => ['approved', 'rejected', 'more_info_requested'],
            'more_info_requested' => ['pending', 'rejected', 'approved'],
            'approved' => [], // Terminal state
            'rejected' => [], // Terminal state
        ];

        if (!isset($allowedTransitions[$current]) || !in_array($target, $allowedTransitions[$current])) {
            throw new InvalidArgumentException(
                "Invalid workflow transition: cannot transition access request from '{$current}' to '{$target}'."
            );
        }
    }
}