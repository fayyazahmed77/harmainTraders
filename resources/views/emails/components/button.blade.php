@php
    $url = $url ?? '#';
    $text = $text ?? 'Click Here';
    $variant = $variant ?? 'primary';
    $align = $align ?? 'left';
    
    $bgColor = '#F9A11B';
    $textColor = '#111827';
    
    if ($variant === 'danger') {
        $bgColor = '#EF4444';
        $textColor = '#FFFFFF';
    } elseif ($variant === 'secondary') {
        $bgColor = '#374151';
        $textColor = '#FFFFFF';
    } elseif ($variant === 'outline') {
        $bgColor = 'transparent';
        $textColor = '#374151';
    }
    
    $border = $variant === 'outline' ? 'border: 2px solid #D1D5DB;' : 'border: none;';
@endphp

<div style="text-align: {{ $align }}; margin: 24px 0;">
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $url }}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="18%" stroke="{{ $variant === 'outline' ? 't' : 'f' }}" fillcolor="{{ $bgColor }}">
        <w:anchorlock/>
        <center style="color:{{ $textColor }};font-family:sans-serif;font-size:13px;font-weight:bold;">{{ $text }}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <a href="{{ $url }}" style="display: inline-block; background-color: {{ $bgColor }}; color: {{ $textColor }} !important; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; {{ $border }} box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        {{ $text }}
    </a>
    <!--<![endif]-->
</div>
