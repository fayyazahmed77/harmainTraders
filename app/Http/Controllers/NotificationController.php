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
        $user = $request->user();
        $query = $user->notifications();

        // Filter by unread status
        if ($request->boolean('unread') || $request->input('unread') === 'true') {
            $query->whereNull('read_at');
        }

        // Filter by category (supports both snake_case and legacy Title Case values)
        if ($request->filled('category') && $request->input('category') !== 'all') {
            $catInput = strtolower(trim($request->input('category')));
            $catVariants = match ($catInput) {
                'online_orders', 'online orders' => ['online_orders', 'Online Orders'],
                'customers', 'customer'          => ['customers', 'Customers'],
                'workflow'                       => ['workflow', 'Workflow'],
                'security'                       => ['security', 'Security'],
                'general', 'system'              => ['general', 'General', 'system', 'System'],
                default                          => [$request->input('category')],
            };
            $query->whereIn('category', $catVariants);
        }

        // Filter by priority
        if ($request->filled('priority') && $request->input('priority') !== 'all') {
            $query->where('priority', $request->input('priority'));
        }

        // Filter by text search (title, message, order_no, customer_name)
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('data->title', 'like', "%{$search}%")
                  ->orWhere('data->message', 'like', "%{$search}%")
                  ->orWhere('data->order_no', 'like', "%{$search}%")
                  ->orWhere('data->customer_name', 'like', "%{$search}%")
                  ->orWhere('data->name', 'like', "%{$search}%");
            });
        }

        // Paginate results (15 items per page)
        $notifications = $query->orderBy('created_at', 'desc')->paginate(15);

        // Map results to match frontend expectations (including smart fallback titles for legacy records)
        $mapped = collect($notifications->items())->map(function ($n) {
            $rawCat = strtolower(trim($n->category ?? $n->data['category'] ?? 'general'));
            $normalizedCategory = match ($rawCat) {
                'online orders', 'online_orders' => 'online_orders',
                'customers', 'customer'          => 'customers',
                'workflow'                       => 'workflow',
                'security'                       => 'security',
                default                          => 'general',
            };

            $title = $n->data['title'] ?? null;
            if (!$title) {
                if (!empty($n->data['order_no'])) {
                    $title = "New Wholesale Order #{$n->data['order_no']}";
                } elseif ($normalizedCategory === 'customers') {
                    $title = "New Customer Registration" . (!empty($n->data['name']) ? ": {$n->data['name']}" : '');
                } else {
                    $title = 'System Notification';
                }
            }

            return [
                'id'            => $n->id,
                'title'         => $title,
                'message'       => $n->data['message'] ?? '',
                'category'      => $normalizedCategory,
                'priority'      => $n->priority ?? $n->data['priority'] ?? 'medium',
                'read'          => !is_null($n->read_at),
                'actionUrl'     => $n->data['action_url'] ?? $n->data['actionUrl'] ?? $n->data['url'] ?? $n->data['link'] ?? null,
                'order_no'      => $n->data['order_no'] ?? null,
                'final_total'   => isset($n->data['final_total']) ? (float) $n->data['final_total'] : null,
                'customer_name' => $n->data['customer_name'] ?? $n->data['name'] ?? null,
                'createdAt'     => $n->created_at ? $n->created_at->diffForHumans() : 'Just now',
            ];
        });

        $baseQuery = $user->notifications();
        $unreadCount = (clone $baseQuery)->whereNull('read_at')->count();
        $onlineOrdersCount = (clone $baseQuery)->whereIn('category', ['online_orders', 'Online Orders'])->count();
        $customersCount = (clone $baseQuery)->whereIn('category', ['customers', 'Customers'])->count();
        $highPriorityUnreadCount = (clone $baseQuery)->whereNull('read_at')->whereIn('priority', ['high', 'critical'])->count();

        return response()->json([
            'data'        => $mapped,
            'nextPage'    => $notifications->hasMorePages() ? $notifications->currentPage() + 1 : null,
            'unreadCount' => $unreadCount,
            'summary'     => [
                'total'                => (clone $baseQuery)->count(),
                'unread'               => $unreadCount,
                'online_orders'        => $onlineOrdersCount,
                'customers'            => $customersCount,
                'high_priority_unread' => $highPriorityUnreadCount,
            ],
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
        $notification = $request->user()->notifications()->where('id', $id)->first();
        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marked as read.',
            'unreadCount' => $request->user()->unreadNotifications()->count(),
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
            'unreadCount' => 0,
        ]);
    }
}
