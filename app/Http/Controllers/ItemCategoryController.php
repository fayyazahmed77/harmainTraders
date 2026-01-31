<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ItemCategory;
use Inertia\Inertia;
class ItemCategoryController extends Controller
{
    public function index()
    {
        $categories = ItemCategory::all();
        return Inertia::render('ItemCategory/index', [
            'categories' => $categories,
        ]);
    }
    //store
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'description' => 'required',
            'status' => 'required',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        $image = $request->file('image');
        $image_name = time() . '.' . $image->getClientOriginalExtension();
        $image->move(public_path('images'), $image_name);
        $userId = Auth::user()->id;
        ItemCategory::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
            'image' => $image_name,
            'created_by' =>$userId,
        ]);
        return redirect()->back()->with('success', 'Category created successfully');
        
    }
    //update
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required',
            'description' => 'required',
            'status' => 'required',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        $image = $request->file('image');
        $image_name = time() . '.' . $image->getClientOriginalExtension();
        $image->move(public_path('images'), $image_name);
         $userId = Auth::user()->id;
        ItemCategory::where('id', $id)->update([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
            'image' => $image_name,
            'updated_by' =>$userId,
        ]);
        return redirect()->back()->with('success', 'Category updated successfully');
        
    }
    //delete
    public function destroy($id)
    {
        ItemCategory::destroy($id);
        return redirect()->back()->with('success', 'Category deleted successfully');
    }
}
