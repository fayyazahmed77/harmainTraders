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
    
    // Totals arrays
    $monthTotalsF = [];
    $monthTotalsP = [];
    foreach($months as $m) {
        $monthTotalsF[$m] = 0;
        $monthTotalsP[$m] = 0;
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
                    <td style="font-weight: bold; background-color: #1E293B; color: #FFFFFF; text-align: center;">TOTAL QTY</td>
                </tr>
            </thead>
            <tbody>
                @foreach($accounts as $accountName => $rows)
                    @php 
                        $accountTotalF = 0; 
                        $accountTotalP = 0; 
                    @endphp
                    <tr>
                        <td style="font-weight: bold;">{{ $accountName }}</td>
                        @foreach($months as $month)
                            @php
                                $qtyF = $rows->where('month_name', $month)->sum('qty_f');
                                $qtyP = $rows->where('month_name', $month)->sum('qty_p');
                                $accountTotalF += $qtyF;
                                $accountTotalP += $qtyP;
                                $monthTotalsF[$month] += $qtyF;
                                $monthTotalsP[$month] += $qtyP;
                                $hasData = $qtyF > 0 || $qtyP > 0;
                            @endphp
                            <!-- Using a string format to prevent Excel from dropping .0 if it thinks it's a decimal -->
                            <td style="text-align: right;">{{ $hasData ? ((int)$qtyF . '.' . (int)$qtyP) : '-' }}</td>
                        @endforeach
                        <td style="font-weight: bold; text-align: right; color: #4f46e5;">{{ ($accountTotalF > 0 || $accountTotalP > 0) ? ((int)$accountTotalF . '.' . (int)$accountTotalP) : '-' }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td style="font-weight: bold; background-color: #f1f5f9; text-align: right;">GRAND TOTAL</td>
                    @php 
                        $grandTotalF = 0; 
                        $grandTotalP = 0; 
                    @endphp
                    @foreach($months as $month)
                        @php 
                            $grandTotalF += $monthTotalsF[$month]; 
                            $grandTotalP += $monthTotalsP[$month]; 
                            $hasMonthData = $monthTotalsF[$month] > 0 || $monthTotalsP[$month] > 0;
                        @endphp
                        <td style="font-weight: bold; background-color: #f1f5f9; text-align: right; color: #4f46e5;">{{ $hasMonthData ? ((int)$monthTotalsF[$month] . '.' . (int)$monthTotalsP[$month]) : '-' }}</td>
                    @endforeach
                    <td style="font-weight: bold; background-color: #f1f5f9; text-align: right; color: #4f46e5;">{{ (int)$grandTotalF . '.' . (int)$grandTotalP }}</td>
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
                        <th style="border: 1px solid #000; padding: 6px; font-size: 8px; text-align: center; text-transform: uppercase;">{{ $month }}</th>
                    @endforeach
                    <th style="border: 1px solid #000; padding: 6px; font-size: 8px; text-align: center; text-transform: uppercase; background-color: #f1f5f9;">Total Qty</th>
                </tr>
            </thead>
            <tbody>
                @foreach($accounts as $accountName => $rows)
                    @php 
                        $accountTotalF = 0; 
                        $accountTotalP = 0; 
                    @endphp
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $accountName }}</td>
                        @foreach($months as $month)
                            @php
                                $qtyF = $rows->where('month_name', $month)->sum('qty_f');
                                $qtyP = $rows->where('month_name', $month)->sum('qty_p');
                                $accountTotalF += $qtyF;
                                $accountTotalP += $qtyP;
                                $monthTotalsF[$month] += $qtyF;
                                $monthTotalsP[$month] += $qtyP;
                                $hasData = $qtyF > 0 || $qtyP > 0;
                            @endphp
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9px; text-align: center; color: #333;">
                                {{ $hasData ? ((int)$qtyF . '.' . (int)$qtyP) : '-' }}
                            </td>
                        @endforeach
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 9px; text-align: center; font-weight: bold; color: #4f46e5; background-color: #f8fafc;">
                            {{ ($accountTotalF > 0 || $accountTotalP > 0) ? ((int)$accountTotalF . '.' . (int)$accountTotalP) : '-' }}
                        </td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: right; background-color: #f1f5f9; text-transform: uppercase;">Grand Total</td>
                    @php 
                        $grandTotalPdfF = 0; 
                        $grandTotalPdfP = 0; 
                    @endphp
                    @foreach($months as $month)
                        @php 
                            $grandTotalPdfF += $monthTotalsF[$month]; 
                            $grandTotalPdfP += $monthTotalsP[$month]; 
                            $hasMonthData = $monthTotalsF[$month] > 0 || $monthTotalsP[$month] > 0;
                        @endphp
                        <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: center; background-color: #f1f5f9; color: #4f46e5;">
                            {{ $hasMonthData ? ((int)$monthTotalsF[$month] . '.' . (int)$monthTotalsP[$month]) : '-' }}
                        </td>
                    @endforeach
                    <td style="border: 1px solid #000; padding: 6px; font-size: 9px; font-weight: bold; text-align: center; background-color: #e2e8f0; color: #4f46e5;">
                        {{ (int)$grandTotalPdfF . '.' . (int)$grandTotalPdfP }}
                    </td>
                </tr>
            </tfoot>
        </table>
    @endif
</div>
@endsection
