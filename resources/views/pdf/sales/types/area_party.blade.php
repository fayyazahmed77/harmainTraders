@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 40px; border: 1px solid #000;">S.#</th>
            <th style="border: 1px solid #000;">Account Tittle</th>
            <th style="width: 120px; border: 1px solid #000;" class="text-right">Amount</th>
        </tr>
    </thead>
    <tbody>
        @php
            $groupedData = collect($data)->groupBy('subarea_name');
            $globalIdx = 0;
        @endphp
        
        @foreach($groupedData as $subarea => $items)
            <tr style="border-top: 2px solid #000; border-bottom: 1px solid #000;">
                <td colspan="2" style="padding: 4px 8px;">
                    <span style="font-size: 7px; color: #666; text-transform: uppercase;">Sub Area:</span>
                    <strong style="font-size: 10px; text-transform: uppercase;">{{ $subarea ?: 'UNASSIGNED AREA' }}</strong>
                </td>
                <td class="text-right" style="padding: 4px 8px;">
                    <span style="font-size: 7px; color: #666; text-transform: uppercase;">Sub Total:</span>
                    <strong style="font-size: 10px;">{{ number_format($items->sum('amount'), 2) }}</strong>
                </td>
            </tr>
            @foreach($items as $row)
                @php $globalIdx++; @endphp
                <tr>
                    <td style="text-align: center; font-size: 8px; border: 0.5px solid #eee;">{{ $globalIdx }}</td>
                    <td style="text-transform: uppercase; font-size: 9px; border: 0.5px solid #eee;">{{ $row['account_title'] }}</td>
                    <td class="text-right" style="font-size: 9px; border: 0.5px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
                </tr>
            @endforeach
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="2" class="text-right uppercase" style="font-size: 9px; padding: 6px;">Total Aggregated Sales</td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
