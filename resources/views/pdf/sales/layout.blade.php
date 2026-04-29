@if(!isset($isExcel))
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sales Analysis - Harmain Traders</title>
    <style>
        @page { margin: 15px; }
        body { font-family: 'Helvetica', sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
        .header { padding: 10px 15px; border-bottom: 2px solid #000; margin-bottom: 10px; }
        .brand-name { font-size: 24px; font-weight: 900; color: #000; margin: 0; }
        .container { padding: 5px 15px; }
        table { width: 100%; border-collapse: collapse; margin-top: 5px; }
        th { border: 1px solid #000; color: #000; padding: 6px 4px; text-align: left; font-weight: 900; text-transform: uppercase; font-size: 7px; background: transparent; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .footer { position: fixed; bottom: 10px; width: 100%; text-align: center; font-size: 7px; color: #64748b; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <table style="border: none; margin: 0; width: 100%;">
            <tr>
                <td style="border: none; width: 50px; vertical-align: top;">
                    @if($logo_base64)
                        <img src="{{ $logo_base64 }}" width="45" height="45">
                    @endif
                </td>
                <td style="border: none; vertical-align: top;">
                    <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                    <div class="brand-name" style="color:#000; font-size: 14px;">Wholesale & Supply Chain</div>
                </td>
                <td style="border: none; text-align: right; vertical-align: top;">
                    <div style="font-size: 8px; color: #64748b; font-weight: 900;">PERIOD</div>
                    <div style="font-size: 10px; font-weight: 900;">
                        {{ date('d M Y', strtotime($params['fromDate'])) }} — {{ date('d M Y', strtotime($params['toDate'])) }}
                    </div>
                </td>
            </tr>
        </table>    
    </div>

    <div style="text-align: center; margin: 5px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
        <div style="font-size: 14px; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 1px;">
            {{ $title }}
        </div>
    </div>
@else
    <!-- Excel Header -->
    <table>
        <tr>
            <td colspan="5" style="font-size: 18px; font-weight: bold; text-align: center;">HARMAIN TRADERS</td>
        </tr>
        <tr>
            <td colspan="5" style="font-size: 14px; font-weight: bold; text-align: center;">{{ strtoupper($title) }}</td>
        </tr>
        <tr>
            <td colspan="5" style="text-align: center;">
                PERIOD: {{ date('d M Y', strtotime($params['fromDate'])) }} — {{ date('d M Y', strtotime($params['toDate'])) }}
            </td>
        </tr>
    </table>
@endif

    <div class="container">
        @yield('content')
    </div>

    @if(!isset($isExcel))
    <div class="footer">
        GENERATE AT: {{ date('d M Y H:i:s') }} | HARMAIN TRADERS PLATFORM
    </div>
</body>
</html>
@endif
