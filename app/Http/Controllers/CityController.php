<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CityController extends Controller
{
    public function index()
    {
        $countries = Country::all();
        $provinces = Province::all();
        $cities  = City::with(['creator', 'province', 'country'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : null;
                return $item;
            });
        return Inertia::render('Cities/index', [
            'cities' => $cities,
            'countries' => $countries,
            'provinces' => $provinces
        ]);
    }
    //store
    public function store(Request $request)
    {
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:cities,code',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);
        $validated['created_by'] = Auth::id();
        City::create($validated);
        return redirect()->route('cities.index')->with('success', 'City created successfully.');
    }
    //update
    public function update(Request $request, City $city)
    {

        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'province_id' => 'required|exists:provinces,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:cities,code,' . $city->id,
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);
        $city->update($validated);
        return redirect()->route('cities.index')->with('success', 'City updated successfully.');
    }
    //destroy
    public function destroy(City $city)
    {
        $city->delete();
        return redirect()->route('cities.index')->with('success', 'City deleted successfully.');
    }
}
