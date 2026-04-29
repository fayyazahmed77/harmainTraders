@extends('pdf.purchase.layout')

@section('content')
<thead>
    <tr>
        <th width="20">S.#</th>
        <th width="40">Inv #</th>
        <th width="50">Inv Date</th>
        <th width="120">PARTY</th>
        <th>Item</th>
        <th width="35">T.P.</th>
        <th width="25">Qty F</th>
        <th width="25">Qty P</th>
        <th width="35">Rate</th>
        <th width="25">B.Full</th>
        <th width="25">B.Pcs</th>
        <th width="35">Disc 1</th>
        <th width="35">Tax Amt</th>
        <th width="55">Amount</th>
    </tr>
</thead>
<tbody>
    @php 
        $totalQtyF = 0;
        $totalQtyP = 0;
        $totalBFull = 0;
        $totalBPcs = 0;
        $totalTax = 0;
        $totalAmount = 0;
    @endphp
    @foreach($data as $index => $row)
    @php 
        $totalQtyF += $row['qty_full'];
        $totalQtyP += $row['qty_pcs'];
        $totalBFull += $row['b_full'];
        $totalBPcs += $row['b_pcs'];
        $totalTax += $row['tax_amt'];
        $totalAmount += $row['amount'];
    @endphp
    <tr>
        <td class="text-center">{{ $index + 1 }}</td>
        <td class="text-center font-black">{{ $row['invoice'] }}</td>
        <td class="text-center">{{ \Carbon\Carbon::parse($row['date'])->format('d-M-y') }}</td>
        <td class="uppercase wrap-text">{{ $row['account_name'] }}</td>
        <td class="uppercase wrap-text">{{ $row['product_name'] }}</td>
        <td class="text-center">{{ number_format($row['tp'], 2) }}</td>
        <td class="text-center font-black">{{ number_format($row['qty_full'], 0) }}</td>
        <td class="text-center font-bold">{{ number_format($row['qty_pcs'], 0) }}</td>
        <td class="text-center">{{ number_format($row['rate'], 2) }}</td>
        <td class="text-center">{{ number_format($row['b_full'], 0) }}</td>
        <td class="text-center">{{ number_format($row['b_pcs'], 0) }}</td>
        <td class="text-center text-rose">{{ $row['disc_1'] > 0 ? number_format($row['disc_1'], 2) : '0' }}</td>
        <td class="text-center">{{ $row['tax_amt'] > 0 ? number_format($row['tax_amt'], 2) : '0' }}</td>
        <td class="text-right font-black">{{ number_format($row['amount'], 2) }}</td>
    </tr>
    @endforeach
</tbody>
<tfoot>
    <tr class="total-row">
        <td colspan="6" class="text-center">GRAND TOTALS</td>
        <td class="text-center">{{ number_format($totalQtyF, 0) }}</td>
        <td class="text-center">{{ number_format($totalQtyP, 0) }}</td>
        <td class="text-center"></td>
        <td class="text-center">{{ number_format($totalBFull, 0) }}</td>
        <td class="text-center">{{ number_format($totalBPcs, 0) }}</td>
        <td class="text-center"></td>
        <td class="text-center">{{ number_format($totalTax, 2) }}</td>
        <td class="text-right">{{ number_format($totalAmount, 2) }}</td>
    </tr>
</tfoot>
@endsection
