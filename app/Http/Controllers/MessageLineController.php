<?php

namespace App\Http\Controllers;

use App\Models\MessageLine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class MessageLineController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:manage firms'),
        ];
    }
    public function index(Request $request)
    {
        $query = MessageLine::with(['creator']);

        if ($request->has('search') && $request->search) {
            $query->where('messageline', 'like', '%' . $request->search . '%');
        }

        if ($request->has('category') && $request->category && $request->category !== 'all') {
            $query->whereJsonContains('category', $request->category);
        }

        $messagesline = $query->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : null;
                return $item;
            });

        return Inertia::render("setup/messageline/index", [
            'messagesline' => $messagesline,
            'filters' => $request->all(['search', 'category']),
        ]);
    }
    /**
     * Store a newly created message line.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'messageline' => 'required|string|max:255',
            'category' => 'nullable|array',
            'category.*' => 'string|in:Sales,Purchase,Receipt,Payments,Offer List',
            'status' => 'nullable|in:active,inactive',
            'is_default' => 'nullable|boolean',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';
        $validated['is_default'] = $validated['is_default'] ?? false;
        $validated['created_by'] = Auth::id();

        if ($validated['is_default']) {
            MessageLine::query()->update(['is_default' => false]);
        }

        MessageLine::create($validated);

        return back()->with('success', 'Message line created successfully');
    }

    /**
     * Update the specified message line.
     */
    public function update(Request $request, MessageLine $messageLine)
    {
        $validated = $request->validate([
            'messageline' => 'required|string|max:255',
            'category' => 'nullable|array',
            'category.*' => 'string|in:Sales,Purchase,Receipt,Payments,Offer List',
            'status' => 'nullable|in:active,inactive',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            MessageLine::where('id', '!=', $messageLine->id)->update(['is_default' => false]);
        }

        $messageLine->update($validated);
        return back()->with('success', 'Message line updated successfully');
    }

    /**
     * Toggle default status of specified message line.
     */
    public function toggleDefault($id)
    {
        $messageLine = MessageLine::findOrFail($id);
        $newStatus = !$messageLine->is_default;

        if ($newStatus) {
            MessageLine::where('id', '!=', $id)->update(['is_default' => false]);
        }

        $messageLine->is_default = $newStatus;
        $messageLine->save();

        return back()->with('success', 'Default message line updated successfully.');
    }

    /**
     * Toggle the status of the specified message line.
     */
    public function toggleStatus($id)
    {
        $messageLine = MessageLine::findOrFail($id);
        $messageLine->status = ($messageLine->status === 'active') ? 'inactive' : 'active';
        $messageLine->save();

        return back()->with('success', 'Message line status updated successfully.');
    }

    /**
     * Remove the specified message line.
     */
    public function destroy($id)
    {
        $messageLine = MessageLine::findOrFail($id);
        $messageLine->delete();
        return back()->with('success', 'Message line deleted successfully');
    }
}
