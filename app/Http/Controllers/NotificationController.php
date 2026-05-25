<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    /**
     * Render the Notification Center frontend page.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function renderCenter(Request $request)
    {
        return Inertia::render('notifications/Index');
    }

    /**
     * Retrieve paginated notification items with optional search/filters.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = $request->user()->notifications();

        // Filter by category
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $query->where('category', $request->input('category'));
        }

        // Filter by priority
        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', $request->input('priority'));
        }

        // Filter by text search (data->title or data->message)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('data->title', 'like', "%{$search}%")
                  ->orWhere('data->message', 'like', "%{$search}%");
            });
        }

        // Paginate results (15 items per page)
        $notifications = $query->orderBy('created_at', 'desc')->paginate(15);

        // Map results to match frontend expectations
        $mapped = collect($notifications->items())->map(fn($n) => [
            'id'        => $n->id,
            'title'     => $n->data['title'] ?? 'Notification',
            'message'   => $n->data['message'] ?? '',
            'category'  => $n->category,
            'priority'  => $n->priority,
            'read'      => !is_null($n->read_at),
            'actionUrl' => $n->data['action_url'] ?? null,
            'createdAt' => $n->created_at->diffForHumans(),
        ]);

        return response()->json([
            'data'     => $mapped,
            'nextPage' => $notifications->hasMorePages() ? $notifications->currentPage() + 1 : null,
        ]);
    }

    /**
     * Mark a specific notification as read.
     *
     * @param Request $request
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all notifications for the authenticated user as read.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function markAllAsRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read.',
        ]);
    }
}
