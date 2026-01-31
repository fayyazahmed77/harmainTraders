<?php
namespace App\Http\Controllers;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\PermissionCat;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


class PermissionController extends Controller
{
    public function index()
    {
        $permissions = Permission::select(
            'permissions.id', 
            'permissions.cat', 
            'permission_cats.icon', 
            'permission_cats.name as catname', 
            'permissions.name', 
            'permissions.guard_name', 
            'permissions.created_at', 
            'users.name as created_by_name' // Add the user's name here
        )
        ->join('permission_cats', 'permissions.cat', '=', 'permission_cats.id')
        ->leftJoin('users', 'permissions.created_by', '=', 'users.id') // Join the users table
        ->get();
    
        $category = PermissionCat::select('id', 'name','icon')->get();
        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
            'categories' => $category,
        ]);
    }


    public function store(Request $request)
    {
        $request->validate([
            'cat' => 'required|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        Permission::create([
            'cat' => $request->cat,
            'name' => $request->name,
            'guard_name' => 'web',
            'created_by' => Auth::id(), 
        ]);

        return redirect()->route('permissions.index')->with('success', 'Permission created successfully!');

    }

    public function update(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);

        $request->validate([
            'cat' => 'required|string|max:255,cat,' . $id,
            'name' => 'required|string|max:255,name,' . $id,
        ]);

        $permission->update([
            'cat' => $request->cat,
            'name' => $request->name,
        ]);

        return redirect()->route('permissions.index')->with('success', 'Permission updated!');
    }

    public function destroy($id)
    {
        Permission::findOrFail($id)->delete();

        return redirect()->route('permissions.index')->with('success', 'Permission deleted!');
    }
}
