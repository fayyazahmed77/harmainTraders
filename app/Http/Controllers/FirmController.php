<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Firm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

use Illuminate\Support\Facades\Storage;

class FirmController extends Controller
{
    // ✅ List all firms
    public function index()
    {
        $firms = Firm::with(['creator'])
            ->latest()
            ->get()
            ->map(function ($item) {
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : asset('images/default-avatar.png');
                return $item;
            });

        return Inertia::render("setup/firm/index", [
            'firms' => $firms,
        ]);
    }

    // ✅ Show create form
    public function create()
    {
        return Inertia::render('setup/firm/create');
    }

    // ✅ Store new firm
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'code'         => 'required|string|max:50|unique:firms,code',
            'date'         => 'nullable|string',
            'business'     => 'nullable|string|max:255',
            'address1'     => 'nullable|string|max:255',
            'address2'     => 'nullable|string|max:255',
            'address3'     => 'nullable|string|max:255',
            'phone'        => 'nullable|string|max:50',
            'fax'          => 'nullable|string|max:50',
            'owner'        => 'nullable|string|max:255',
            'email'        => 'nullable|email|max:255',
            'website'      => 'nullable|string|max:255',
            'saletax'      => 'nullable|string|max:100',
            'ntn'          => 'nullable|string|max:100',
            'printinvoice' => 'nullable|boolean',
            'defult'       => 'nullable|boolean',
            'status'       => 'nullable|boolean',
            'logo'         => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        // ✅ Convert readable date to Y-m-d
        if (!empty($validated['date'])) {
            try {
                $validated['date'] = Carbon::parse($validated['date'])->format('Y-m-d');
            } catch (\Exception $e) {
                $validated['date'] = null;
            }
        }

        // ✅ Convert checkboxes to 1 or 0
        $validated['printinvoice'] = $request->boolean('printinvoice');
        $validated['defult']       = $request->boolean('defult');
        $validated['status']       = $request->boolean('status');

        // ✅ Add created_by user
        $validated['created_by'] = Auth::id();

        // ✅ Handle Logo Upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $validated['logo'] = $path;
        }

        // ✅ Save Firm
        Firm::create($validated);

        return redirect()
            ->route('firms.index')
            ->with('success', 'Firm created successfully.');
    }

    // ✅ Edit firm
    public function edit($id)
    {
        $firm = Firm::findOrFail($id);
        return Inertia::render('setup/firm/edit', [
            'firm' => $firm,
        ]);
    }
    // ✅ Edit firm
    public function show($id)
    {
        $firm = Firm::findOrFail($id);
        return Inertia::render('setup/firm/show', [
            'firm' => $firm,
        ]);
    }

    // ✅ Update firm
    public function update(Request $request, $id)
    {
        $firm = Firm::findOrFail($id);

        $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'required|string|max:50|unique:firms,code,' . $firm->id,
            'date'        => 'nullable|date',
            'business'    => 'nullable|string|max:255',
            'address1'    => 'nullable|string|max:255',
            'address2'    => 'nullable|string|max:255',
            'address3'    => 'nullable|string|max:255',
            'phone'       => 'nullable|string|max:50',
            'fax'         => 'nullable|string|max:50',
            'owner'       => 'nullable|string|max:255',
            'email'       => 'nullable|email|max:255',
            'website'     => 'nullable|string|max:255',
            'saletax'     => 'nullable|string|max:100',
            'ntn'         => 'nullable|string|max:100',
            'printinvoice' => 'nullable|boolean',
            'defult'      => 'nullable|boolean',
            'status'      => 'nullable|boolean',
            'logo'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $data = $request->except(['logo', '_method']);

        // ✅ Convert readable date to Y-m-d
        if (!empty($data['date'])) {
            try {
                $data['date'] = Carbon::parse($data['date'])->format('Y-m-d');
            } catch (\Exception $e) {
                $data['date'] = null;
            }
        }

        // ✅ Convert checkboxes to 1 or 0
        $data['printinvoice'] = $request->boolean('printinvoice');
        $data['defult']       = $request->boolean('defult');
        $data['status']       = $request->boolean('status');

        // ✅ Handle Logo Update
        if ($request->hasFile('logo')) {
            // Delete old logo
            if ($firm->logo) {
                Storage::disk('public')->delete($firm->logo);
            }
            $path = $request->file('logo')->store('logos', 'public');
            $data['logo'] = $path;
        }

        $firm->update($data);

        return redirect()->route('firms.index')->with('success', 'Firm updated successfully.');
    }

    // ✅ Delete firm
    public function destroy($id)
    {
        $firm = Firm::findOrFail($id);

        // ✅ Delete logo if exists
        if ($firm->logo) {
            Storage::disk('public')->delete($firm->logo);
        }

        $firm->delete();

        return redirect()->route('firms.index')->with('success', 'Firm deleted successfully.');
    }
}
