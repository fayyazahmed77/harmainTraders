@php
$logo_path = storage_path('app/public/img/favicon.png');
if (!file_exists($logo_path)) {
    $logo_path = public_path('storage/img/favicon.png');
}

$logo_base64 = "";
if (file_exists($logo_path)) {
    $logo_data = file_get_contents($logo_path);
    $logo_type = pathinfo($logo_path, PATHINFO_EXTENSION);
    $logo_base64 = 'data:image/' . $logo_type . ';base64,' . base64_encode($logo_data);
}
@endphp
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $report_title ?? 'SUMMARY REPORT' }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #fff;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 25px;
            padding: 20px;
            border-bottom: 1.5px solid #000;
        }

        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 5px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 12px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 9px;
            color: #334155;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 3px;
        }
        
        .report-title-container {
            margin-top: 10px;
        }
        .report-title {
            font-size: 14px;
            font-weight: bold;
            color: #000;
            display: inline-block;
            padding: 4px 25px;
            border: 1.5px solid #000;
            border-radius: 4px;
            text-transform: uppercase;
        }

        .criteria {
            margin-bottom: 15px;
            font-size: 11px;
            color: #334155;
            padding: 0 20px;
        }

        .container {
            padding: 0 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            padding: 8px 10px;
            border: 1.5px solid #94a3b8;
            text-align: center;
        }

        table td {
            padding: 7px 10px;
            border: 1px solid #94a3b8;
            color: #1e293b;
        }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            font-size: 9px;
            color: #475569;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }

        .summary-row {
            background-color: #cbd5e1;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="40" height="40">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Harmain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Wholesale & Supply Chain</div>
            </div>
        </div>
        
        <div class="report-title-container">
            <div class="report-title">{{ $report_title ?? 'SUMMARY REPORT' }}</div>
        </div>
    </div>

    <div class="criteria">
        <strong>CRITERIA :</strong> Dated As On {{ date('d-M-Y', strtotime($to_date)) }}
    </div>

    <div class="container">
        <table>
            <thead>
                <tr>
                    <th width="5%">S.#</th>
                    <th width="50%" style="text-align: left;">DESCRIPTION</th>
                    <th width="15%">Account Typed</th>
                    <th width="15%">DEBIT</th>
                    <th width="15%">CREDIT</th>
                </tr>
            </thead>
            <tbody>
                @php $totalDebit = 0; $totalCredit = 0; @endphp
                @foreach($data as $index => $row)
                    @php 
                        $totalDebit += $row['debit']; 
                        $totalCredit += $row['credit']; 
                    @endphp
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="font-bold">{{ strtoupper($row['title']) }}</td>
                        <td class="text-center">{{ $row['type_name'] }}</td>
                        <td class="text-right">{{ $row['debit'] > 0 ? number_format($row['debit'], 0) : '' }}</td>
                        <td class="text-right">{{ $row['credit'] > 0 ? number_format($row['credit'], 0) : '' }}</td>
                    </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr class="summary-row">
                    <td colspan="3" class="text-right" style="padding-right: 20px;">TOTAL SUMMARY</td>
                    <td class="text-right">{{ number_format($totalDebit, 0) }}</td>
                    <td class="text-right">{{ number_format($totalCredit, 0) }}</td>
                </tr>
            </tfoot>
        </table>
    </div>

    <div class="footer">
        <table style="width: 100%; border: none; margin: 0;">
            <tr>
                <td style="border: none; padding: 0;" width="33%">Printed on: {{ date('d-M-Y h:i A') }}</td>
                <td style="border: none; padding: 0;" width="34%" class="text-center">Software by AishTycoons (0300-2086828)</td>
                <td style="border: none; padding: 0;" width="33%" class="text-right">Page 1 of 1</td>
            </tr>
        </table>
    </div>

    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
