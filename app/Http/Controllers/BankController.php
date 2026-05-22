<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Bank;

use Illuminate\Http\Request;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class BankController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view banks', only: ['index', 'show']),
            new Middleware('permission:manage banks', only: ['create', 'store', 'edit', 'update', 'destroy']),
        ];
    }
    //index
    public function index()
    {

        $banks = Bank::with('creator')
            ->latest()
            ->get()
            ->map(function ($item) {
                // ✅ Creator info
                $item->created_by_name = $item->creator?->name ?? 'Unknown';
                $item->created_by_avatar = $item->creator?->image
                    ? asset('storage/' . $item->creator->image)
                    : asset('images/default-avatar.png');

                // ✅ Bank logo (public path)
                $item->logo_url = $item->logo
                    ? asset('storage/' . $item->logo)
                    : asset('images/default-bank.png');

                return $item;
            });
        return Inertia::render("setup/banks/index", [
            'banks' => $banks,

        ]);
    }
    public function create()
    {
        return Inertia::render("setup/banks/create");
    }
    // 🧩 Store new bank
    public function store(Request $request)
    {
        // ✅ 1. Validate input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'account_name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:255',
            'branch' => 'nullable|string|max:255',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'website' => 'nullable|string|max:255',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,svg|max:2048',
        ]);

        // ✅ 2. Handle file upload
        if ($request->hasFile('logo')) {
            $file = $request->file('logo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $validated['logo'] = $file->storeAs('logos', $filename, 'public');
        }

        // ✅ 3. Add creator
        $validated['created_by'] = Auth::id();

        // ✅ 4. Save record
        Bank::create($validated);

        // ✅ 5. Redirect with success message
        return redirect()
            ->route('banks.index')
            ->with('success', '✅ Bank created successfully!');
    }
}
