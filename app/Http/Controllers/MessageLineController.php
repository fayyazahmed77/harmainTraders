<?php

namespace App\Http\Controllers;

use App\Models\MessageLine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MessageLineController extends Controller
{
    public function index(Request $request)
    {
        $query = MessageLine::with(['creator']);

        if ($request->has('search') && $request->search) {
            $query->where('messageline', 'like', '%' . $request->search . '%');
        }

        if ($request->has('category') && $request->category && $request->category !== 'all') {
            $query->where('category', $request->category);
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
            'category' => 'nullable|string|in:Sales,Purchase,Receipt,Payments,Offer List',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';
        $validated['created_by'] = Auth::id();

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
            'category' => 'nullable|string|in:Sales,Purchase,Receipt,Payments,Offer List',
            'status' => 'nullable|in:active,inactive',
        ]);

        $messageLine->update($validated);
        return back()->with('success', 'Message line updated successfully');
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
