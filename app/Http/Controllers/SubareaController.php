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

class SubareaController extends Controller
{
    public function index()
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas = Areas::all();
        $subareas  = Subarea::with(['creator', 'province', 'country', 'city', 'area'])
            ->latest()
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
            'provinces' => $provinces
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
