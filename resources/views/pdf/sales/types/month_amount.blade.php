@extends('pdf.sales.layout')

@section('content')
@php
    $monthOrderMap = [
        'January' => 1, 'February' => 2, 'March' => 3, 'April' => 4, 'May' => 5, 'June' => 6,
        'July' => 7, 'August' => 8, 'September' => 9, 'October' => 10, 'November' => 11, 'December' => 12
    ];

    $months = collect($data)->pluck('month_name')->unique()->sort(function($a, $b) use ($monthOrderMap) {
        return ($monthOrderMap[$b] ?? 0) <=> ($monthOrderMap[$a] ?? 0);
    })->values();

    $accounts = collect($data)->groupBy('account_name');
    
    // Totals array
    $monthTotals = [];
    foreach($months as $m) {
        $monthTotals[$m] = 0;
    }
@endphp

<div style="margin-bottom: 20px;">
    @if(isset($isExcel))
        <!-- Excel Specific Layout -->
        <table>
            <thead>
                <tr>
                    <td style="font-weight: bold; background-color: #1E293B; color: #FFFFFF; text-align: center;">ACCOUNT DESCRIPTION</td>
                    @foreach($months as $month)
                        <td style="font-weight: bold; background-color: #1E293B; color: #FFFFFF; text-align: center;">{{ strtoupper($month) }}</td>
                    @endforeach
                    <td style="font-weight: bold; background-color: #1E293B; color: #FFFFFF; text-align: center;">TOTAL AMOUNT</td>
                </tr>
            </thead>
            <tbody>
                @foreach($accounts as $accountName => $rows)
                    @php 
                        $accountTotal = 0; 
                    @endphp
                    <tr>
                        <td style="font-weight: bold;">{{ $accountName }}</td>
                        @foreach($months as $month)
                            @php
                                $amount = $rows->where('month_name', $month)->sum('amount');
                                $accountTotal += $amount;
                                $monthTotals[$month] += $amount;
                            @endphp
                            <td style="text-align: right;">{{ $amount > 0 ? $amount : '-' }}</td>
                        @endforeach
                        <td style="font-weight: bold; text-align: right; color: #4f46e5;">{{ $accountTotal > 0 ? $accountTotal : '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td style="font-weight: bold; background-color: #f1f5f9; text-align: right;">GRAND TOTAL</td>
                    @php $grandTotal = 0; @endphp
                    @foreach($months as $month)
                        @php $grandTotal += $monthTotals[$month]; @endphp
                        <td style="font-weight: bold; background-color: #f1f5f9; text-align: right; color: #4f46e5;">{{ $monthTotals[$month] > 0 ? $monthTotals[$month] : '-' }}</td>
                    @endforeach
                    <td style="font-weight: bold; background-color: #f1f5f9; text-align: right; color: #4f46e5;">{{ $grandTotal }}</td>
                </tr>
            </tfoot>
        </table>
    @else
        <!-- PDF Layout -->
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
                <tr style="background-color: #fafafa;">
                    <th style="border: 1px solid #000; padding: 6px; font-size: 8px; text-align: left; width: 250px; text-transform: uppercase;">Account Description</th>
                    @foreach($months as $month)
                        <th style="border: 1px solid #000; padding: 6px; font-size: 8px; text-align: right; text-transform: uppercase;">{{ $month }}</th>
                    @endforeach
                    <th style="border: 1px solid #000; padding: 6px; font-size: 8px; text-align: right; text-transform: uppercase; background-color: #f1f5f9;">Total Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($accounts as $accountName => $rows)
                    @php 
                        $accountTotal = 0; 
                    @endphp
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $accountName }}</td>
                        @foreach($months as $month)
                            @php
                                $amount = $rows->where('month_name', $month)->sum('amount');
                                $accountTotal += $amount;
                                $monthTotals[$month] += $amount;
                            @endphp
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9px; text-align: right; color: #333;">
                                {{ $amount > 0 ? number_format($amount, 0) : '-' }}
                            </td>
                        @endforeach
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9px; text-align: right; font-weight: bold; color: #4f46e5; background-color: #f8fafc;">
                            {{ $accountTotal > 0 ? number_format($accountTotal, 0) : '-' }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: right; background-color: #f1f5f9; text-transform: uppercase;">Grand Total</td>
                    @php $grandTotalPdf = 0; @endphp
                    @foreach($months as $month)
                        @php $grandTotalPdf += $monthTotals[$month]; @endphp
                        <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: right; background-color: #f1f5f9; color: #4f46e5;">
                            {{ $monthTotals[$month] > 0 ? number_format($monthTotals[$month], 0) : '-' }}
                        </td>
                    @endforeach
                    <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: right; background-color: #e2e8f0; color: #4f46e5;">
                        {{ number_format($grandTotalPdf, 0) }}
                    </td>
                </tr>
            </tfoot>
        </table>
    @endif
</div>
@endsection
