@extends('pdf.sales.layout')

@section('content')
@php
    $monthOrderMap = [
        'January' => 1, 'February' => 2, 'March' => 3, 'April' => 4, 'May' => 5, 'June' => 6,
        'July' => 7, 'August' => 8, 'September' => 9, 'October' => 10, 'November' => 11, 'December' => 12
    ];

    // Group by Month and sort descending
    $monthGroups = collect($data)->groupBy('month_name')->sort(function($a, $b) use ($monthOrderMap) {
        $aMonth = $a->first()['month_name'];
        $bMonth = $b->first()['month_name'];
        return ($monthOrderMap[$bMonth] ?? 0) <=> ($monthOrderMap[$aMonth] ?? 0);
    });
@endphp

@foreach($monthGroups as $monthName => $rows)
    @php
        $totalAmount = $rows->sum('amount');
        $totalQtyF = $rows->sum('qty_f');
        $totalQtyP = $rows->sum('qty_p');
        $accountGroups = $rows->groupBy('account_name');
    @endphp

    <div style="margin-bottom: 20px;">
        @if(isset($isExcel))
            <!-- Excel Specific Month Header -->
            <table>
                <tr>
                    <td style="font-weight: bold; background-color: #f1f5f9;">MONTH NAME:</td>
                    <td style="font-weight: bold; color: #4f46e5;">{{ strtoupper($monthName) }}</td>
                    <td style="font-weight: bold; background-color: #f1f5f9;">TOTAL QTY:</td>
                    <td style="font-weight: bold;">{{ (int)$totalQtyF }}.{{ (int)$totalQtyP }}</td>
                    <td style="font-weight: bold; background-color: #f1f5f9; text-align: right;">TOTAL AMOUNT:</td>
                    <td style="font-weight: bold; text-align: right;">{{ number_format($totalAmount, 0) }}</td>
                </tr>
            </table>
        @else
            <!-- PDF Month Header -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                <tr>
                    <td style="background-color: #f4f4f4; padding: 8px; border: 1px solid #000;">
                        <div style="font-size: 8px; color: #666; text-transform: uppercase;">Month Name</div>
                        <div style="font-size: 14px; font-weight: bold; font-style: italic; color: #4f46e5; text-transform: uppercase;">{{ $monthName }}</div>
                    </td>
                    <td style="background-color: #f4f4f4; padding: 8px; border: 1px solid #000; width: 120px;">
                        <div style="font-size: 8px; color: #666; text-transform: uppercase;">Total Qty</div>
                        <div style="font-size: 12px; font-weight: bold;">{{ (int)$totalQtyF }}.{{ (int)$totalQtyP }}</div>
                    </td>
                    <td style="background-color: #f4f4f4; padding: 8px; border: 1px solid #000; width: 150px; text-align: right;">
                        <div style="font-size: 8px; color: #666; text-transform: uppercase;">Total Amount</div>
                        <div style="font-size: 14px; font-weight: bold;">{{ number_format($totalAmount, 0) }}</div>
                    </td>
                </tr>
            </table>
        @endif

        <!-- Details Table -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; border-top: none;">
            <thead>
                <tr style="background-color: #fafafa;">
                    <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; width: 200px; text-transform: uppercase;">Account Description</th>
                    <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: left; text-transform: uppercase;">Item Description</th>
                    <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: center; width: 80px; text-transform: uppercase;">Qty</th>
                    <th style="border: 1px solid #000; padding: 4px; font-size: 8px; text-align: right; width: 100px; text-transform: uppercase;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($accountGroups as $accountName => $items)
                    @foreach($items as $index => $item)
                        <tr>
                            @if($index === 0)
                                <td rowspan="{{ count($items) }}" style="border: 1px solid #000; padding: 4px; font-size: 9px; font-weight: bold; vertical-align: top; background-color: #f9f9f9; text-transform: uppercase;">
                                    {{ $accountName }}
                                </td>
                            @endif
                            <td style="border: 1px solid #000; padding: 4px; font-size: 8px; text-transform: uppercase;">{{ $item['item_name'] }}</td>
                            <td style="border: 1px solid #000; padding: 4px; font-size: 9px; text-align: center; font-weight: bold;">
                                {{ (int)$item['qty_f'] }}.{{ (int)$item['qty_p'] }}
                            </td>
                            <td style="border: 1px solid #000; padding: 4px; font-size: 9px; text-align: right; font-weight: bold; color: #4f46e5;">
                                {{ number_format($item['amount'], 0) }}
                            </td>
                        </tr>
                    @endforeach
                @endforeach
            </tbody>
        </table>
    </div>
@endforeach
@endsection
