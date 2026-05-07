@extends('pdf.sales.layout')

@section('content')
<table style="border: 1px solid #000;">
    <thead>
        <tr>
            <th style="width: 25px; border: 1px solid #000;">S#</th>
            <th style="border: 1px solid #000;">Item Description</th>
            <th style="width: 35px; border: 1px solid #000;" class="text-center">Pack</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">Full</th>
            <th style="width: 30px; border: 1px solid #000;" class="text-center">Pcs</th>
            <th style="width: 55px; border: 1px solid #000;" class="text-right">Gross</th>
            <th style="width: 45px; border: 1px solid #000;" class="text-right">Disc</th>
            <th style="width: 70px; border: 1px solid #000;" class="text-right">Net Amount</th>
        </tr>
    </thead>
    <tbody>
        @foreach($data as $idx => $row)
            <tr>
                <td style="font-size: 7px; text-align: center; border: 0.5px solid #eee;">{{ $idx + 1 }}</td>
                <td style="font-size: 8px; font-weight: bold; text-transform: uppercase; padding: 3px; border: 0.5px solid #eee;">{{ $row['item_description'] }}</td>
                <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ $row['packing'] }}</td>
                <td style="font-size: 8px; font-weight: bold; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_full'] }}</td>
                <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ (int)$row['qty_pcs'] }}</td>
                <td style="font-size: 8px; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['gross_amount'], 1) }}</td>
                <td style="font-size: 8px; text-align: right; color: #666; border: 0.5px solid #eee;">{{ number_format($row['disc_amt'], 1) }}</td>
                <td style="font-size: 8px; font-weight: 900; text-align: right; border: 0.5px solid #eee;">{{ number_format($row['net_amount'], 2) }}</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="border-top: 2px solid #000; font-weight: 900;">
            <td colspan="3" class="text-right uppercase" style="font-size: 8px; padding: 6px;">Total Period Summary</td>
            <td style="text-align: center; border: 0.5px solid #eee;">{{ (int)collect($data)->sum('qty_full') }}</td>
            <td style="text-align: center; border: 0.5px solid #eee;">{{ (int)collect($data)->sum('qty_pcs') }}</td>
            <td style="text-align: right; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('gross_amount'), 2) }}</td>
            <td style="text-align: right; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('disc_amt'), 2) }}</td>
            <td style="text-align: right; font-size: 10px; border: 0.5px solid #eee;">{{ number_format(collect($data)->sum('net_amount'), 2) }}</td>
        </tr>
    </tfoot>
</table>

@php
    $historyRow = collect($data)->first(function($row) {
        return isset($row['history']) && count($row['history']) > 0;
    });
    $historyData = $historyRow ? $historyRow['history'] : null;
@endphp

@if($historyData)
    <div style="margin-top: 30px; page-break-before: auto;">
        <div style="border-left: 3px solid #4f46e5; padding-left: 10px; margin-bottom: 10px;">
            <h3 style="margin: 0; text-transform: uppercase; font-style: italic; font-size: 11px;">Sales <span style="color: #4f46e5;">History</span></h3>
            <p style="margin: 0; font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Detailed transaction log for selected item</p>
        </div>

        <table style="border: 1px solid #000; width: 100%;">
            <thead>
                <tr style="background-color: #f3f4f6;">
                    <th style="width: 60px; border: 1px solid #000; font-size: 8px;">Inv.#</th>
                    <th style="width: 60px; border: 1px solid #000; font-size: 8px;">Date</th>
                    <th style="border: 1px solid #000; font-size: 8px;">Customer Name</th>
                    <th style="width: 40px; border: 1px solid #000; font-size: 8px;" class="text-center">Full</th>
                    <th style="width: 40px; border: 1px solid #000; font-size: 8px;" class="text-center">Pcs</th>
                    <th style="width: 60px; border: 1px solid #000; font-size: 8px;" class="text-right">Rate</th>
                    <th style="width: 80px; border: 1px solid #000; font-size: 8px;" class="text-right">Net Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($historyData as $h)
                    <tr>
                        <td style="font-size: 8px; font-weight: bold; color: #4f46e5; border: 0.5px solid #eee; padding: 4px;">{{ $h['invoice'] }}</td>
                        <td style="font-size: 8px; border: 0.5px solid #eee; padding: 4px;">{{ $h['date'] }}</td>
                        <td style="font-size: 8px; text-transform: uppercase; border: 0.5px solid #eee; padding: 4px;">{{ $h['customer_name'] }}</td>
                        <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee; padding: 4px;">{{ (int)$h['qty_full'] }}</td>
                        <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee; padding: 4px;">{{ (int)$h['qty_pcs'] }}</td>
                        <td style="font-size: 8px; text-align: right; border: 0.5px solid #eee; padding: 4px;">{{ number_format($h['tp'], 1) }}</td>
                        <td style="font-size: 8px; font-weight: bold; text-align: right; border: 0.5px solid #eee; padding: 4px;">{{ number_format($h['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td colspan="3" style="font-size: 8px; text-align: right; padding: 6px;">Sub-Total Transactions</td>
                    <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ (int)collect($historyData)->sum('qty_full') }}</td>
                    <td style="font-size: 8px; text-align: center; border: 0.5px solid #eee;">{{ (int)collect($historyData)->sum('qty_pcs') }}</td>
                    <td style="border: 0.5px solid #eee;"></td>
                    <td style="font-size: 9px; text-align: right; border: 0.5px solid #eee; color: #4f46e5;">{{ number_format(collect($historyData)->sum('amount'), 2) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>
@endif
@endsection
