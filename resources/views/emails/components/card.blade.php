@php
    $padding = $padding ?? '24px';
    $margin = $margin ?? '24px 0';
@endphp

<div style="background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: {{ $padding }}; margin: {{ $margin }}; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
    {{ $slot }}
</div>
