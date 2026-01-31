<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Roles;
use Spatie\Permission\Models\Permission;
use App\Models\PermissionCat;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function Index()
    {
        
        $permissionCats = DB::table('permission_cats')
            ->join('permissions', 'permission_cats.id', '=', 'permissions.cat')
            ->select(
                'permission_cats.id as category_id',
                'permission_cats.name as category_name',
                'permission_cats.icon as icon',
                'permissions.id as permission_id',
                'permissions.name as permission_name'
            )
            ->get()
            ->groupBy('category_id')
            ->map(function ($group) {
                return [
                    'label' => $group[0]->category_name,
                    'icon' => $group[0]->icon,
                    'actions' => $group->map(function ($item) {
                        return [
                            'id' => $item->permission_id,
                            'name' => $item->permission_name,
                        ];
                    })->values(),
                ];
            })
            ->values();
        // dd($permissionCats);
        return Inertia::render('Role/Roles', [
            'permissionCategories' => $permissionCats,
        ]);
    }
    public function store(Request $request)
    {

        $validated = $request->validate([
            'roleName' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        // Check if validation passes and debug
          // dd($validated);
        DB::beginTransaction();

        try {
            // Create role
            $role = Role::create([
                'name' => $request->roleName,
                'guard_name' => 'web', // default for web guard
            ]);

            // Sync permissions
            if ($request->has('permissions')) {
                $role->syncPermissions($request->permissions);
            }

            DB::commit();

            return redirect()->route('roles.index')->with('success', 'Role created and permissions assigned successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()->route('roles.index')->with('error', 'Error creating role: ' . $e->getMessage());
        }
    }
    public function list()
    {
        $roles = Role::withCount('permissions')->get();

        return Inertia::render('Role/Index', [
            'roles' => $roles,
        ]);
    }
    public function edit(Role $role)
    {
        $permissionCategories = Permission::all()
        ->groupBy('cat')
        ->map(function ($permissions, $categoryId) {
            // Assuming you have a Category model with 'name' field
            $categoryName = PermissionCat::find($categoryId)->name; // Replace `Category` with your actual model if needed
    
            return [
                'label' => $categoryName,  // Now the label will contain the category name
                'icon' => $permissions->first()->icon ?? 'ShieldCheck',
                'actions' => $permissions->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                ])->values(),
            ];
        })->values();
    
        $rolePermissions = $role->permissions->pluck('id')->toArray();
      
        return Inertia::render('Role/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $rolePermissions,
            ],
            'permissionCategories' => $permissionCategories,
        ]);
    }
    public function update(Request $request, $id)
    {
        $request->validate([
            'roleName' => 'required|string|max:255',
            'permissions' => 'array',
        ]);

        $role = Role::findOrFail($id);
        $role->name = $request->roleName;
        $role->guard_name = 'web'; // if not already set
        $role->save();

        // Sync permissions
        $role->syncPermissions($request->permissions ?? []);

        return redirect()->route('roles.index')->with('success', 'Role updated successfully!');
    }
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete(); // This also removes assigned permissions automatically
        return redirect()->route('roles.index')->with('success', 'Role deleted successfully!');
    }
}
