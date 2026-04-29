@extends('pdf.purchase-return.layout')

@section('content')
    <table>
        <thead>
            <tr>
                <th width="12%" class="text-center">Date</th>
                <th width="15%">Invoice #</th>
                <th>Supplier</th>
                <th width="15%" class="text-right">Net Return</th>
                <th width="15%" class="text-right">Refund Recv</th>
                <th width="15%" class="text-right">Pending Credit</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="text-center">{{ $row['date'] }}</td>
                    <td class="font-black text-rose">{{ $row['invoice'] }}</td>
                    <td class="uppercase">{{ $row['account_name'] }}</td>
                    <td class="text-right font-bold">{{ f($row['total_amount']) }}</td>
                    <td class="text-right text-emerald font-bold">{{ f($row['paid_amount']) }}</td>
                    <td class="text-right font-black text-rose">{{ f($row['balance']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td colspan="3" class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ f(collect($data)->sum('total_amount')) }}</td>
                <td class="text-right font-black text-emerald">{{ f(collect($data)->sum('paid_amount')) }}</td>
                <td class="text-right font-black text-rose" style="font-size: 11px;">{{ f(collect($data)->sum('balance')) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
