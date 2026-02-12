<?php

namespace App\Http\Controllers;

use App\Models\Booker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BookerController extends Controller
{
    public function index()
    {
        $bookers = Booker::with('creator')
            ->orderBy('name', 'asc')
            ->paginate(100)
            ->through(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'shortname' => $item->shortname,
                    'code' => $item->code,
                    'status' => $item->status,
                    'date' => $item->date,
                    'defult' => $item->defult,
                    'created_at' => $item->created_at->format('d M Y'),
                    'created_by' => $item->created_by,
                    'created_by_name' => $item->creator?->name ?? 'Unknown',
                    'created_by_avatar' => $item->creator?->image
                        ? asset('storage/' . $item->creator->image)
                        : asset('images/avatar-placeholder.png'),
                ];
            });

        return inertia('setup/booker/index', [
            'bookers' => $bookers,
        ]);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'shortname' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:bookers,code',
            'date' => 'required|date',
            'status' => 'nullable|boolean',
            'defult' => 'nullable|boolean',
        ]);

        $booker = Booker::create([
            'name' => $request->name,
            'shortname' => $request->shortname,
            'code' => $request->code,
            'date' => $request->date,
            'status' => $request->status ? 1 : 0,
            'defult' => $request->defult ? 1 : 0,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Booker created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Booker $booker)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'shortname' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:bookers,code,' . $booker->id,
            'date' => 'required|date',
            'status' => 'nullable|boolean',
            'defult' => 'nullable|boolean',
        ]);

        $booker->update([
            'name' => $request->name,
            'shortname' => $request->shortname,
            'code' => $request->code,
            'date' => $request->date,
            'status' => $request->status ? 1 : 0,
            'defult' => $request->defult ? 1 : 0,
        ]);

        return redirect()->back()->with('success', 'Booker updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Booker $booker)
    {
        $booker->delete();
        return redirect()->back()->with('success', 'Booker deleted successfully.');
    }
}
