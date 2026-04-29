@extends('pdf.purchase-return.layout')

@section('content')
    <table>
        <thead>
            <tr>
                <th width="15%" class="text-center">Date</th>
                <th width="15%">Invoice #</th>
                <th>Supplier</th>
                <th width="12%" class="text-right">Gross</th>
                <th width="12%" class="text-right">Discount</th>
                <th width="15%" class="text-right">Net Return</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="text-center">{{ $row['date'] }}</td>
                    <td class="font-black text-rose">{{ $row['invoice'] }}</td>
                    <td class="uppercase">{{ $row['account_name'] }}</td>
                    <td class="text-right">{{ f($row['gross']) }}</td>
                    <td class="text-right text-rose">{{ f($row['discount']) }}</td>
                    <td class="text-right font-black">{{ f($row['amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td colspan="3" class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ f(collect($data)->sum('gross')) }}</td>
                <td class="text-right font-black text-rose">{{ f(collect($data)->sum('discount')) }}</td>
                <td class="text-right font-black text-rose" style="font-size: 11px;">{{ f($totals['amount']) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
