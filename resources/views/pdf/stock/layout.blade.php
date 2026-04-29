@if(isset($is_excel) && $is_excel)
    <table>
        <tr>
            <td colspan="10" style="font-size: 18pt; font-weight: bold; color: #059669;">Harmain Traders</td>
        </tr>
        <tr>
            <td colspan="10" style="font-size: 14pt; font-weight: bold;">{{ $title }}</td>
        </tr>
        <tr>
            <td colspan="10" style="font-size: 10pt; color: #666;">
                VALUATION: {{ strtoupper(str_replace('_', ' ', $valuation)) }} | 
                PERIOD: {{ $fromDate }} TO {{ $toDate }}
            </td>
        </tr>
    </table>
    @yield('content')
@else
<!DOCTYPE html>
<html>
<head>
    <title>Stock Report - Harmain Traders</title>
    <style>
        @page { margin: 20px; }
        body { font-family: 'Helvetica', sans-serif; font-size: 10px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #059669; padding-bottom: 10px; }
        .company-name { font-size: 24px; font-weight: bold; color: #059669; text-transform: uppercase; letter-spacing: -1px; }
        .report-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-top: 5px; color: #1f2937; }
        .criteria { font-size: 8px; color: #666; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 6px; font-weight: bold; text-transform: uppercase; font-size: 8px; }
        td { border: 1px solid #e5e7eb; padding: 5px; vertical-align: middle; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .bold { font-weight: bold; }
        .text-success { color: #059669; }
        .text-danger { color: #e11d48; }
        .footer { position: fixed; bottom: 0; width: 100%; font-size: 8px; color: #999; text-align: center; padding-top: 10px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Harmain Traders</div>
        <div class="report-title">{{ $title }}</div>
        <div class="criteria">
            VALUATION: {{ strtoupper(str_replace('_', ' ', $valuation)) }} | 
            PERIOD: {{ $fromDate }} TO {{ $toDate }}
        </div>
    </div>

    <div class="content">
        @yield('content')
    </div>

    <div class="footer">
        Generated on {{ date('d M Y H:i:s') }} | Stock Analysis Engine v1.0
    </div>
</body>
</html>
@endif
