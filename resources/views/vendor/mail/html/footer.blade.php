@php
    $settings = \App\Models\SiteSetting::get();
@endphp
<tr>
<td>
<table class="footer" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #1A1A1A; padding: 45px 30px; text-align: center; border-radius: 0 0 12px 12px;">
<tr>
<td class="content-cell" align="center" style="color: #94A3B8; font-size: 14px;">
    <p style="color: #F9A11B; font-size: 18px; font-weight: 700; margin-bottom: 15px;">{{ $settings->company_name }}</p>
    
    @if($settings->address)
        <p style="margin: 8px 0;">{{ $settings->address }}</p>
    @endif
    
    @if($settings->contact_phone || $settings->contact_email)
        <p style="margin: 8px 0;">
            @if($settings->contact_phone) {{ $settings->contact_phone }} @endif
            @if($settings->contact_phone && $settings->contact_email) | @endif
            @if($settings->contact_email) {{ $settings->contact_email }} @endif
        </p>
    @endif

    <div class="social-links" style="margin: 25px 0;">
        @if($settings->facebook_url)
            <a href="{{ $settings->facebook_url }}" style="display: inline-block; margin: 0 12px;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width="24" height="24" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
            </a>
        @endif
        @if($settings->twitter_url)
            <a href="{{ $settings->twitter_url }}" style="display: inline-block; margin: 0 12px;">
                <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" width="24" height="24" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
            </a>
        @endif
        @if($settings->linkedin_url)
            <a href="{{ $settings->linkedin_url }}" style="display: inline-block; margin: 0 12px;">
                <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" width="24" height="24" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
            </a>
        @endif
        @if($settings->instagram_url)
            <a href="{{ $settings->instagram_url }}" style="display: inline-block; margin: 0 12px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width="24" height="24" style="filter: invert(100%) brightness(150%) sepia(100%) saturate(500%) hue-rotate(0deg);">
            </a>
        @endif
    </div>

    <div style="height: 1px; background-color: #2D3748; margin: 25px auto; width: 80%;"></div>
    
    <p style="font-size: 12px; opacity: 0.8;">&copy; {{ date('Y') }} {{ $settings->company_name }}. All rights reserved.</p>
</td>
</tr>
</table>
</td>
</tr>
