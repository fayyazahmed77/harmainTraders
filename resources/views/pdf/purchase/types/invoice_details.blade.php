@extends('pdf.purchase.layout')

@section('content')
@php
    $groupedData = collect($data)->groupBy('invoice');
    $grandTotal = 0;
@endphp

@foreach($groupedData as $invoice => $items)
    @php
        $firstItem = $items->first();
        $invoiceTotal = $items->sum('amount');
        $grandTotal += $invoiceTotal;
    @endphp
    <thead>
        <tr class="total-row" style="background-color: #f8fafc;">
            <th colspan="10" style="text-align: left; padding: 6px 10px; font-size: 9px;">
                INV #: <span class="font-black" style="color: #059669;">{{ $invoice }}</span> | 
                DATE: <span class="font-bold">{{ \Carbon\Carbon::parse($firstItem['date'])->format('d-M-Y') }}</span> | 
                PARTY: <span class="uppercase font-black">{{ $firstItem['account_name'] }}</span>
            </th>
            <th class="text-right" style="padding-right: 10px; font-size: 10px;">
                INV TOTAL: <span class="font-black">{{ number_format($invoiceTotal, 2) }}</span>
            </th>
        </tr>
        <tr>
            <th width="20">S.#</th>
            <th>Item</th>
            <th width="40">T.P.</th>
            <th width="30">Qty F</th>
            <th width="30">Qty P</th>
            <th width="40">Rate</th>
            <th width="30">B.Full</th>
            <th width="30">B.Pcs</th>
            <th width="40">Disc</th>
            <th width="40">Tax</th>
            <th width="65">Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach($items as $idx => $row)
        <tr>
            <td class="text-center">{{ $idx + 1 }}</td>
            <td class="uppercase wrap-text">{{ $row['product_name'] }}</td>
            <td class="text-center">{{ number_format($row['tp'], 2) }}</td>
            <td class="text-center font-black" style="color: #2563eb;">{{ number_format($row['qty_full'], 0) }}</td>
            <td class="text-center font-bold" style="color: #3b82f6;">{{ number_format($row['qty_pcs'], 0) }}</td>
            <td class="text-center font-bold">{{ number_format($row['rate'], 2) }}</td>
            <td class="text-center" style="color: #e11d48;">{{ number_format($row['b_full'], 0) }}</td>
            <td class="text-center" style="color: #e11d48;">{{ number_format($row['b_pcs'], 0) }}</td>
            <td class="text-center" style="color: #e11d48;">{{ number_format($row['disc_1'], 2) }}</td>
            <td class="text-center" style="color: #d97706;">{{ number_format($row['tax_amt'], 2) }}</td>
            <td class="text-right font-black" style="color: #1e293b;">{{ number_format($row['amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    {{-- Empty row for spacing between invoices --}}
    <tr style="border: none; height: 12px;">
        <td colspan="11" style="border: none; background: transparent;"></td>
    </tr>
@endforeach

<tfoot>
    <tr class="total-row" style="background-color: #064e3b; color: white;">
        <td colspan="10" class="text-center" style="color: white; font-size: 11px; letter-spacing: 2px;">GRAND TOTAL (ALL INVOICES)</td>
        <td class="text-right" style="color: white; font-size: 11px;">{{ number_format($grandTotal, 2) }}</td>
    </tr>
</tfoot>
@endsection
