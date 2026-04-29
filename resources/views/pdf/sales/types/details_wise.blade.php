@extends('pdf.sales.layout')

@section('content')
<table>
    <thead>
        <tr>
            <th style="width: 30px;">S.#</th>
            <th style="width: 60px;">Inv #</th>
            <th style="width: 70px;">Date</th>
            <th>Customer</th>
            <th>Product Description</th>
            <th style="width: 50px;" class="text-right">Qty F</th>
            <th style="width: 50px;" class="text-right">Qty P</th>
            <th style="width: 70px;" class="text-right">Rate</th>
            <th style="width: 80px;" class="text-right">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $index => $row)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>{{ $row['invoice'] }}</td>
            <td>{{ date('d-m-Y', strtotime($row['date'])) }}</td>
            <td style="text-transform: uppercase; font-size: 8px;">{{ $row['customer_name'] }}</td>
            <td style="text-transform: uppercase;">{{ $row['product_name'] }}</td>
            <td class="text-right">{{ $row['qty_full'] }}</td>
            <td class="text-right">{{ $row['qty_pcs'] }}</td>
            <td class="text-right">{{ number_format($row['tp'], 2) }}</td>
            <td class="text-right font-bold">{{ number_format($row['amount'], 2) }}</td>
        </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f8fafc; font-weight: 900;">
            <td colspan="5" class="text-right uppercase">Totals</td>
            <td class="text-right">{{ collect($data)->sum('qty_full') }}</td>
            <td class="text-right">{{ collect($data)->sum('qty_pcs') }}</td>
            <td></td>
            <td class="text-right">{{ number_format(collect($data)->sum('amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
