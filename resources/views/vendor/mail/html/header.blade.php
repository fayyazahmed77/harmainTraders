@php
    $settings = \App\Models\SiteSetting::get();
@endphp
<tr>
<td class="header" style="background-color: #ffffff; padding: 40px 20px; text-align: center; border-top: 6px solid #F9A11B;">
<a href="{{ $url }}" style="display: inline-block; text-decoration: none;">
@if($settings->logo_path)
    <img src="{{ url($settings->logo_path) }}" class="logo" alt="{{ $settings->company_name }}" style="max-height: 80px; width: auto;">
@else
    <span style="color: #111318; font-size: 26px; font-weight: 700; letter-spacing: 1px;">{{ $settings->company_name ?? $slot }}</span>
@endif
</a>
</td>
</tr>
