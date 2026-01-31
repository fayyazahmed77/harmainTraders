<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff.
     */
    public function index()
    {
        $staff = User::with('roles')->get();

        return Inertia::render('Staff/Index', [
            'staff' => $staff,
        ]);
    }

    /**
     * Show the form for creating a new staff member.
     */
    public function create()
    {
        $roles = Role::all();
        return Inertia::render('Staff/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created staff member in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8|confirmed',
            'roles' => 'array',
        ]);

        DB::beginTransaction();
        try {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'country' => $request->country,
                'status' => $request->status ? 'active' : 'inactive',
                'job_title' => $request->job_title,
                'department' => $request->department,
                'bio' => $request->bio,
                'linkedin_url' => $request->linkedin_url,
                'facebook_url' => $request->facebook_url,
                'instagram_url' => $request->instagram_url,
                'twitter_url' => $request->twitter_url,
                'portfolio_url' => $request->portfolio_url,
            ]);

            if ($request->has('roles')) {
                $user->syncRoles($request->roles);
            }

            // Image handling (if provided)
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('staff/profiles', 'public');
                $user->update(['image' => $path]);
            }

            DB::commit();
            return redirect()->route('staff.index')->with('success', 'Staff member created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to create staff member: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified staff member.
     */
    public function show($id)
    {
        $user = User::with('roles')->findOrFail($id);
        return Inertia::render('Staff/Show', [
            'user' => $user,
        ]);
    }

    /**
     * Show the form for editing the specified staff member.
     */
    public function edit($id)
    {
        $user = User::with('roles')->findOrFail($id);
        $roles = Role::all();
        $userRoles = $user->roles->pluck('name')->toArray();

        return Inertia::render('Staff/Edit', [
            'user' => $user,
            'roles' => $roles,
            'userRoles' => $userRoles,
        ]);
    }

    /**
     * Update the specified staff member in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8|confirmed',
            'roles' => 'array',
        ]);

        DB::beginTransaction();
        try {
            $data = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'country' => $request->country,
                'status' => $request->status ? 'active' : 'inactive',
                'job_title' => $request->job_title,
                'department' => $request->department,
                'bio' => $request->bio,
                'linkedin_url' => $request->linkedin_url,
                'facebook_url' => $request->facebook_url,
                'instagram_url' => $request->instagram_url,
                'twitter_url' => $request->twitter_url,
                'portfolio_url' => $request->portfolio_url,
            ];

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $user->update($data);

            if ($request->has('roles')) {
                $user->syncRoles($request->roles);
            }

            // Image handling
            if ($request->hasFile('image')) {
                $path = $request->file('image')->store('staff/profiles', 'public');
                $user->update(['image' => $path]);
            }

            DB::commit();
            return redirect()->route('staff.index')->with('success', 'Staff member updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Failed to update staff member: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified staff member from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return redirect()->route('staff.index')->with('success', 'Staff member deleted successfully.');
    }
}
