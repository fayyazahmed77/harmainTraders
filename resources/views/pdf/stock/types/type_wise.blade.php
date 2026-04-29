@extends('pdf.stock.layout')

@section('content')
@php
    $groupedData = collect($data)->groupBy('item_type');
@endphp

@foreach($groupedData as $type => $items)
    <div style="background-color: #f0fdf4; padding: 5px; border-left: 4px solid #059669; margin-top: 15px; margin-bottom: 5px;">
        <span style="font-weight: bold; font-size: 11px; color: #059669; text-transform: uppercase;">{{ $type ?: 'GENERAL' }}</span>
        <span style="font-size: 9px; color: #666; margin-left: 10px;">({{ count($items) }} Items)</span>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 30px;">S.#</th>
                <th>Item Description</th>
                <th style="width: 70px;">Rate</th>
                <th style="width: 60px;">Packing</th>
                <th style="width: 60px;">In</th>
                <th style="width: 60px;">Out</th>
                <th style="width: 60px;">Balance</th>
            </tr>
        </thead>
        <tbody>
            @php
                $typeIn = 0;
                $typeOut = 0;
                $typeBalance = 0;
            @endphp
            @foreach($items as $idx => $row)
                @php
                    $typeIn += $row['in_qty'];
                    $typeOut += $row['out_qty'];
                    $typeBalance += $row['balance_qty'];
                @endphp
                <tr>
                    <td class="text-center">{{ $idx + 1 }}</td>
                    <td>
                        <div class="bold uppercase">{{ $row['item_name'] }}</div>
                        <div style="font-size: 7px; color: #666;">{{ $row['company_name'] }}</div>
                    </td>
                    <td class="text-right">{{ number_format($row['rate'], 2) }}</td>
                    <td class="text-center">{{ $row['packing_qty'] }}</td>
                    <td class="text-right">{{ number_format($row['in_qty'], 0) }}</td>
                    <td class="text-right">{{ number_format($row['out_qty'], 0) }}</td>
                    <td class="text-right bold {{ $row['balance_qty'] < 0 ? 'text-danger' : '' }}">
                        {{ number_format($row['balance_qty'], 0) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f9fafb; font-weight: bold;">
                <td colspan="4" class="text-right" style="font-size: 8px;">SUBTOTAL ({{ $type ?: 'GENERAL' }})</td>
                <td class="text-right">{{ number_format($typeIn, 0) }}</td>
                <td class="text-right">{{ number_format($typeOut, 0) }}</td>
                <td class="text-right" style="color: #059669;">{{ number_format($typeBalance, 0) }}</td>
            </tr>
        </tfoot>
    </table>
@endforeach

@php
    $totalIn = collect($data)->sum('in_qty');
    $totalOut = collect($data)->sum('out_qty');
    $totalBalance = collect($data)->sum('balance_qty');
@endphp

<div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
    <table style="border: none;">
        <tr style="font-weight: bold; font-size: 11px;">
            <td style="text-align: right; border: none;">GRAND TOTAL ALL TYPES:</td>
            <td style="width: 80px; text-align: right; border: none; color: #2563eb;">IN: {{ number_format($totalIn, 0) }}</td>
            <td style="width: 80px; text-align: right; border: none; color: #d97706;">OUT: {{ number_format($totalOut, 0) }}</td>
            <td style="width: 100px; text-align: right; border: none; color: #059669;">BALANCE: {{ number_format($totalBalance, 0) }}</td>
        </tr>
    </table>
</div>
@endsection
