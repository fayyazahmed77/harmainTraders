<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Province;
use App\Models\City;
use App\Models\Areas;
use App\Models\Subarea;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class LocationController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view cities|view areas|manage permissions|manage roles', only: ['index', 'children', 'search', 'stats']),
            new Middleware('permission:edit cities|edit areas|manage permissions|manage roles', only: ['store', 'update']),
            new Middleware('permission:delete cities|delete areas|manage permissions|manage roles', only: ['destroy']),
        ];
    }

    public function index(Request $request)
    {
        $countries = Country::withCount('provinces')
            ->orderBy('name')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->name,
                    'code' => $c->code,
                    'phone_code' => $c->phone_code,
                    'currency' => $c->currency,
                    'is_active' => (bool) $c->is_active,
                    'provinces_count' => $c->provinces_count ?? 0,
                    'created_at' => $c->created_at?->format('Y-m-d'),
                ];
            });

        $stats = $this->getStatsArray();

        return Inertia::render('Locations/index', [
            'countries' => $countries,
            'stats' => $stats,
        ]);
    }

    public function children(Request $request)
    {
        $type = strtolower($request->query('type', ''));
        $id = $request->query('id');

        if (!$type || !$id) {
            return response()->json([], 400);
        }

        switch ($type) {
            case 'country':
                $items = Province::where('country_id', $id)
                    ->withCount('cities')
                    ->orderBy('name')
                    ->get()
                    ->map(fn($p) => [
                        'id' => $p->id,
                        'country_id' => $p->country_id,
                        'name' => $p->name,
                        'code' => $p->code,
                        'is_active' => (bool) $p->is_active,
                        'cities_count' => $p->cities_count ?? 0,
                        'latitude' => $p->latitude,
                        'longitude' => $p->longitude,
                    ]);
                break;

            case 'state':
            case 'province':
                $items = City::where('province_id', $id)
                    ->withCount('areas')
                    ->orderBy('name')
                    ->get()
                    ->map(fn($c) => [
                        'id' => $c->id,
                        'country_id' => $c->country_id,
                        'province_id' => $c->province_id,
                        'name' => $c->name,
                        'code' => $c->code,
                        'is_active' => (bool) $c->is_active,
                        'areas_count' => $c->areas_count ?? 0,
                        'latitude' => $c->latitude,
                        'longitude' => $c->longitude,
                    ]);
                break;

            case 'city':
                $items = Areas::where('city_id', $id)
                    ->withCount('subareas')
                    ->orderBy('name')
                    ->get()
                    ->map(fn($a) => [
                        'id' => $a->id,
                        'country_id' => $a->country_id,
                        'province_id' => $a->province_id,
                        'city_id' => $a->city_id,
                        'name' => $a->name,
                        'status' => $a->status ?? 'active',
                        'is_active' => ($a->status ?? 'active') === 'active',
                        'subareas_count' => $a->subareas_count ?? 0,
                        'latitude' => $a->latitude,
                        'longitude' => $a->longitude,
                    ]);
                break;

            case 'area':
                $items = Subarea::where('area_id', $id)
                    ->orderBy('name')
                    ->get()
                    ->map(fn($sa) => [
                        'id' => $sa->id,
                        'country_id' => $sa->country_id,
                        'province_id' => $sa->province_id,
                        'city_id' => $sa->city_id,
                        'area_id' => $sa->area_id,
                        'name' => $sa->name,
                        'status' => $sa->status ?? 'active',
                        'is_active' => ($sa->status ?? 'active') === 'active',
                        'latitude' => $sa->latitude,
                        'longitude' => $sa->longitude,
                    ]);
                break;

            default:
                $items = [];
                break;
        }

        return response()->json($items);
    }

    public function search(Request $request)
    {
        $q = trim($request->query('q', ''));
        if (strlen($q) < 2) {
            return response()->json([]);
        }

        $results = collect();

        // 1. Search Countries
        $countries = Country::where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->take(5)
            ->get();
        foreach ($countries as $c) {
            $results->push([
                'type' => 'country',
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'is_active' => (bool) $c->is_active,
                'path' => [$c->name],
                'path_ids' => ['country' => $c->id],
            ]);
        }

        // 2. Search States / Provinces
        $provinces = Province::with('country')
            ->where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->take(5)
            ->get();
        foreach ($provinces as $p) {
            $results->push([
                'type' => 'state',
                'id' => $p->id,
                'name' => $p->name,
                'code' => $p->code,
                'is_active' => (bool) $p->is_active,
                'path' => array_filter([$p->country?->name, $p->name]),
                'path_ids' => [
                    'country' => $p->country_id,
                    'state' => $p->id,
                ],
            ]);
        }

        // 3. Search Cities
        $cities = City::with(['country', 'province'])
            ->where('name', 'like', "%{$q}%")
            ->orWhere('code', 'like', "%{$q}%")
            ->take(5)
            ->get();
        foreach ($cities as $c) {
            $results->push([
                'type' => 'city',
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'is_active' => (bool) $c->is_active,
                'path' => array_filter([$c->country?->name, $c->province?->name, $c->name]),
                'path_ids' => [
                    'country' => $c->country_id,
                    'state' => $c->province_id,
                    'city' => $c->id,
                ],
            ]);
        }

        // 4. Search Areas
        $areas = Areas::with(['country', 'province', 'city'])
            ->where('name', 'like', "%{$q}%")
            ->take(5)
            ->get();
        foreach ($areas as $a) {
            $results->push([
                'type' => 'area',
                'id' => $a->id,
                'name' => $a->name,
                'code' => null,
                'is_active' => ($a->status ?? 'active') === 'active',
                'path' => array_filter([$a->country?->name, $a->province?->name, $a->city?->name, $a->name]),
                'path_ids' => [
                    'country' => $a->country_id,
                    'state' => $a->province_id,
                    'city' => $a->city_id,
                    'area' => $a->id,
                ],
            ]);
        }

        // 5. Search Subareas
        $subareas = Subarea::with(['country', 'province', 'city', 'area'])
            ->where('name', 'like', "%{$q}%")
            ->take(5)
            ->get();
        foreach ($subareas as $sa) {
            $results->push([
                'type' => 'subarea',
                'id' => $sa->id,
                'name' => $sa->name,
                'code' => null,
                'is_active' => ($sa->status ?? 'active') === 'active',
                'path' => array_filter([$sa->country?->name, $sa->province?->name, $sa->city?->name, $sa->area?->name, $sa->name]),
                'path_ids' => [
                    'country' => $sa->country_id,
                    'state' => $sa->province_id,
                    'city' => $sa->city_id,
                    'area' => $sa->area_id,
                    'subarea' => $sa->id,
                ],
            ]);
        }

        return response()->json($results);
    }

    public function stats()
    {
        return response()->json($this->getStatsArray());
    }

    public function store(Request $request)
    {
        $locationType = strtolower($request->input('location_type', ''));

        switch ($locationType) {
            case 'country':
                $validated = $request->validate([
                    'name' => 'required|string|max:255|unique:countries,name',
                    'code' => 'nullable|string|max:10',
                    'phone_code' => 'nullable|string|max:10',
                    'currency' => 'nullable|string|max:10',
                    'is_active' => 'boolean',
                ]);
                $validated['created_by'] = Auth::id();
                $item = Country::create($validated);
                break;

            case 'state':
            case 'province':
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'name' => 'required|string|max:255',
                    'code' => 'nullable|string|max:10',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'is_active' => 'boolean',
                ]);
                $validated['created_by'] = Auth::id();
                $item = Province::create($validated);
                break;

            case 'city':
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'name' => 'required|string|max:255',
                    'code' => 'nullable|string|max:10',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'is_active' => 'boolean',
                ]);
                $validated['created_by'] = Auth::id();
                $item = City::create($validated);
                break;

            case 'area':
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'city_id' => 'required|exists:cities,id',
                    'name' => 'required|string|max:255',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'status' => 'nullable|string',
                ]);
                $validated['created_by'] = Auth::id();
                $validated['status'] = $request->input('status', 'active');
                $item = Areas::create($validated);
                break;

            case 'subarea':
            case 'sub_area':
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'city_id' => 'required|exists:cities,id',
                    'area_id' => 'required|exists:areas,id',
                    'name' => 'required|string|max:255',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'status' => 'nullable|string',
                ]);
                $validated['created_by'] = Auth::id();
                $validated['status'] = $request->input('status', 'active');
                $item = Subarea::create($validated);
                break;

            default:
                return redirect()->back()->with('error', 'Invalid location type specified.');
        }

        return redirect()->back()->with('success', ucfirst($locationType) . ' created successfully.');
    }

    public function update(Request $request, $type, $id)
    {
        $type = strtolower($type);

        switch ($type) {
            case 'country':
                $c = Country::findOrFail($id);
                $validated = $request->validate([
                    'name' => 'required|string|max:255|unique:countries,name,' . $id,
                    'code' => 'nullable|string|max:10',
                    'phone_code' => 'nullable|string|max:10',
                    'currency' => 'nullable|string|max:10',
                    'is_active' => 'boolean',
                ]);
                $c->update($validated);
                break;

            case 'state':
            case 'province':
                $p = Province::findOrFail($id);
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'name' => 'required|string|max:255',
                    'code' => 'nullable|string|max:10',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'is_active' => 'boolean',
                ]);
                $p->update($validated);
                break;

            case 'city':
                $city = City::findOrFail($id);
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'name' => 'required|string|max:255',
                    'code' => 'nullable|string|max:10',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'is_active' => 'boolean',
                ]);
                $city->update($validated);
                break;

            case 'area':
                $area = Areas::findOrFail($id);
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'city_id' => 'required|exists:cities,id',
                    'name' => 'required|string|max:255',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'status' => 'nullable|string',
                ]);
                if ($request->has('is_active')) {
                    $validated['status'] = $request->is_active ? 'active' : 'inactive';
                }
                $area->update($validated);
                break;

            case 'subarea':
            case 'sub_area':
                $subarea = Subarea::findOrFail($id);
                $validated = $request->validate([
                    'country_id' => 'required|exists:countries,id',
                    'province_id' => 'required|exists:provinces,id',
                    'city_id' => 'required|exists:cities,id',
                    'area_id' => 'required|exists:areas,id',
                    'name' => 'required|string|max:255',
                    'latitude' => 'nullable|numeric',
                    'longitude' => 'nullable|numeric',
                    'status' => 'nullable|string',
                ]);
                if ($request->has('is_active')) {
                    $validated['status'] = $request->is_active ? 'active' : 'inactive';
                }
                $subarea->update($validated);
                break;

            default:
                return redirect()->back()->with('error', 'Invalid location type.');
        }

        return redirect()->back()->with('success', ucfirst($type) . ' updated successfully.');
    }

    public function destroy(Request $request, $type, $id)
    {
        $type = strtolower($type);

        switch ($type) {
            case 'country':
                $hasChildren = Province::where('country_id', $id)->exists();
                if ($hasChildren) {
                    return redirect()->back()->with('error', 'Cannot delete Country. It contains child States/Provinces. Please deactivate it instead.');
                }
                Country::destroy($id);
                break;

            case 'state':
            case 'province':
                $hasChildren = City::where('province_id', $id)->exists();
                if ($hasChildren) {
                    return redirect()->back()->with('error', 'Cannot delete State. It contains child Cities. Please deactivate it instead.');
                }
                Province::destroy($id);
                break;

            case 'city':
                $hasChildren = Areas::where('city_id', $id)->exists() || Account::where('city_id', $id)->exists();
                if ($hasChildren) {
                    return redirect()->back()->with('error', 'Cannot delete City. It contains active Areas or dependent Account records.');
                }
                City::destroy($id);
                break;

            case 'area':
                $hasChildren = Subarea::where('area_id', $id)->exists() || Account::where('area_id', $id)->exists();
                if ($hasChildren) {
                    return redirect()->back()->with('error', 'Cannot delete Area. It contains child Sub-areas or dependent Account records.');
                }
                Areas::destroy($id);
                break;

            case 'subarea':
            case 'sub_area':
                $hasChildren = Account::where('subarea_id', $id)->exists();
                if ($hasChildren) {
                    return redirect()->back()->with('error', 'Cannot delete Sub-area. It is referenced in dependent Account records.');
                }
                Subarea::destroy($id);
                break;

            default:
                return redirect()->back()->with('error', 'Invalid location type.');
        }

        return redirect()->back()->with('success', ucfirst($type) . ' deleted successfully.');
    }

    private function getStatsArray(): array
    {
        return [
            'countries' => Country::count(),
            'states' => Province::count(),
            'cities' => City::count(),
            'areas' => Areas::count(),
            'subareas' => Subarea::count(),
        ];
    }
}
