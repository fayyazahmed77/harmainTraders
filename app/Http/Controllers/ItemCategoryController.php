<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\ItemCategory;
use Inertia\Inertia;

class ItemCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ItemCategory::with('creator');

        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $categories = $query->latest()->get()->map(function ($category) {
            $category->created_by_name = $category->creator ? $category->creator->name : 'Unknown';
            $category->created_by_avatar = $category->creator && $category->creator->image ? asset('storage/' . $category->creator->image) : null;
            return $category;
        });

        return Inertia::render('ItemCategory/index', [
            'categories' => $categories,
            'filters' => $request->only(['search'])
        ]);
    }
    //store
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'code' => 'nullable|unique:item_categories,code',
            'description' => 'nullable',
            'status' => 'nullable',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $image_name = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $image_name = time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images'), $image_name);
        }

        $userId = Auth::user()->id;
        
        $code = $request->code;
        if (!$code) {
            $code = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $request->name));
            // Ensure unique code if name-based code is taken
            if (ItemCategory::where('code', $code)->exists()) {
                $code .= '-' . time();
            }
        }

        ItemCategory::create([
            'name' => $request->name,
            'code' => strtoupper($code),
            'description' => $request->description ?? '',
            'status' => $request->status ?? 'active',
            'image' => $image_name,
            'created_by' => $userId,
        ]);
        return redirect()->back()->with('success', 'Category created successfully');
    }
    //update
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required',
            'code' => 'nullable|unique:item_categories,code,' . $id,
            'description' => 'nullable',
            'status' => 'nullable',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
        $userId = Auth::user()->id;
        $data = [
            'name' => $request->name,
            'code' => strtoupper($request->code ?? ''),
            'description' => $request->description ?? '',
            'status' => $request->status ?? 'active',
            'updated_by' => $userId,
        ];

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $image_name = time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images'), $image_name);
            $data['image'] = $image_name;
        }

        ItemCategory::where('id', $id)->update($data);
        return redirect()->back()->with('success', 'Category updated successfully');
    }
    //delete
    public function destroy($id)
    {
        ItemCategory::destroy($id);
        return redirect()->back()->with('success', 'Category deleted successfully');
    }
}
