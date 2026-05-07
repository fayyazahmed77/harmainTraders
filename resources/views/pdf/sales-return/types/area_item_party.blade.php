@extends('pdf.sales-return.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="border: 1px solid #000;">Area / Customer / Product</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty F</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty P</th>
            <th style="width: 50px; border: 1px solid #000;" class="text-right">Rate</th>
            <th style="width: 60px; border: 1px solid #000;" class="text-right">Net Amt</th>
        </tr>
    </thead>
    <tbody>
        @php $currentSubarea = ''; @endphp
        @foreach($data as $index => $row)
            @if($currentSubarea != $row['subarea_name'])
                <tr style="background: #f8fafc;">
                    <td colspan="6" style="font-weight: 900; font-size: 8px; text-transform: uppercase; border: 1px solid #eee;">
                        AREA: {{ $row['subarea_name'] ?: 'UNASSIGNED' }}
                    </td>
                </tr>
                @php $currentSubarea = $row['subarea_name']; @endphp
            @endif
        <tr>
            <td style="text-align: center; font-size: 7px; border: 0.5px solid #eee;">{{ $index + 1 }}</td>
            <td style="border: 0.5px solid #eee; padding: 2px 4px;">
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $row['account_title'] }}</div>
                <div style="font-size: 7px; color: #666; text-transform: uppercase;">{{ $row['product_name'] }} (Size: {{ $row['pack_size'] }})</div>
            </td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ $row['qty_full'] }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ $row['qty_pcs'] }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['rate'], 2) }}</td>
            <td style="text-align: right; font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="2" class="text-right uppercase" style="font-size: 9px; padding: 6px;">Total Summarized</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_full'), 0) }}</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_pcs'), 0) }}</td>
            <td></td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
