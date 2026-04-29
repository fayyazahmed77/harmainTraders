@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="40">S.#</th>
        <th>Supplier Name</th>
        <th width="100">Total Quantity</th>
        <th width="150">Total Procurement</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $index => $row)
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="uppercase font-black">{{ $row['name'] }}</td>
        <td class="text-center font-bold">{{ number_format($row['total_qty'], 0) }}</td>
        <td class="text-right font-black">{{ number_format($row['total_amount'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="2" class="text-center">GRAND TOTALS</td>
        <td class="text-center">{{ number_format($totals['qty'], 0) }}</td>
        <td class="text-right">{{ number_format($totals['amount'], 2) }}</td>
    </tr>
</tfoot>
@endsection
