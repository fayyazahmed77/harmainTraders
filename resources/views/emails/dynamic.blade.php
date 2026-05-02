<x-mail::message>
@if($settings->logo_path)
<div style="text-align: center; margin-bottom: 20px;">
<img src="{{ url($settings->logo_path) }}" alt="{{ $settings->company_name }}" style="max-height: 80px;">
</div>
@endif

{!! $content !!}

<x-mail::subcopy>
© {{ date('Y') }} {{ $settings->company_name }}. All rights reserved.  
@if($settings->address) {{ $settings->address }} @endif  
@if($settings->contact_phone) | Phone: {{ $settings->contact_phone }} @endif  
@if($settings->contact_email) | Email: {{ $settings->contact_email }} @endif

@if($settings->facebook_url || $settings->twitter_url || $settings->linkedin_url)
<div style="margin-top: 10px;">
@if($settings->facebook_url) [Facebook]({{ $settings->facebook_url }}) @endif
@if($settings->twitter_url) [Twitter]({{ $settings->twitter_url }}) @endif
@if($settings->linkedin_url) [LinkedIn]({{ $settings->linkedin_url }}) @endif
</div>
@endif
</x-mail::subcopy>
</x-mail::message>
