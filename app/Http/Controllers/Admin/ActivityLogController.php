<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->orderBy('created_at', 'desc');

        if ($request->module) {
            $query->where('module', $request->module);
        }

        if ($request->action) {
            $query->where('action', $request->action);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->paginate(30)->withQueryString();

        return Inertia::render('admin/activity-log/index', [
            'logs' => $logs,
            'filters' => $request->only(['module', 'action', 'user_id']),
            'modules' => ActivityLog::distinct()->pluck('module'),
            'actions' => ActivityLog::distinct()->pluck('action'),
        ]);
    }
}
