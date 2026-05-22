<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Http\Requests\StoreShiftRequest;
use App\Http\Requests\UpdateShiftRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ShiftController extends Controller
{
    /**
     * Display a listing of the shifts.
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Shift::class);

        $query = Shift::withCount(['users']);

        if ($request->boolean('show_archived')) {
            $query->withTrashed();
        }

        $shifts = $query->latest()->get();

        return Inertia::render('admin/Shifts/Index', [
            'shifts' => $shifts,
            'filters' => [
                'show_archived' => $request->boolean('show_archived'),
            ]
        ]);
    }

    /**
     * Store a newly created shift in storage.
     */
    public function store(StoreShiftRequest $request)
    {
        Gate::authorize('create', Shift::class);

        Shift::create($request->validated());

        return redirect()->route('shifts.index')->with('success', 'Shift created successfully.');
    }

    /**
     * Update the specified shift in storage.
     */
    public function update(UpdateShiftRequest $request, Shift $shift)
    {
        Gate::authorize('update', $shift);

        $shift->update($request->validated());

        return redirect()->route('shifts.index')->with('success', 'Shift updated successfully.');
    }

    /**
     * Remove the specified shift from storage (soft delete).
     */
    public function destroy(Shift $shift)
    {
        Gate::authorize('delete', $shift);

        $assignedUserCount = $shift->users()->count();

        // Perform soft delete
        $shift->delete();

        if ($assignedUserCount > 0) {
            return redirect()->route('shifts.index')->with('warning', $assignedUserCount . ' users assigned — shift archived.');
        }

        return redirect()->route('shifts.index')->with('success', 'Shift archived successfully.');
    }
}
