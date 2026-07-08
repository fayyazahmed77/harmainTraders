<div style="background-color: #FFFFFF; border-bottom: 1px solid #F3F4F6; border-top: 6px solid #F9A11B; padding: 32px 40px; text-align: center;">
    @if(!empty($settings->logo_path))
        <img src="{{ url($settings->logo_path) }}" alt="{{ $settings->company_name }}" style="max-height: 50px; width: auto; display: inline-block;" />
    @else
        <div style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; text-transform: uppercase;">
            {{ $settings->company_name ?? config('app.name') }}
        </div>
    @endif
    <div style="font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: 2px; text-transform: uppercase; margin-top: 6px;">
        ERP & Supply Chain Portal
    </div>
</div>
