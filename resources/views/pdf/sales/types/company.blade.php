@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000; width: 100%;">
    <thead>
        <tr style="background-color: #f0f0f0;">
            <th style="width: 40px; border: 1px solid #000; padding: 4px; text-align: center;">S.#</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Client</th>
            <th style="width: 120px; border: 1px solid #000; padding: 4px; text-align: center;">Amount</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Per %</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totalAmount = collect($data)->sum('amount');
        @endphp
        
        @foreach($data as $idx => $row)
            <tr>
                <td style="text-align: center; border: 0.5px solid #000; padding: 3px;">{{ $idx + 1 }}</td>
                <td style="border: 0.5px solid #000; padding: 3px; text-transform: uppercase;">{{ $row['company_name'] ?: 'UNASSIGNED COMPANY' }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px;">{{ number_format($row['amount'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px;">{{ number_format($row['percentage'], 2) }}</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: bold; background-color: #f8f8f8;">
            <td colspan="2" style="text-align: right; border: 1px solid #000; padding: 5px; text-transform: uppercase;">Total</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px;">{{ number_format($totalAmount, 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px;">100.00</td>
        </tr>
    </tfoot>
</table>
@endsection
