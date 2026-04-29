@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="50">S.#</th>
        <th>Date</th>
        <th width="200">Amount</th>
    </tr>
</thead>
<tbody>
    @foreach($data as $index => $row)
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="text-center uppercase font-black">{{ \Carbon\Carbon::parse($row['date'])->format('d-M-y') }}</td>
        <td class="text-right font-black">{{ number_format($row['total_amount'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="2" class="text-center">GRAND TOTALS</td>
        <td class="text-right">{{ number_format($totals['amount'], 2) }}</td>
    </tr>
</tfoot>
@endsection
