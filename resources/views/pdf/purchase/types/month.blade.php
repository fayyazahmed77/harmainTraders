@extends('pdf.purchase.layout')

@section('content')
@php
    $groupedData = collect($data)->groupBy('month_key');
@endphp

@foreach($groupedData as $monthKey => $accounts)
    @php
        $first = $accounts->first();
        $monthTotal = $accounts->sum('total_amount');
    @endphp
    <thead>
        <tr class="total-row" style="background-color: #f8fafc;">
            <th colspan="8" class="text-center" style="font-size: 11px; color: #059669; padding: 6px; letter-spacing: 2px;">
                {{ strtoupper($first['month_name']) }} PROCUREMENT SUMMARY
            </th>
        </tr>
        <tr>
            <th width="30">S.#</th>
            <th>Account (Party)</th>
            <th width="75">Amount</th>
            <th width="65">Discount</th>
            <th width="55">TXT</th>
            <th width="75">Total</th>
            <th width="75">Paid</th>
            <th width="75">Balance</th>
        </tr>
    </thead>
    <tbody>
        @foreach($accounts as $idx => $row)
        <tr>
            <td class="text-center">{{ $idx + 1 }}</td>
            <td class="uppercase wrap-text">{{ $row['account_name'] }}</td>
            <td class="text-right">{{ number_format($row['gross_amount'], 2) }}</td>
            <td class="text-right" style="color: #e11d48;">{{ number_format($row['discount_amount'], 2) }}</td>
            <td class="text-right" style="color: #d97706;">{{ number_format($row['tax_amount'], 2) }}</td>
            <td class="text-right font-black">{{ number_format($row['total_amount'], 2) }}</td>
            <td class="text-right font-bold" style="color: #059669;">{{ number_format($row['paid_amount'], 2) }}</td>
            <td class="text-right font-black" style="color: #dc2626;">{{ number_format($row['balance'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr class="total-row" style="background-color: #ecfdf5;">
            <td colspan="2" class="text-center" style="font-size: 9px;">{{ strtoupper($first['month_name']) }} TOTALS</td>
            <td class="text-right" style="font-size: 9px;">{{ number_format($accounts->sum('gross_amount'), 2) }}</td>
            <td class="text-right" style="font-size: 9px;">{{ number_format($accounts->sum('discount_amount'), 2) }}</td>
            <td class="text-right" style="font-size: 9px;">{{ number_format($accounts->sum('tax_amount'), 2) }}</td>
            <td class="text-right font-black" style="font-size: 9px;">{{ number_format($monthTotal, 2) }}</td>
            <td class="text-right" style="font-size: 9px; color: #059669;">{{ number_format($accounts->sum('paid_amount'), 2) }}</td>
            <td class="text-right" style="font-size: 9px; color: #dc2626;">{{ number_format($accounts->sum('balance'), 2) }}</td>
        </tr>
    </tfoot>
    {{-- Spacer --}}
    <tr style="border:none; height: 18px;"><td colspan="8" style="border:none; background:transparent;"></td></tr>
@endforeach

@endsection
