@extends('pdf.stock.layout')

@section('content')
<table style="width: 100%; border-collapse: collapse; font-size: 9px;">
    <thead>
        <tr style="background-color: #f3f4f6; border-bottom: 1px solid #000;">
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Date</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Voucher #</th>
            <th style="padding: 5px; text-align: left; border: 1px solid #ddd;">Account</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">Rate</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">In</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">Out</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">Balance</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">COGS Rt</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">Amount</th>
            <th style="padding: 5px; text-align: right; border: 1px solid #ddd;">Profit/Loss</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $row)
            @php
                $profitClass = $row['profit_loss'] >= 0 ? 'text-success' : 'text-danger';
                $profitText = $row['profit_loss'] != 0 ? number_format($row['profit_loss'], 2) : '-';
            @endphp
            <tr>
                <td style="padding: 5px; border: 1px solid #ddd;">{{ \Carbon\Carbon::parse($row['date'])->format('d-M-y') }}</td>
                <td style="padding: 5px; border: 1px solid #ddd;">{{ $row['voucher_no'] }}</td>
                <td style="padding: 5px; border: 1px solid #ddd;">
                    @if(isset($is_excel) && $is_excel)
                        {{ $row['account_name'] }} ({{ strtoupper($row['type']) }})
                    @else
                        <div style="font-weight: bold;">{{ $row['account_name'] }}</div>
                        <div style="font-size: 7px; color: #666;">{{ strtoupper($row['type']) }}</div>
                    @endif
                </td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">{{ number_format($row['rate'], 2) }}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">{{ $row['in_qty'] > 0 ? number_format($row['in_qty'], 0) : '-' }}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">{{ $row['out_qty'] > 0 ? number_format($row['out_qty'], 0) : '-' }}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd; font-weight: bold;">{{ number_format($row['balance'], 0) }}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd; color: #666;">{{ number_format($row['cogs_rate'], 2) }}</td>
                <td style="padding: 5px; text-align: right; border: 1px solid #ddd;">{{ number_format($row['amount'], 2) }}</td>
                <td class="{{ $profitClass }}" style="padding: 5px; text-align: right; border: 1px solid #ddd; font-weight: bold;">
                    {{ $profitText }}
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
