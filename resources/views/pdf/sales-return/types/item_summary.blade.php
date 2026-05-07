@extends('pdf.sales-return.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="border: 1px solid #000;">Item Description</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty F</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty P</th>
            <th style="width: 70px; border: 1px solid #000;" class="text-right">Gross Amt</th>
            <th style="width: 60px; border: 1px solid #000;" class="text-right">Disc</th>
            <th style="width: 70px; border: 1px solid #000;" class="text-right">Net Amt</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $index => $row)
        <tr>
            <td style="text-align: center; font-size: 7px; border: 0.5px solid #eee;">{{ $index + 1 }}</td>
            <td style="border: 0.5px solid #eee; padding: 2px 4px;">
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $row['item_description'] }}</div>
                <div style="font-size: 6px; color: #666; text-transform: uppercase;">Pack: {{ $row['packing'] }}</div>
            </td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['qty_full'], 0) }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['qty_pcs'], 0) }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['gross_amount'], 2) }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['disc_amt'], 2) }}</td>
            <td style="text-align: right; font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ number_format($row['net_amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="2" class="text-right uppercase" style="font-size: 9px; padding: 6px;">Total Summarized</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_full'), 0) }}</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_pcs'), 0) }}</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('gross_amount'), 2) }}</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('disc_amt'), 2) }}</td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('net_amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
