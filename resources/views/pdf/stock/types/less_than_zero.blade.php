@extends('pdf.stock.layout')

@section('content')
@if(isset($is_excel) && $is_excel)
    <table>
        <tr>
            <td colspan="6" style="background-color: #fff1f2; color: #e11d48; text-align: center; font-weight: bold;">
                NEGATIVE INVENTORY AUDIT REPORT - CRITICAL: REQUIRED RECONCILIATION
            </td>
        </tr>
    </table>
@else
    <div style="background-color: #fff1f2; color: #e11d48; padding: 10px; border: 1px solid #fda4af; margin-bottom: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 900;">Negative Inventory Audit Report</h2>
        <p style="margin: 5px 0 0; font-size: 9px; font-weight: bold;">CRITICAL: The following items have stock levels below zero and require immediate reconciliation.</p>
    </div>
@endif

<table>
    <thead>
        <tr style="background-color: #e11d48; color: #ffffff;">
            <th style="width: 30px; color: #fff;">S.#</th>
            <th style="color: #fff;">Item Description</th>
            <th style="width: 70px; color: #fff;">Rate</th>
            <th style="width: 60px; color: #fff;">Packing</th>
            <th style="width: 80px; color: #fff;">Balance</th>
            <th style="width: 100px; color: #fff;">Audit Value</th>
        </tr>
    </thead>
    <tbody>
        @php
            $totalAuditValue = 0;
        @endphp
        @foreach($data as $idx => $row)
            @php
                $auditValue = abs($row['balance_qty']) * $row['rate'];
                $totalAuditValue += $auditValue;
            @endphp
            <tr>
                <td class="text-center">{{ $idx + 1 }}</td>
                <td>
                    @if(isset($is_excel) && $is_excel)
                        {{ $row['item_name'] }} - {{ $row['company_name'] }}
                    @else
                        <div class="bold uppercase">{{ $row['item_name'] }}</div>
                        <div style="font-size: 7px; color: #666;">{{ $row['company_name'] }}</div>
                    @endif
                </td>
                <td class="text-right">{{ number_format($row['rate'], 2) }}</td>
                <td class="text-center">{{ $row['packing_qty'] }}</td>
                <td class="text-right bold text-danger">{{ number_format($row['balance_qty'], 0) }}</td>
                <td class="text-right bold">{{ number_format($auditValue, 2) }}</td>
            </tr>
        @endforeach
    </tbody>
    <tfoot>
        <tr style="background-color: #f9fafb; font-weight: bold;">
            <td colspan="5" class="text-right" style="padding: 10px; font-size: 10px; color: #e11d48;">TOTAL NEGATIVE VALUATION (ABSOLUTE)</td>
            <td class="text-right" style="padding: 10px; font-size: 12px; color: #e11d48;">{{ number_format($totalAuditValue, 2) }}</td>
        </tr>
    </tfoot>
</table>
@endsection
