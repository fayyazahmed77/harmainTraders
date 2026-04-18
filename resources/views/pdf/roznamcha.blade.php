@php
$logo_path = public_path('storage/img/favicon.png');
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
    <title>Roznamcha Report</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 0; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0f172a; }
        .brand-name { font-size: 24px; font-weight: bold; color: #0f172a; text-transform: uppercase;}
        .report-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #334155; margin-top: 5px; }
        
        .t-account-container { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .t-account-container td { vertical-align: top; width: 50%; padding: 0 15px; }
        
        .side-title { font-size: 11px; font-weight: bold; color: #0f172a; margin-bottom: 10px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; text-transform: uppercase;}
        
        table.data-table { width: 100%; border-collapse: collapse; }
        table.data-table td { padding: 8px 0; font-size: 10px; color: #0f172a; font-weight: bold;}
        .amount-col { text-align: right; }
        
        .total-row { border-top: 1px solid #1e293b; border-bottom: 3px double #1e293b; }
        .total-row td { padding: 10px 0; font-weight: bold; font-size: 11px; }

        .footer-summary { margin-top: 30px; text-align: center; }
        .cash-in-hand-label { font-size: 11px; font-weight: bold; color: #0f172a; text-transform: uppercase; margin-right: 20px;}
        .cash-in-hand-value { font-size: 12px; font-weight: bold; color: #0f172a; }
        .cheque-note { font-size: 9px; font-weight: bold; color: #475569; margin-top: 15px; }
        
        /* Removed .divider class in favor of direct border on the left column */
    </style>
</head>
<body>
    <div class="header text-center">
        @if($logo_base64)
            <img src="{{ $logo_base64 }}" alt="Logo" style="height: 50px; margin-bottom: 10px;">
        @endif
        <div class="brand-name">Harmain Traders</div>
        <div class="report-title">SUMMARY FOR THE PERIOD ENDED {{ strtoupper(date('d-M-Y', strtotime($to_date))) }}</div>
    </div>

    <table class="t-account-container">
        <tr>
            <!-- INFLOWS (Left) -->
            <td style="border-right: 1px solid #0f172a; padding-right: 20px;">
                <table class="data-table">
                    <tr>
                        <td>Cash Opening</td>
                        <td class="amount-col">{{ number_format($data['inflows']['cash_opening']) }}</td>
                    </tr>
                    <tr>
                        <td>Cash Sale</td>
                        <td class="amount-col">{{ number_format($data['inflows']['cash_sale']) }}</td>
                    </tr>
                    <tr>
                        <td>Cash Received On Credit Sale</td>
                        <td class="amount-col">{{ number_format($data['inflows']['cash_received_credit_sale']) }}</td>
                    </tr>
                    <tr>
                        <td>Cheque Received On Credit Sale</td>
                        <td class="amount-col">{{ number_format($data['inflows']['cheque_received_credit_sale']) }}</td>
                    </tr>
                    <tr>
                        <td>Drawing</td>
                        <td class="amount-col">{{ number_format($data['inflows']['drawing']) }}</td>
                    </tr>
                    <tr>
                        <td>Loan Received</td>
                        <td class="amount-col">{{ number_format($data['inflows']['loan_received']) }}</td>
                    </tr>
                    <!-- Spacing to align with right side -->
                    <tr><td colspan="2" style="height: 20px;"></td></tr>
                    <tr class="total-row">
                        <td>Total Cash Received</td>
                        <td class="amount-col">{{ number_format($data['inflows']['total_cash_received']) }}</td>
                    </tr>
                </table>
            </td>
            
            <!-- OUTFLOWS (Right) -->
            <td style="padding-left: 20px;">
                <table class="data-table">
                    <tr>
                        <td>Cash Purchase</td>
                        <td class="amount-col">{{ number_format($data['outflows']['cash_purchase']) }}</td>
                    </tr>
                    <tr>
                        <td>Total Expense</td>
                        <td class="amount-col">{{ number_format($data['outflows']['total_expense']) }}</td>
                    </tr>
                    <tr>
                        <td>Cash Paid On Credit Purchase</td>
                        <td class="amount-col">{{ number_format($data['outflows']['cash_paid_credit_purchase']) }}</td>
                    </tr>
                    <tr>
                        <td>Cheque Paid On Credit Purchase</td>
                        <td class="amount-col">{{ number_format($data['outflows']['cheque_paid_credit_purchase']) }}</td>
                    </tr>
                    <tr>
                        <td>Deposits</td>
                        <td class="amount-col">{{ number_format($data['outflows']['deposits']) }}</td>
                    </tr>
                    <tr>
                        <td>Loan Paid</td>
                        <td class="amount-col">{{ number_format($data['outflows']['loan_paid']) }}</td>
                    </tr>
                    <!-- Spacing to align with left side -->
                    <tr><td colspan="2" style="height: 20px;"></td></tr>
                    <tr class="total-row">
                        <td>Total Payment</td>
                        <td class="amount-col">{{ number_format($data['outflows']['total_payment']) }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer-summary">
        <span class="cash-in-hand-label">Cash In Hand</span>
        <span class="cash-in-hand-value">{{ number_format($data['cash_in_hand']) }}</span>
        
        <div class="cheque-note">Cheque Not Include</div>
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
