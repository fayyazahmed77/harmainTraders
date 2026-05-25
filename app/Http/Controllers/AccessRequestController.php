<?php

namespace App\Http\Controllers;

use App\Models\AccessRequest;
use App\Services\AccessRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class AccessRequestController extends Controller
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
     * Submit a new authorization access request.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        // Enforce rate limiting or other logic at route level, validate inputs here
        $validated = $request->validate([
            'resource_type' => 'required|string|max:100',
            'action_type'   => 'required|string|max:50',
            'justification' => 'required|string|min:10',
        ]);

        Gate::authorize('create', AccessRequest::class);

        $accessRequest = $this->service->createRequest($validated, $request->user());

        return response()->json([
            'message' => 'Access request submitted successfully.',
            'request' => $accessRequest,
        ], 201);
    }

    /**
     * Fetch all pending access requests.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexPending(Request $request)
    {
        Gate::authorize('viewAny', AccessRequest::class);

        $pending = AccessRequest::pending()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($pending);
    }

    /**
     * Approve a request manually.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function approve(Request $request, string $id)
    {
        $accessRequest = AccessRequest::findOrFail($id);

        Gate::authorize('approve', $accessRequest);

        $this->service->approveRequest($id, $request->user()->id);

        return response()->json([
            'message' => 'Access request approved successfully.',
        ]);
    }

    /**
     * Reject a request manually.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, string $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        $accessRequest = AccessRequest::findOrFail($id);

        Gate::authorize('reject', $accessRequest);

        $this->service->rejectRequest($id, $validated['reason'], $request->user()->id);

        return response()->json([
            'message' => 'Access request rejected successfully.',
        ]);
    }

    /**
     * Request more information from the submitter.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function requestMoreInfo(Request $request, string $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|min:5',
        ]);

        $accessRequest = AccessRequest::findOrFail($id);

        Gate::authorize('requestMoreInfo', $accessRequest);

        $this->service->requestMoreInfo($id, $validated['notes'], $request->user()->id);

        return response()->json([
            'message' => 'Clarification notes requested successfully.',
        ]);
    }

    /**
     * Render the Admin Access Requests Dashboard.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function adminIndex(Request $request)
    {
        Gate::authorize('viewAny', AccessRequest::class);

        $requests = AccessRequest::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        $mappedRequests = $requests->map(fn($req) => [
            'id'           => $req->id,
            'userId'       => $req->user_id,
            'userName'     => $req->user->name ?? 'Unknown User',
            'userEmail'    => $req->user->email ?? 'Unknown Email',
            'resourceType' => $req->resource_type,
            'actionType'   => $req->action_type,
            'justification'=> $req->justification,
            'status'       => $req->status,
            'ipAddress'    => $req->ip_address,
            'userAgent'    => $req->user_agent,
            'createdAt'    => $req->created_at->toDateTimeString(),
            'slaDue'       => $req->sla_due_at?->toDateTimeString(),
        ]);

        return Inertia::render('admin/access-requests/Index', [
            'requests' => $mappedRequests,
        ]);
    }
}
