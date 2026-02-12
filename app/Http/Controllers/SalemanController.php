<?php

namespace App\Http\Controllers;

use App\Models\Saleman;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SalemanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $salemen = Saleman::with('creator')
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

        return inertia('setup/saleman/index', [
            'salemen' => $salemen,
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
            'code' => 'required|string|max:50|unique:salemen,code',
            'date' => 'required|date',
            'status' => 'nullable|boolean',
            'defult' => 'nullable|boolean',
        ]);

        $saleman = Saleman::create([
            'name' => $request->name,
            'shortname' => $request->shortname,
            'code' => $request->code,
            'date' => $request->date,
            'status' => $request->status ? 1 : 0,
            'defult' => $request->defult ? 1 : 0,
            'created_by' => Auth::id(),
        ]);

        return redirect()->back()->with('success', 'Saleman created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Saleman $saleman)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'shortname' => 'required|string|max:100',
            'code' => 'required|string|max:50|unique:salemen,code,' . $saleman->id,
            'date' => 'required|date',
            'status' => 'nullable|boolean',
            'defult' => 'nullable|boolean',
        ]);

        $saleman->update([
            'name' => $request->name,
            'shortname' => $request->shortname,
            'code' => $request->code,
            'date' => $request->date,
            'status' => $request->status ? 1 : 0,
            'defult' => $request->defult ? 1 : 0,
        ]);

        return redirect()->back()->with('success', 'Saleman updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Saleman $saleman)
    {
        $saleman->delete();
        return redirect()->back()->with('success', 'Saleman deleted successfully.');
    }

    public function getNextCode()
    {
        $latest = Saleman::latest('id')->first();
        if (!$latest) {
            return response()->json(['code' => '001']);
        }

        $code = (int)$latest->code + 1;
        return response()->json(['code' => str_pad($code, 3, '0', STR_PAD_LEFT)]);
    }
}
