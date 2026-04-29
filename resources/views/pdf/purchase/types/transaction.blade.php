@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="30">S.#</th>
        <th width="50">Inv #</th>
        <th width="70">Date</th>
        <th>Supplier</th>
        <th>Product</th>
        <th width="40">Qty</th>
        <th width="60">Rate</th>
        <th width="80">Amount</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $index => $row)
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="text-center font-black">{{ $row['invoice'] }}</td>
        <td class="text-center">{{ \Carbon\Carbon::parse($row['date'])->format('d/m/y') }}</td>
        <td class="uppercase">{{ $row['account_name'] }}</td>
        <td class="uppercase">{{ $row['product_name'] }}</td>
        <td class="text-center font-black">{{ $row['qty'] }}</td>
        <td class="text-center">{{ number_format($row['rate'], 2) }}</td>
        <td class="text-right font-black">{{ number_format($row['amount'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="5" class="text-center">GRAND TOTALS</td>
        <td class="text-center">{{ number_format($totals['qty'], 0) }}</td>
        <td class="text-center">-</td>
        <td class="text-right">{{ number_format($totals['amount'], 2) }}</td>
    </tr>
</tfoot>
@endsection
