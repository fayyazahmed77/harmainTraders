@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="border: 1px solid #000;">Customer/Product</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">Pack</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">QF</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">QP</th>
            <th style="width: 45px; border: 1px solid #000;" class="text-right">Rate</th>
            <th style="width: 60px; border: 1px solid #000;" class="text-right">Amount</th>
        </tr>
    </thead>
    <tbody>
        @php
            $groupedData = collect($data)->groupBy('subarea_name');
            $globalIdx = 0;
        @endphp
        
        @foreach($groupedData as $subarea => $items)
            <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000; background-color: #fff;">
                <td colspan="4" style="padding: 4px 8px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Area:</span>
                    <strong style="font-size: 9px; text-transform: uppercase;">{{ $subarea ?: 'UNASSIGNED AREA' }}</strong>
                </td>
                <td colspan="3" class="text-right" style="padding: 4px 8px;">
                    <span style="font-size: 6px; color: #666; text-transform: uppercase;">Total:</span>
                    <strong style="font-size: 10px;">{{ number_format($items->sum('amount'), 2) }}</strong>
                </td>
            </tr>
            @foreach($items as $row)
                @php $globalIdx++; @endphp
                <tr>
                    <td style="text-align: center; font-size: 7px; border: 0.5px solid #eee;">{{ $globalIdx }}</td>
                    <td style="border: 0.5px solid #eee; padding: 2px 4px;">
                        <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $row['account_title'] }}</div>
                        <div style="font-size: 7px; color: #666; text-transform: uppercase;">{{ $row['product_name'] }}</div>
                    </td>
                    <td style="font-size: 7px; text-align: center; border: 0.5px solid #eee;">{{ $row['pack_size'] }}</td>
                    <td style="font-size: 8px; font-weight: bold; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_full'] }}</td>
                    <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_pcs'] }}</td>
                    <td style="font-size: 8px; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['rate'], 1) }}</td>
                    <td style="font-size: 8px; font-weight: 900; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
                </tr>
            @endforeach
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="6" class="text-right uppercase" style="font-size: 8px; padding: 6px;">Consolidated Net Volume</td>
            <td class="text-right" style="font-size: 10px; padding: 6px;">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
