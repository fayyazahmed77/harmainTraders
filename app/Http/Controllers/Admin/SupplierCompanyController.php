<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupplierCompanyController extends Controller
{
    public function index()
    {
        $suppliers = Account::where('type', 6) // Supplier
            ->with(['assignedCompanies' => function($query) {
                $query->withCount('items');
            }])
            ->orderBy('title')
            ->get();

        $allCompanies = Account::where('type', 5) // Company
            ->withCount('items')
            ->orderBy('title')
            ->get();

        return Inertia::render('admin/supplier-companies/index', [
            'suppliers' => $suppliers,
            'allCompanies' => $allCompanies,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:accounts,id',
            'company_ids' => 'required|array',
            'company_ids.*' => 'exists:accounts,id',
        ]);

        $supplier = Account::findOrFail($request->supplier_id);
        $supplier->assignedCompanies()->sync($request->company_ids);

        return back()->with('success', 'Companies assigned successfully.');
    }

    public function destroy($supplierId, $companyId)
    {
        $supplier = Account::findOrFail($supplierId);
        $supplier->assignedCompanies()->detach($companyId);

        return back()->with('success', 'Company removed successfully.');
    }
}
