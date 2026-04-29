@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="border: 1px solid #000;">Item Description</th>
            <th style="width: 35px; border: 1px solid #000;" class="text-center">Pack</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">Full</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">Pcs</th>
            <th style="width: 55px; border: 1px solid #000;" class="text-right">Gross</th>
            <th style="width: 45px; border: 1px solid #000;" class="text-right">Disc</th>
            <th style="width: 70px; border: 1px solid #000;" class="text-right">Net Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $idx => $row)
            <tr>
                <td style="font-size: 7px; text-align: center; border: 0.5px solid #eee;">{{ $idx + 1 }}</td>
                <td style="font-size: 8px; font-weight: bold; text-transform: uppercase; padding: 3px; border: 0.5px solid #eee;">{{ $row['item_description'] }}</td>
                <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ $row['packing'] }}</td>
                <td style="font-size: 8px; font-weight: bold; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_full'] }}</td>
                <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_pcs'] }}</td>
                <td style="font-size: 8px; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['gross_amount'], 1) }}</td>
                <td style="font-size: 8px; text-align: right; color: #666; border: 0.5px solid #eee;">{{ number_format($row['disc_amt'], 1) }}</td>
                <td style="font-size: 8px; font-weight: 900; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['net_amount'], 2) }}</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="3" class="text-right uppercase" style="font-size: 8px; padding: 6px;">Total Period Summary</td>
            <td style="text-align: center; border: 0.5px solid #eee;">{{ (int)collect($data)->sum('qty_full') }}</td>
            <td style="text-align: center; border: 0.5px solid #eee;">{{ (int)collect($data)->sum('qty_pcs') }}</td>
            <td style="text-align: right; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('gross_amount'), 2) }}</td>
            <td style="text-align: right; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('disc_amt'), 2) }}</td>
            <td style="text-align: right; font-size: 10px; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('net_amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
