@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000; width: 100%;">
    <thead>
        <tr style="background-color: #f0f0f0;">
            <th style="width: 30px; border: 1px solid #000; padding: 4px; text-align: center;">S.#</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Salesman</th>
            <th style="width: 70px; border: 1px solid #000; padding: 4px; text-align: center;">Gross</th>
            <th style="width: 70px; border: 1px solid #000; padding: 4px; text-align: center;">Discount</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Net Amount</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Recovery</th>
            <th style="width: 50px; border: 1px solid #000; padding: 4px; text-align: center;">Per %</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totals = [
                'gross' => 0,
                'discount' => 0,
                'amount' => 0,
                'recovery' => 0
            ];
        @endphp
        
        @foreach($data as $idx => $row)
            @php
                $totals['gross'] += $row['gross'];
                $totals['discount'] += $row['discount'];
                $totals['amount'] += $row['amount'];
                $totals['recovery'] += $row['recovery'];
            @endphp
            <tr>
                <td style="text-align: center; border: 0.5px solid #000; padding: 3px; font-size: 8px;">{{ $idx + 1 }}</td>
                <td style="border: 0.5px solid #000; padding: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase;">{{ $row['salesman_name'] }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 8px;">{{ number_format($row['gross'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 8px; color: #666;">{{ number_format($row['discount'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 9px; font-weight: bold;">{{ number_format($row['amount'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 9px;">{{ number_format($row['recovery'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 8px;">{{ number_format($row['percentage'], 2) }}%</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: bold; background-color: #f8f8f8;">
            <td colspan="2" style="text-align: right; border: 1px solid #000; padding: 5px; text-transform: uppercase; font-size: 10px;">Total</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 9px;">{{ number_format($totals['gross'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 9px;">{{ number_format($totals['discount'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 10px;">{{ number_format($totals['amount'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 10px;">{{ number_format($totals['recovery'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 9px;">100.00%</td>
        </tr>
    </tfoot>
</table>
@endsection
