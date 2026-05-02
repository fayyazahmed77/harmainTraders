<?php

namespace App\Services;

use App\Models\EmailTemplate;
use Illuminate\Support\Facades\Blade;

class EmailTemplateService
{
    /**
     * Render a template with given variables.
     */
    public function render(string $slug, array $data): array
    {
        $template = EmailTemplate::where('slug', $slug)->firstOrFail();
        
        $subject = $this->parse($template->subject, $data);
        $content = $this->parse($template->content, $data);
        
        return [
            'subject' => $subject,
            'content' => $content,
        ];
    }

    /**
     * Replace {{ variable }} tags with actual data.
     */
    protected function parse(string $text, array $data): string
    {
        foreach ($data as $key => $value) {
            $text = str_replace('{{' . $key . '}}', $value, $text);
            $text = str_replace('{{ ' . $key . ' }}', $value, $text);
        }
        
        return $text;
    }
}
