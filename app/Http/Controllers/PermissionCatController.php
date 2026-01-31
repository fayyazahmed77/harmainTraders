<?php

namespace App\Http\Controllers;
use App\Models\PermissionCat;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionCatController extends Controller
{
    public function index()
    {
        $permissions = PermissionCat::select('id', 'name','icon')->get();
        return Inertia::render('Permissions/category/Index', [
            'permissions' => $permissions
        ]);
    }


    public function store(Request $request)
    {
      
        $request->validate([
            
            'icon' => 'required|string|max:255',
            'name' => 'required|string|max:255',
        ]);

        PermissionCat::create([
          
            'icon' => $request->icon,
            'name' => $request->name,
           
        ]);

        return redirect()->route('category.index')->with('success', 'Permission created successfully!');

    }

  
    public function update(Request $request, $id)
    {
        $permission = PermissionCat::findOrFail($id);

        $request->validate([
           
            'icon' => 'required|string|max:255,icon,' . $id,
            'name' => 'required|string|max:255,name,' . $id,
        ]);

        $permission->update([
         
            'icon' => $request->icon,
            'name' => $request->name,
        ]);

        return redirect()->route('category.index')->with('success', 'Permission updated!');
    }

    public function destroy($id)
    {
        PermissionCat::findOrFail($id)->delete();

        return redirect()->route('category.index')->with('success', 'Permission deleted!');
    }
}
