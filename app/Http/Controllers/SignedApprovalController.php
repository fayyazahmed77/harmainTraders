<?php

namespace App\Http\Controllers;

use App\Services\AccessRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SignedApprovalController extends Controller
{
    /**
     * The access request service instance.
     *
     * @var AccessRequestService
     */
    protected $service;

    /**
     * Create a new controller instance.
     *
     * @param AccessRequestService $service
     */
    public function __construct(AccessRequestService $service)
    {
        $this->service = $service;
    }

    /**
     * Handles signed single-click approval routing.
     *
     * @param Request $request
     * @param string $requestId
     * @return \Illuminate\Http\Response|\Illuminate\View\View
     */
    public function approve(Request $request, string $requestId)
    {
        // 1. Enforce strict link expiration checks
        if (!$request->hasValidSignature()) {
            abort(401, 'Unauthorized or Expired approval signature.');
        }

        // 2. Prevent Replay Attacks
        $cacheKey = 'signed_action:' . md5($request->fullUrl());
        if (Cache::has($cacheKey)) {
            return response()->view('errors.action-replayed', [
                'message' => 'This access request has already been processed.'
            ], 409);
        }

        $actorId = $request->query('actor_id');

        // 3. Perform execution
        $this->service->approveRequest($requestId, $actorId);

        // 4. Lock signed action in Cache to block replay attempts (7 days TTL)
        Cache::put($cacheKey, true, now()->addDays(7));

        return response()->view('actions.approval-success', [
            'id' => $requestId,
            'action' => 'Approved',
        ]);
    }

    /**
     * Show the signed rejection form.
     *
     * @param Request $request
     * @param string $requestId
     * @return \Illuminate\Http\Response|\Illuminate\View\View
     */
    public function showRejectForm(Request $request, string $requestId)
    {
        // 1. Enforce strict signature verification
        if (!$request->hasValidSignature()) {
            abort(401, 'Unauthorized or Expired approval signature.');
        }

        // 2. Check for replay attempts
        $cacheKey = 'signed_action:' . md5($request->fullUrl());
        if (Cache::has($cacheKey)) {
            return response()->view('errors.action-replayed', [
                'message' => 'This access request has already been processed.'
            ], 409);
        }

        return response()->view('actions.reject-form', [
            'id' => $requestId,
            'actionUrl' => $request->fullUrl(),
        ]);
    }

    /**
     * Handle the signed rejection submission.
     *
     * @param Request $request
     * @param string $requestId
     * @return \Illuminate\Http\Response|\Illuminate\View\View
     */
    public function reject(Request $request, string $requestId)
    {
        // 1. Enforce signature validation
        if (!$request->hasValidSignature()) {
            abort(401, 'Unauthorized or Expired approval signature.');
        }

        // 2. Prevent Replay Attacks
        $cacheKey = 'signed_action:' . md5($request->fullUrl());
        if (Cache::has($cacheKey)) {
            return response()->view('errors.action-replayed', [
                'message' => 'This access request has already been processed.'
            ], 409);
        }

        $validated = $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        $actorId = $request->query('actor_id');

        // 3. Perform execution
        $this->service->rejectRequest($requestId, $validated['reason'], $actorId);

        // 4. Lock signature to prevent replay
        Cache::put($cacheKey, true, now()->addDays(7));

        return response()->view('actions.approval-success', [
            'id' => $requestId,
            'action' => 'Rejected',
        ]);
    }
}
