@extends('pdf.purchase-return.layout')

@section('content')
    <table style="font-size: 8px;">
        <thead>
            <tr>
                <th width="8%">Date</th>
                <th width="8%">Invoice</th>
                <th width="15%">Supplier</th>
                <th width="20%">Product</th>
                <th width="8%" class="text-right">Qty (Ctn)</th>
                <th width="8%" class="text-right">Qty (Pcs)</th>
                <th width="10%" class="text-right">Rate (TP)</th>
                <th width="10%" class="text-right">Disc</th>
                <th width="10%" class="text-right">Net Value</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td>{{ $row['date'] }}</td>
                    <td class="font-black text-rose">{{ $row['invoice'] }}</td>
                    <td class="uppercase">{{ $row['account_name'] }}</td>
                    <td class="font-black uppercase">{{ $row['product_name'] }}</td>
                    <td class="text-right">{{ $row['qty_full'] }}</td>
                    <td class="text-right">{{ $row['qty_pcs'] }}</td>
                    <td class="text-right">{{ f($row['rate']) }}</td>
                    <td class="text-right text-rose">{{ f($row['disc_1']) }}</td>
                    <td class="text-right font-black">{{ f($row['amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td colspan="4" class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ collect($data)->sum('qty_full') }}</td>
                <td class="text-right font-black">{{ collect($data)->sum('qty_pcs') }}</td>
                <td colspan="2"></td>
                <td class="text-right font-black text-rose" style="font-size: 10px;">{{ f($totals['amount']) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
