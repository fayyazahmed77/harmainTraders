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
    <title>Due Bills Report</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #000;
            margin: 0;
            padding: 0;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        
        .header {
            margin-bottom: 20px;
        }
        .report-title {
            font-size: 13px;
            margin-bottom: 10px;
            font-weight: bold;
        }

        /* Logo Styles */
        .logo-section {
            display: inline-block;
            margin-bottom: 5px;
        }
        .logo-icon {
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }
        .brand-text {
            display: inline-block;
            vertical-align: middle;
            text-align: left;
        }
        .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #444;
            line-height: 1;
        }
        .brand-tagline {
            font-size: 9px;
            color: #888;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-top: 2px;
        }
        
        .criteria-text {
            font-size: 10.5px;
            margin-bottom: 20px;
            font-weight: bold;
            line-height: 1.4;
        }
        
        table.ledger {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            border: 1px solid #000;
        }
        table.ledger th, table.ledger td {
            border: 1px solid #000;
            padding: 3px 5px;
        }
        table.ledger th {
            background-color: #f0f0f0; /* Light gray to match image exactly */
            font-weight: bold;
            text-align: center;
        }
        
        table.summary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
        }
        table.summary-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-weight: bold;
        }
        table.summary-table .label {
            text-align: left;
            background-color: #fff;
        }
        table.summary-table .value {
            text-align: right;
        }

        table.total-table {
            width: 70%;  /* Not full width for absolute totals based on reference */
            border-collapse: collapse;
            margin-top: 5px;
            border: 1px solid #000;
        }
        table.total-table td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-weight: bold;
        }

        .party-group {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }

        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
    </style>
