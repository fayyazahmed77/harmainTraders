<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\EmailTemplateService;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailTemplateController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/settings/templates/index', [
            'templates' => EmailTemplate::all(),
        ]);
    }

    public function edit(EmailTemplate $template)
    {
        return Inertia::render('admin/settings/templates/edit', [
            'template' => $template,
        ]);
    }

    public function update(Request $request, EmailTemplate $template)
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $oldValues = $template->getRawOriginal();
        $template->update($validated);
        $newValues = $template->fresh()->toArray();

        ActivityLogger::log(
            'updated', 
            'Email Template', 
            "Updated template: {$template->name}",
            $oldValues,
            $newValues
        );

        return redirect()->route('admin.settings.templates.index')
            ->with('success', 'Email template updated successfully.');
    }

    public function preview(Request $request, EmailTemplate $template)
    {
        $service = app(EmailTemplateService::class);
        
        // Use dummy data for preview based on variables
        $dummyData = [];
        foreach ($template->variables ?? [] as $var) {
            $dummyData[$var] = '[' . strtoupper($var) . ']';
        }
        
        $rendered = $service->render($template->slug, $dummyData);
        
        return Inertia::render('admin/settings/templates/preview', [
            'template' => $template,
            'rendered' => $rendered,
        ]);
    }
}
