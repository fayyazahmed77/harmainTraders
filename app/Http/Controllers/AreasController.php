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

class AreasController extends Controller
{
    //index
    public function index()
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities = City::all();
        $areas  = Areas::with(['creator', 'province', 'country', 'city'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : null;
                return $item;
            });
        return Inertia::render("setup/area/index", [
            'areas' => $areas,
            'cities' => $cities,
            'countries' => $countries,
            'provinces' => $provinces
        ]);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'city_id' => 'required|exists:cities,id',
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $validated['created_by'] = Auth::id();

        Areas::create($validated);

        return back()->with('success', 'Area created successfully!');
    }
    public function getByCity($cityId)
    {
        try {
            $areas = Areas::where('city_id', $cityId)->get(['id', 'name']);
            return response()->json($areas);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    public function getByArea($areaId)
    {
        try {
            $subareas = Subarea::where('area_id', $areaId)->get(['id', 'name']);
            return response()->json($subareas);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Areas $area)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'city_id' => 'required|exists:cities,id',
            'name' => 'required|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $area->update($validated);

        return back()->with('success', 'Area updated successfully!');
    }

    public function destroy(Areas $area)
    {
        $area->delete();
        return back()->with('success', 'Area deleted successfully!');
    }
}
