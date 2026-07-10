<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use App\Models\Areas;
use App\Models\Subarea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class SubareaController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view areas', only: ['index', 'show']),
            new Middleware('permission:edit areas', only: ['create', 'store', 'edit', 'update']),
            new Middleware('permission:delete areas', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas = Areas::all();

        $query = Subarea::with(['creator', 'province', 'country', 'city', 'area']);

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('country_id')) {
            $query->where('country_id', $request->country_id);
        }
        if ($request->filled('province_id')) {
            $query->where('province_id', $request->province_id);
        }
        if ($request->filled('city_id')) {
            $query->where('city_id', $request->city_id);
        }
        if ($request->filled('area_id')) {
            $query->where('area_id', $request->area_id);
        }

        $subareas = $query->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : null;
                return $item;
            });

        return Inertia::render("setup/subarea/index", [
            'subareas' => $subareas,
            'areas' => $areas,
            'cities' => $cities,
            'countries' => $countries,
            'provinces' => $provinces,
            'filters' => $request->only(['search', 'country_id', 'province_id', 'city_id', 'area_id'])
        ]);
    }
    public function store(Request $request)
    {
        // ✅ Validate
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        // ✅ Add created_by
        $validated['created_by'] = Auth::id();

        // ✅ Save record
        Subarea::create($validated);

        return back()->with('success', 'Subarea created successfully!');
    }
    public function update(Request $request, Subarea $subarea)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'city_id' => 'required|exists:cities,id',
            'area_id' => 'required|exists:areas,id',
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $subarea->update($validated);

        return back()->with('success', 'Subarea updated successfully!');
    }

    public function destroy(Subarea $subarea)
    {
        $subarea->delete();
        return back()->with('success', 'Subarea deleted successfully!');
    }
}
