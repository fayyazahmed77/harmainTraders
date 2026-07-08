@php
    $status = strtolower($status ?? '');
    
    $bgColor = '#F3F4F6';
    $textColor = '#374151';
    
    if (in_array($status, ['approved', 'completed', 'success', 'paid'])) {
        $bgColor = '#D1FAE5';
        $textColor = '#065F46';
    } elseif (in_array($status, ['pending', 'processing', 'warning', 'pending order'])) {
        $bgColor = '#FEF3C7';
        $textColor = '#92400E';
    } elseif (in_array($status, ['rejected', 'overdue', 'danger', 'canceled', 'cancelled', 'out of stock', 'low stock', 'returned'])) {
        $bgColor = '#FEE2E2';
        $textColor = '#991B1B';
    } elseif (in_array($status, ['partial', 'partial return'])) {
        $bgColor = '#DBEAFE';
        $textColor = '#1E40AF';
    }
    
    $labelText = ucwords(str_replace('_', ' ', $status));
@endphp

<span style="display: inline-block; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: {{ $bgColor }}; color: {{ $textColor }};">
    {{ $labelText }}
</span>
