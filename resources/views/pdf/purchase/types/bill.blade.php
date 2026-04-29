@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="30">S.#</th>
        <th width="70">Inv #</th>
        <th width="90">Date</th>
        <th>Account</th>
        <th width="80">Gross</th>
        <th width="80">Discount</th>
        <th width="100">Net Amount</th>
        <th width="80">Cash Paid</th>
    </tr>
</thead>
<tbody>
    @php 
        $totalGross = 0;
        $totalDiscount = 0;
        $totalPaid = 0;
    @endphp
    @foreach($data as $index => $row)
    @php 
        $totalGross += $row['gross'];
        $totalDiscount += $row['discount'];
        $totalPaid += $row['paid_amount'];
    @endphp
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="text-center font-black">{{ $row['invoice'] }}</td>
        <td class="text-center">{{ \Carbon\Carbon::parse($row['date'])->format('d-M-y H:i:s') }}</td>
        <td class="uppercase">{{ $row['account_name'] }}</td>
        <td class="text-right">{{ $row['gross'] > 0 ? number_format($row['gross'], 2) : '' }}</td>
        <td class="text-right text-rose">{{ $row['discount'] != 0 ? number_format($row['discount'], 2) : '' }}</td>
        <td class="text-right font-black">{{ $row['amount'] > 0 ? number_format($row['amount'], 2) : '' }}</td>
        <td class="text-right">{{ $row['paid_amount'] > 0 ? number_format($row['paid_amount'], 2) : '' }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="4" class="text-center">GRAND TOTALS</td>
        <td class="text-right">{{ number_format($totalGross, 2) }}</td>
        <td class="text-right">{{ number_format($totalDiscount, 2) }}</td>
        <td class="text-right">{{ number_format($totals['amount'], 2) }}</td>
        <td class="text-right">{{ number_format($totalPaid, 2) }}</td>
    </tr>
</tfoot>
@endsection
