@php
    $type = $type ?? 'info';
    
    $bgColor = '#F9FAFB';
    $borderColor = '#D1D5DB';
    $textColor = '#374151';
    
    if ($type === 'success') {
        $bgColor = '#ECFDF5';
        $borderColor = '#10B981';
        $textColor = '#065F46';
    } elseif ($type === 'warning') {
        $bgColor = '#FFFBEB';
        $borderColor = '#F59E0B';
        $textColor = '#92400E';
    } elseif ($type === 'danger' || $type === 'error') {
        $bgColor = '#FEF2F2';
        $borderColor = '#EF4444';
        $textColor = '#991B1B';
    }
@endphp

<div style="background-color: {{ $bgColor }}; border-left: 4px solid {{ $borderColor }}; padding: 16px; margin: 20px 0; border-radius: 4px; font-size: 14px; color: {{ $textColor }}; line-height: 1.5;">
    {{ $slot }}
</div>
