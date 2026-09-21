<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\Country;
use App\Models\City;
use App\Models\Areas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class ProvinceController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view areas', only: ['index', 'show', 'getByCountry', 'getByProvince']),
            new Middleware('permission:edit areas', only: ['create', 'store', 'edit', 'update']),
            new Middleware('permission:delete areas', only: ['destroy']),
        ];
    }
    public function index(Request $request)
    {
        $countries = Country::all();

        $query = Province::with(['creator', 'country'])->withCount('cities');

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhereHas('country', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('country_id') && $request->country_id !== 'ALL') {
            $query->where('country_id', $request->country_id);
        }

        if ($request->filled('is_active') && $request->is_active !== 'ALL') {
            $isActive = filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        $allProvinces = Province::withCount('cities')->get();
        $summary = [
            'total_provinces' => $allProvinces->count(),
            'active_provinces' => $allProvinces->where('is_active', true)->count(),
            'total_cities_count' => $allProvinces->sum('cities_count'),
            'countries_count' => $allProvinces->pluck('country_id')->unique()->filter()->count(),
            'mapped_coordinates_count' => $allProvinces->filter(fn($p) => !empty($p->latitude) && !empty($p->longitude))->count(),
        ];

        $provinces = $query->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : null;
                return $item;
            });

        return Inertia::render('Provinces/index', [
            'provinces' => $provinces,
            'countries' => $countries,
            'filters' => $request->only(['search', 'country_id', 'is_active']),
            'summary' => $summary,
        ]);
    }
    public function getByCountry($countryId)
    {
        $provinces = Province::where('country_id', $countryId)
            ->select('id', 'name', 'code')
            ->get();

        return response()->json($provinces);
    }
    public function getByProvince($id)
    {
        return City::where('province_id', $id)->select('id', 'name', 'code')->get();
    }

    //store
    public function store(Request $request)
    {


        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);
        $validated['created_by'] = Auth::id();
        Province::create($validated);

        return redirect()->route('provinces.index')->with('success', 'Province created successfully.');
    }
    //update
    public function update(Request $request, Province $province)
    {
        // ✅ Validate all required fields
        $validated = $request->validate([
            'country_id' => 'required|exists:countries,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:provinces,code,' . $province->id,
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        try {
            // ✅ Update province data
            $province->update($validated);

            return redirect()
                ->route('provinces.index')
                ->with('success', 'Province updated successfully.');
        } catch (\Exception $e) {
            // ✅ Catch unexpected errors (DB or others)
            return redirect()
                ->route('provinces.index')
                ->with('error', 'Failed to update province. ' . $e->getMessage());
        }
    }

    //destroy
    public function destroy(Province $province)
    {
        $isUsed =

            \App\Models\City::where('province_id', $province->id)->exists();

        if ($isUsed) {
            return redirect()
                ->route('provinces.index')
                ->with('error', 'This Province cannot be deleted because it is referenced in other records.');
        }
        $province->delete();
        return redirect()->route('provinces.index')->with('success', 'Province deleted successfully.');
    }
}
