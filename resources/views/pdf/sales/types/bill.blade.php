@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="width: 50px; border: 1px solid #000;">Inv #</th>
            <th style="width: 55px; border: 1px solid #000;">Date</th>
            <th style="border: 1px solid #000;">Customer / Salesman</th>
            <th style="width: 55px; border: 1px solid #000;" class="text-right">Net Amt</th>
            <th style="width: 55px; border: 1px solid #000;" class="text-right">Paid</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $index => $row)
        <tr>
            <td style="text-align: center; font-size: 7px; border: 0.5px solid #eee;">{{ $index + 1 }}</td>
            <td style="font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ $row['invoice'] }}</td>
            <td style="font-size: 7px; border: 0.5px solid #eee;">{{ date('d-m-Y', strtotime($row['date'])) }}</td>
            <td style="border: 0.5px solid #eee; padding: 2px 4px;">
                <div style="font-size: 8px; font-weight: bold; text-transform: uppercase;">{{ $row['customer_name'] }}</div>
                <div style="font-size: 6px; color: #666; text-transform: uppercase;">{{ $row['salesman_name'] }}</div>
            </td>
            <td style="text-align: right; font-size: 8px; font-weight: bold; border: 0.5px solid #eee;">{{ number_format($row['amount'], 2) }}</td>
            <td style="text-align: right; font-size: 8px; border: 0.5px solid #eee;">{{ number_format($row['paid_amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="4" class="text-right uppercase" style="font-size: 9px; padding: 6px;">Total Summarized Volume</td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
            <td class="text-right" style="font-size: 11px; padding: 6px;">{{ number_format(collect($data)->sum('paid_amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
