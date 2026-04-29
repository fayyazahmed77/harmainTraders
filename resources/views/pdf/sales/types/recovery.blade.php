@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000; width: 100%;">
    <thead>
        <tr style="background-color: #f0f0f0;">
            <th style="width: 30px; border: 1px solid #000; padding: 4px; text-align: center;">S.#</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Area</th>
            <th style="border: 1px solid #000; padding: 4px; text-align: center;">Account</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Contact</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Sales</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Received</th>
            <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center;">Balance</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totals = [
                'sales' => 0,
                'received' => 0,
                'balance' => 0
            ];
        @endphp
        
        @foreach($data as $idx => $row)
            @php
                $totals['sales'] += $row['sales'];
                $totals['received'] += $row['received'];
                $totals['balance'] += $row['balance'];
            @endphp
            <tr>
                <td style="text-align: center; border: 0.5px solid #000; padding: 3px; font-size: 8px;">{{ $idx + 1 }}</td>
                <td style="border: 0.5px solid #000; padding: 3px; font-size: 8px; text-transform: uppercase;">{{ $row['area_name'] }}</td>
                <td style="border: 0.5px solid #000; padding: 3px; font-size: 9px; font-weight: bold; text-transform: uppercase;">{{ $row['account_name'] }}</td>
                <td style="border: 0.5px solid #000; padding: 3px; font-size: 8px; text-align: center;">{{ $row['contact'] }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 9px;">{{ number_format($row['sales'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 9px;">{{ number_format($row['received'], 2) }}</td>
                <td style="text-align: right; border: 0.5px solid #000; padding: 3px; font-size: 9px; font-weight: bold;">{{ number_format($row['balance'], 2) }}</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: bold; background-color: #f8f8f8;">
            <td colspan="4" style="text-align: right; border: 1px solid #000; padding: 5px; text-transform: uppercase; font-size: 10px;">Total Summary</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 10px;">{{ number_format($totals['sales'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 10px;">{{ number_format($totals['received'], 2) }}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 5px; font-size: 11px;">{{ number_format($totals['balance'], 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
