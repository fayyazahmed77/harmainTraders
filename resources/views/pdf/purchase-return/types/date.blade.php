@extends('pdf.purchase-return.layout')

@section('content')
    <table style="width: 60%; margin: 20px auto;">
        <thead>
            <tr>
                <th>Return Date</th>
                <th class="text-right">Invoices Returned</th>
                <th class="text-right">Total Net Reversal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $row)
                <tr>
                    <td class="font-black uppercase tracking-widest">{{ $row['date_display'] ?? $row['date'] }}</td>
                    <td class="text-right font-bold">{{ $row['total_bills'] }}</td>
                    <td class="text-right font-black text-rose">{{ f($row['total_amount']) }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr style="background-color: #f8fafc;">
                <td class="font-black uppercase">Grand Totals</td>
                <td class="text-right font-black">{{ collect($data)->sum('total_bills') }}</td>
                <td class="text-right font-black text-rose" style="font-size: 11px;">{{ f($totals['amount']) }}</td>
            </tr>
        </tfoot>
    </table>
@endsection