</head>
<body>

    @php
       $globalUnDue = 0;
       $globalDue = 0;
       
       // Re-group data by customer_id and ensure parties and bills with 0 balance are excluded
       $groupedData = collect($data)
           ->filter(function($row) {
               return round((float)($row['remaining'] ?? 0)) > 0 || round((float)($row['balance'] ?? 0)) > 0;
           })
           ->groupBy('customer_id')
           ->filter(function($bills) {
               $lastBill = $bills->last();
               $summary = $lastBill['party_summary'] ?? [];
               $totalDue = round((float)($summary['party_due_amount'] ?? 0)) + round((float)($summary['party_un_due_amount'] ?? 0));
               return $totalDue > 0;
           });

       if (!function_exists('formatNum')) {
           function formatNum($num) {
               if ($num == 0 || $num == null) return '';
               return number_format($num);
           }
       }
    @endphp

    <div class="header text-center">
        <div class="logo-section">
            <div class="logo-icon">
                @if($logo_base64)
                    <img src="{{ $logo_base64 }}" width="35" height="35">
                @endif
            </div>
            <div class="brand-text">
                <div class="brand-name">Haramain <span style="color:#000">Traders</span></div>
                <div class="brand-tagline">Wholesale <span style="color:#000">&</span> Supply Chain</div>
            </div>
        </div>
        
        <div style="width: 100%; margin-top: 5px;">
            <div class="report-title" style="border-top: 1px dashed #000; display: inline-block; padding: 5px 30px;">COMPANY WISE DUE BILL REPORT</div>
        </div>

        @php
            $filterParams = $params ?? request()->all();
            $criteriaList = [];

            // 1. Date (Cutoff / Range)
            if (!empty($from_date) && !empty($to_date) && $from_date !== $to_date) {
                $criteriaList[] = 'Dated ' . strtoupper(date('d-M-Y', strtotime($from_date))) . ' To ' . strtoupper(date('d-M-Y', strtotime($to_date)));
            } elseif (!empty($to_date)) {
                $criteriaList[] = 'Dated As On ' . strtoupper(date('d-M-Y', strtotime($to_date)));
            } elseif (!empty($filterParams['to'])) {
                $criteriaList[] = 'Dated As On ' . strtoupper(date('d-M-Y', strtotime($filterParams['to'])));
            }

            // 2. Company / Account (Only if selected and not ALL)
            if (!empty($account) && $account->id) {
                $criteriaList[] = 'Company: ' . strtoupper($account->title);
            } elseif (!empty($filterParams['account_id']) && $filterParams['account_id'] !== 'ALL') {
                $acc = \App\Models\Account::find($filterParams['account_id']);
                if ($acc) {
                    $criteriaList[] = 'Company: ' . strtoupper($acc->title);
                }
            }

            // 3. Firm (Only if selected and not ALL)
            $fId = $filterParams['firmId'] ?? $filterParams['firm_id'] ?? null;
            if (!empty($fId) && $fId !== 'ALL') {
                $firmObj = \App\Models\Firm::find($fId);
                if ($firmObj) {
                    $criteriaList[] = 'Firm: ' . strtoupper($firmObj->name);
                }
            }

            // 4. Salesman (Only if selected and not ALL)
            $sId = $filterParams['salemanId'] ?? $filterParams['saleman_id'] ?? $filterParams['salesman_id'] ?? null;
            if (!empty($sId) && $sId !== 'ALL') {
                $salesmanObj = \App\Models\Saleman::find($sId);
                if ($salesmanObj) {
                    $criteriaList[] = 'Salesman: ' . strtoupper($salesmanObj->name);
                }
            }

            // 5. Province (Only if selected and not ALL)
            $pId = $filterParams['provinceId'] ?? $filterParams['province_id'] ?? null;
            if (!empty($pId) && $pId !== 'ALL') {
                $provinceObj = \App\Models\Province::find($pId);
                if ($provinceObj) {
                    $criteriaList[] = 'Province: ' . strtoupper($provinceObj->name);
                }
            }

            // 6. City (Only if selected and not ALL)
            $cId = $filterParams['cityId'] ?? $filterParams['city_id'] ?? null;
            if (!empty($cId) && $cId !== 'ALL') {
                $cityObj = \App\Models\City::find($cId);
                if ($cityObj) {
                    $criteriaList[] = 'City: ' . strtoupper($cityObj->name);
                }
            }

            // 7. Area (Only if selected and not ALL)
            $aId = $filterParams['areaId'] ?? $filterParams['area_id'] ?? null;
            if (!empty($aId) && $aId !== 'ALL') {
                $areaObj = \App\Models\Areas::find($aId);
                if ($areaObj) {
                    $criteriaList[] = 'Area: ' . strtoupper($areaObj->name);
                }
            }

            // 8. Sub Area (Only if selected and not ALL)
            $subId = $filterParams['subareaId'] ?? $filterParams['subarea_id'] ?? null;
            if (!empty($subId) && $subId !== 'ALL') {
                $subareaObj = \App\Models\Subarea::find($subId);
                if ($subareaObj) {
                    $criteriaList[] = 'Sub Area: ' . strtoupper($subareaObj->name);
                }
            }

            // 9. Account Type (Only if selected and not ALL)
            $typeId = $filterParams['type'] ?? $filterParams['account_type'] ?? null;
            if (!empty($typeId) && $typeId !== 'ALL') {
                if (is_numeric($typeId)) {
                    $typeObj = \App\Models\AccountType::find($typeId);
                    $typeName = $typeObj ? $typeObj->name : $typeId;
                } else {
                    $typeName = $typeId;
                }
                $criteriaList[] = 'Acc Type: ' . strtoupper($typeName);
            }

            // 10. Category (Only if selected and not ALL)
            $catId = $filterParams['noteHead'] ?? $filterParams['note_head'] ?? null;
            if (!empty($catId) && $catId !== 'ALL') {
                if (is_numeric($catId)) {
                    $catObj = \App\Models\AccountCategory::find($catId);
                    $catName = $catObj ? $catObj->name : $catId;
                } else {
                    $catName = $catId;
                }
                $criteriaList[] = 'Category: ' . strtoupper($catName);
            }

            // 11. Nature (Only if selected and not ALL)
            $natureId = $filterParams['nature'] ?? null;
            if (!empty($natureId) && $natureId !== 'ALL') {
                if (is_numeric($natureId)) {
                    $natObj = \App\Models\AccountCategory::find($natureId);
                    $natName = $natObj ? $natObj->name : $natureId;
                } else {
                    $natName = $natureId;
                }
                $criteriaList[] = 'Nature: ' . strtoupper($natName);
            }

            // 12. Contra (Only if selected and not ALL)
            $contraId = $filterParams['contraId'] ?? $filterParams['contra_id'] ?? null;
            if (!empty($contraId) && $contraId !== 'ALL') {
                $contraObj = \App\Models\Account::find($contraId);
                if ($contraObj) {
                    $criteriaList[] = 'Contra: ' . strtoupper($contraObj->title);
                }
            }

            // 13. Search Meta (Only if filled)
            $remarks = trim($filterParams['remarks'] ?? '');
            if ($remarks !== '') {
                $criteriaList[] = 'Search: "' . $remarks . '"';
            }

            // 14. Sort By (Only if specified and not default INV_DATE)
            $sortBy = $filterParams['sortBy'] ?? null;
            if (!empty($sortBy) && $sortBy !== 'INV_DATE' && $sortBy !== 'ALL') {
                $criteriaList[] = 'Sort By: ' . strtoupper($sortBy);
            }

            // 15. Ledger Logic (Only if specified and cleardate)
            $dateType = $filterParams['dateType'] ?? null;
            if (!empty($dateType) && $dateType === 'cleardate') {
                $criteriaList[] = 'Logic: BY CLEARING';
            }
        @endphp

        <div class="criteria-text text-left">
            CRITERIA : {{ implode(' | ', $criteriaList) }}
        </div>
    </div>

    @foreach($groupedData as $customerId => $bills)
        @php
            $lastBill = collect($bills)->last();
            $summary = $lastBill['party_summary'] ?? ['party_un_due_amount' => 0, 'party_due_amount' => 0, 'credit_days' => 0, 'credit_limit' => 0];
            $partyName = $lastBill['party_name'] ?? 'Unknown';
            
            $globalUnDue += $summary['party_un_due_amount'];
            $globalDue += $summary['party_due_amount'];
        @endphp

        <div class="party-group">
            <table class="ledger">
                <thead>
                    <tr>
                        <th width="9%">Date</th>
                        <th width="8%">Voucher #</th>
                        <th width="24%">Party Name</th>
                        <th width="7%">Status</th>
                        <th width="9%">Due Date</th>
                        <th width="5%">Days</th>
                        <th width="10%">Opening Balance</th>
                        <th width="9%">Bill Amt</th>
                        <th width="9%">Paid</th>
                        <th width="10%">Remaining</th>
                        <th width="10%">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($bills as $bill)
                    @php
                        $statusType = $bill['type'] ?? 'CREDIT';
                        $statusColor = $statusType === 'CASH' ? '#059669' : ($statusType === 'RETURN' ? '#dc2626' : ($statusType === 'OPENING' ? '#d97706' : ($statusType === 'PAYABLE' ? '#7c3aed' : '#2563eb')));
                    @endphp
                    <tr>
                        <td class="text-center">{{ strtoupper(date('d-M-y', strtotime($bill['date']))) }}</td>
                        <td class="text-center">{{ $bill['voucher_no'] }}</td>
                        <td>{{ $bill['party_name'] }}</td>
                        @if($statusType === 'CASH')
                            <td class="text-center" style="font-weight: bold; color: #059669;">CASH</td>
                        @elseif($statusType === 'RETURN')
                            <td class="text-center" style="font-weight: bold; color: #dc2626;">RETURN</td>
                        @elseif($statusType === 'OPENING')
                            <td class="text-center" style="font-weight: bold; color: #d97706;">OPENING</td>
                        @elseif($statusType === 'PAYABLE')
                            <td class="text-center" style="font-weight: bold; color: #7c3aed;">PAYABLE</td>
                        @else
                            <td class="text-center" style="font-weight: bold; color: #2563eb;">CREDIT</td>
                        @endif
                        <td class="text-center">{{ strtoupper(date('d-M-y', strtotime($bill['due_date']))) }}</td>
                        <td class="text-center">{{ $bill['days'] }}</td>
                        <td class="text-right">{{ !empty($bill['is_opening_balance']) ? (formatNum($bill['bill_amt']) . (($bill['opening_balance_type'] ?? '') === 'CR' ? ' CR' : '')) : '—' }}</td>
                        <td class="text-right">{{ formatNum($bill['bill_amt']) }}</td>
                        <td class="text-right">{{ formatNum($bill['paid']) }}</td>
                        <td class="text-right">{{ formatNum($bill['remaining']) }}</td>
                        <td class="text-right">{{ formatNum($bill['balance']) }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>

            <table class="summary-table">
                <tr>
                    <td width="20%" class="text-center">Party Un Due Amount</td>
                    <td width="15%" class="text-center">{{ formatNum($summary['party_un_due_amount']) }}</td>
                    <td width="15%" class="text-center">Due Amount</td>
                    <td width="15%" class="text-center">{{ formatNum($summary['party_due_amount']) }}</td>
                    <td width="10%" class="text-right">Credit Days</td>
                    <td width="5%" class="text-right">{{ $summary['credit_days'] }}</td>
                    <td width="10%" class="text-right">Credit Limit</td>
                    <td width="10%" class="text-right">{{ $summary['credit_limit'] > 0 ? number_format($summary['credit_limit']) : '**********' }}</td>
                </tr>
            </table>
        </div>
    @endforeach

    @if(count($groupedData) > 0)
    <!-- Global Totals matching reference image spacing precisely -->
    <table class="total-table">
        <tr>
            <td width="30%" class="text-center">Total Un Due Amount</td>
            <td width="20%" class="text-center">{{ formatNum($globalUnDue) }}</td>
            <td width="20%" class="text-center">Due Amount</td>
            <td width="30%" class="text-center">{{ formatNum($globalDue) }}</td>
        </tr>
    </table>
    @else
    <p class="text-center" style="margin-top: 50px;">No Due Bills Found.</p>
    @endif

    @if(isset($is_print_mode) && $is_print_mode)
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
    @endif
</body>
</html>
