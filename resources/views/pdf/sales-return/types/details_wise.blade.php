@extends('pdf.sales-return.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="width: 50px; border: 1px solid #000;">Voucher #</th>
            <th style="width: 55px; border: 1px solid #000;">Date</th>
            <th style="border: 1px solid #000;">Customer / Product</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty F</th>
            <th style="width: 40px; border: 1px solid #000;" class="text-right">Qty P</th>
            <th style="width: 50px; border: 1px solid #000;" class="text-right">Rate</th>
            <th style="width: 60px; border: 1px solid #000;" class="text-right">Net Amt</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $index => $row)
        <tr>
            <td style="text-align: center; font-size: 7px; border: 0.5px solid #eee;">{{ $index + 1 }}</td>
            <td style="font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ $row['voucher_no'] }}</td>
            <td style="font-size: 7px; border: 0.5px solid #eee;">{{ date('d-m-Y', strtotime($row['date'])) }}</td>
            <td style="border: 0.5px solid #eee; padding: 2px 4px;">
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $row['customer_name'] }}</div>
                <div style="font-size: 7px; color: #666; text-transform: uppercase;">{{ $row['product_name'] }}</div>
            </td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ $row['qty_full'] }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ $row['qty_pcs'] }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['tp'], 2) }}</td>
            <td style="text-align: right; font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="4" class="text-right uppercase" style="font-size: 9px; padding: 6px;">Total Summarized</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_full'), 0) }}</td>
            <td class="text-right" style="font-size: 9px; padding: 6px;">{{ number_format(collect($data)->sum('qty_pcs'), 0) }}</td>
            <td></td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
