<?php

namespace App\Http\Controllers;

use App\Models\AccountType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class AccountTypeController extends Controller
{
    //index
    public function index()
    {
        $accountTypes = AccountType::with(['creator']) // if you have a `creator()` relation
            ->latest()
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'name' => $account->name,
                    'description' => $account->description,
                    'created_at' => $account->created_at->toIso8601String(),
                    'created_by_name' => $account->creator?->name ?? 'Unknown',
                ];
            });
            
        return Inertia::render("setup/accounttype/index", [
            'accountTypes' => $accountTypes
        ]);
    }
    //store
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'description' => 'nullable|string|max:255',
        ]);
        $validated['created_by'] = Auth::id();
        AccountType::create($validated);

        // ✅ Redirect back with success message
        return redirect()->route('account-types.index')
            ->with('success', 'Account Type created successfully!');
    }
    //update
    public function update(Request $request, AccountType $accountType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:account_types,name,' . $accountType->id,
            'description' => 'nullable|string|max:255',
        ]);
        $accountType->update($validated);

        // ✅ Redirect back with success message
        return redirect()->route('account-types.index')
            ->with('success', 'Account Type updated successfully!');
    }
    //destroy
    public function destroy(AccountType $accountType)
    {
        $accountType->delete();

        // ✅ Redirect back with success message
        return redirect()->route('account-types.index')
            ->with('success', 'Account Type deleted successfully!');
    }
}
