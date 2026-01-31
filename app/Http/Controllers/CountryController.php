<?php

namespace App\Http\Controllers;

use App\Models\Country;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CountryController extends Controller
{
    //index 
    public function index()
    {
        $countries = Country::with('creator')
            ->orderBy('name', 'asc') // ✅ order by name (A → Z)
            ->paginate(100)
            ->through(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code,
                    'phone_code' => $item->phone_code,
                    'currency' => $item->currency,
                    'is_active' => $item->is_active,
                    'created_at' => $item->created_at,
                    'created_by' => $item->created_by,
                    'created_by_name' => $item->creator?->name ?? 'Unknown',
                    'created_by_avatar' => $item->creator?->image
                        ? asset('storage/' . $item->creator->image)
                        : null,
                ];
            });

        return Inertia::render('Country/index', [
            'countries' => $countries->toArray(),
        ]);
    }

    //store
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:countries,code',
            'phone_code' => 'nullable|string|max:10',
            'currency' => 'nullable|string|max:50',
            'flag_url' => 'nullable|url|max:255',
            'is_active' => 'boolean',
        ]);
        $validated['created_by'] = Auth::id();
        Country::create($validated);
        return redirect()->route('countries.index')->with('success', 'Country created successfully.');
    }
    //update
    public function update(Request $request, Country $country)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:countries,code,' . $country->id,
            'phone_code' => 'nullable|string|max:10',
            'currency' => 'nullable|string|max:50',
        ]);

        $country->update($validated);

        return back()->with('success', 'Country updated successfully.');
    }

    //destroy
    public function destroy(Country $country)
    {
        // Check if the country is used in any related table
        $isUsed =
           
            \App\Models\Province::where('country_id', $country->id)->exists() ||
            \App\Models\City::where('country_id', $country->id)->exists();
           

        if ($isUsed) {
            return redirect()
                ->route('countries.index')
                ->with('error', 'This country cannot be deleted because it is referenced in other records.');
        }

        // Safe to delete
        $country->delete();

        return redirect()
            ->route('countries.index')
            ->with('success', 'Country deleted successfully.');
    }
}
