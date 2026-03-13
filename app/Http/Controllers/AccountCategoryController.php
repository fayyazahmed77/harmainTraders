<?php

namespace App\Http\Controllers;

use App\Models\AccountCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountCategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $categories = AccountCategory::latest()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->get();

        return Inertia::render('setup/account-category/index', [
            'categories' => $categories,
            'filters' => $request->only(['search'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        AccountCategory::create($validated);

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function update(Request $request, AccountCategory $accountCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'percentage' => 'required|numeric|min:0|max:100',
        ]);

        $accountCategory->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function destroy(AccountCategory $accountCategory)
    {
        $accountCategory->delete();
        return redirect()->back()->with('success', 'Category deleted successfully');
    }
}
