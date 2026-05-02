<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Artisan;

class EmailSettingsController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/email', [
            'settings' => SiteSetting::get(),
        ]);
    }

    public function update(Request $request)
    {
        $settings = SiteSetting::get();
        
        $validated = $request->validate([
            'company_name' => 'required|string',
            'contact_email' => 'nullable|email',
            'contact_phone' => 'nullable|string',
            'address' => 'nullable|string',
            'facebook_url' => 'nullable|url',
            'twitter_url' => 'nullable|url',
            'linkedin_url' => 'nullable|url',
            'instagram_url' => 'nullable|url',
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|string',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|email',
            'mail_from_name' => 'nullable|string',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('img', 'public');
            $validated['logo_path'] = 'storage/' . $path;
        }

        $settings->update($validated);

        // Optional: Clear config cache if using dynamic settings in bootstrap
        // Artisan::call('config:clear');

        return back()->with('success', 'Email settings updated successfully.');
    }
}
