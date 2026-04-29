@extends('pdf.purchase-return.layout')

@section('content')
    <table>
        <thead>
            <tr>
                <th>Analysis Month</th>
                <th>Supplier</th>
                <th class="text-right">Gross Total</th>
                <th class="text-right">Total Discount</th>
                <th class="text-right">Net Reversal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="font-black uppercase tracking-wider">{{ $row['month_name'] }}</td>
                    <td class="uppercase">{{ $row['account_name'] }}</td>
                    <td class="text-right">{{ f($row['gross_amount']) }}</td>
                    <td class="text-right text-rose">{{ f($row['discount_amount']) }}</td>
                    <td class="text-right font-black text-rose">{{ f($row['total_amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td colspan="2" class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ f(collect($data)->sum('gross_amount')) }}</td>
                <td class="text-right font-black text-rose">{{ f(collect($data)->sum('discount_amount')) }}</td>
                <td class="text-right font-black text-rose" style="font-size: 11px;">{{ f($totals['amount']) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
