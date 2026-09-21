<?php

namespace App\Http\Controllers;

use App\Models\City;
use App\Models\Country;
use App\Models\Province;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class CityController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view cities', only: ['index', 'show']),
            new Middleware('permission:edit cities', only: ['create', 'store', 'edit', 'update']),
            new Middleware('permission:delete cities', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $countries = Country::all();
        $provinces = Province::all();

        $query = City::with(['creator', 'province', 'country']);

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('province', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  })
                  ->orWhereHas('country', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('country_id') && $request->country_id !== 'ALL') {
            $query->where('country_id', $request->country_id);
        }

        if ($request->filled('province_id') && $request->province_id !== 'ALL') {
            $query->where('province_id', $request->province_id);
        }

        if ($request->filled('is_active') && $request->is_active !== 'ALL') {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        $allCities = City::all();
        $summary = [
            'total_cities' => $allCities->count(),
            'active_cities' => $allCities->where('is_active', true)->count(),
            'provinces_count' => $allCities->pluck('province_id')->unique()->filter()->count(),
            'countries_count' => $allCities->pluck('country_id')->unique()->filter()->count(),
            'mapped_coordinates_count' => $allCities->filter(fn($c) => !empty($c->latitude) && !empty($c->longitude))->count(),
        ];

        $cities = $query->latest()
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
            'provinces' => $provinces,
            'filters' => $request->only(['search', 'country_id', 'province_id', 'is_active']),
            'summary' => $summary,
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
