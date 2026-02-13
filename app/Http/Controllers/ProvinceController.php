<?php

namespace App\Http\Controllers;

use App\Models\Province;
use App\Models\Country;
use App\Models\City;
use App\Models\Areas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProvinceController extends Controller
{
    public function index()
    {
        $countries = Country::all();
        $provinces  = Province::with('creator')
            ->latest()
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
            'countries' => $countries
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
