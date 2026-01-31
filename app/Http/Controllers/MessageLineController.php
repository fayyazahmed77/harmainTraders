<?php

namespace App\Http\Controllers;

use App\Models\MessageLine;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class MessageLineController extends Controller
{
    //index
    public function index()
    {
      
        $messagesline  = MessageLine::with(['creator'])
            ->latest()
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

        ]);
    }
    /**
     * Store a newly created message line.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'messageline' => 'required|string|max:255',
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
