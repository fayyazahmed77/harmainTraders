@extends('pdf.purchase-return.layout')

@section('content')
    <table>
        <thead>
            <tr>
                <th>Product Name</th>
                <th class="text-center">Packing</th>
                <th class="text-right">Total Ctn</th>
                <th class="text-right">Total Pcs</th>
                <th class="text-right">Gross Value</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Net Reversal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="font-black uppercase tracking-tight">{{ $row['name'] }}</td>
                    <td class="text-center text-slate-500">1x{{ $row['packing'] }}</td>
                    <td class="text-right font-bold">{{ $row['qty_full'] }}</td>
                    <td class="text-right font-bold">{{ $row['qty_pcs'] }}</td>
                    <td class="text-right">{{ f($row['gross_amount']) }}</td>
                    <td class="text-right text-rose">{{ f($row['discount_amount']) }}</td>
                    <td class="text-right font-black text-rose">{{ f($row['net_amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td colspan="2" class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ collect($data)->sum('qty_full') }}</td>
                <td class="text-right font-black">{{ collect($data)->sum('qty_pcs') }}</td>
                <td class="text-right font-black">{{ f(collect($data)->sum('gross_amount')) }}</td>
                <td class="text-right font-black text-rose">{{ f(collect($data)->sum('discount_amount')) }}</td>
                <td class="text-right font-black text-rose" style="font-size: 11px;">{{ f($totals['amount']) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
