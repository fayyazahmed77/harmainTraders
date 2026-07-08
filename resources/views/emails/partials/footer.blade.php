<div style="padding: 32px 24px; text-align: center; font-size: 13px; color: #6B7280; line-height: 1.6;">
    <p style="font-weight: 700; color: #4B5563; margin: 0 0 4px 0; font-size: 14px;">
        {{ $settings->company_name ?? config('app.name') }}
    </p>
    
    @if(!empty($settings->address))
        <p style="margin: 0 0 8px 0;">{{ $settings->address }}</p>
    @endif
    
    @if(!empty($settings->contact_phone) || !empty($settings->contact_email))
        <p style="margin: 0 0 16px 0;">
            @if(!empty($settings->contact_phone))
                <span style="font-weight: 500; color: #4B5563;">Phone:</span> {{ $settings->contact_phone }}
            @endif
            @if(!empty($settings->contact_phone) && !empty($settings->contact_email))
                <span style="color: #D1D5DB; margin: 0 8px;">|</span>
            @endif
            @if(!empty($settings->contact_email))
                <span style="font-weight: 500; color: #4B5563;">Email:</span> <a href="mailto:{{ $settings->contact_email }}" style="color: #F9A11B; text-decoration: none; font-weight: 500;">{{ $settings->contact_email }}</a>
            @endif
        </p>
    @endif

    @if(!empty($settings->facebook_url) || !empty($settings->twitter_url) || !empty($settings->linkedin_url) || !empty($settings->instagram_url))
        <div style="margin-bottom: 20px; margin-top: 10px;">
            @if(!empty($settings->facebook_url))
                <a href="{{ $settings->facebook_url }}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" style="width: 18px; height: 18px; opacity: 0.4; filter: grayscale(100%);" />
                </a>
            @endif
            @if(!empty($settings->twitter_url))
                <a href="{{ $settings->twitter_url }}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" style="width: 18px; height: 18px; opacity: 0.4; filter: grayscale(100%);" />
                </a>
            @endif
            @if(!empty($settings->linkedin_url))
                <a href="{{ $settings->linkedin_url }}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" alt="LinkedIn" style="width: 18px; height: 18px; opacity: 0.4; filter: grayscale(100%);" />
                </a>
            @endif
            @if(!empty($settings->instagram_url))
                <a href="{{ $settings->instagram_url }}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" style="width: 18px; height: 18px; opacity: 0.4; filter: grayscale(100%);" />
                </a>
            @endif
        </div>
    @endif
    
    <div style="border-top: 1px solid #E5E7EB; width: 100px; margin: 20px auto;"></div>
    
    <p style="font-size: 11px; color: #9CA3AF; margin: 0; line-height: 1.5;">
        &copy; {{ date('Y') }} {{ $settings->company_name ?? config('app.name') }}. All rights reserved.<br />
        Powered by Harmain Trader ERP
    </p>
</div>
