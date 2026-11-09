@php
    $filterParams = $params ?? request()->all();
    $criteriaList = [];

    // 1. Date (Cutoff / Range)
    $fromDateVal = $from_date ?? $filterParams['from'] ?? $filterParams['fromDate'] ?? $filterParams['from_date'] ?? null;
    $toDateVal = $to_date ?? $filterParams['to'] ?? $filterParams['toDate'] ?? $filterParams['to_date'] ?? null;

    if (!empty($fromDateVal) && !empty($toDateVal) && $fromDateVal !== $toDateVal) {
        $criteriaList[] = 'Dated ' . strtoupper(date('d-M-Y', strtotime($fromDateVal))) . ' To ' . strtoupper(date('d-M-Y', strtotime($toDateVal)));
    } elseif (!empty($toDateVal)) {
        $criteriaList[] = 'Dated As On ' . strtoupper(date('d-M-Y', strtotime($toDateVal)));
    }

    // 2. Company / Account (Only if selected and not ALL)
    if (!empty($account) && is_object($account) && isset($account->id) && $account->id) {
        $criteriaList[] = 'Company: ' . strtoupper($account->title);
    } else {
        $accIdVal = $filterParams['account_id'] ?? $filterParams['accountId'] ?? $filterParams['customerId'] ?? $filterParams['customer_id'] ?? $filterParams['supplierId'] ?? $filterParams['supplier_id'] ?? null;
        if (!empty($accIdVal) && $accIdVal !== 'ALL') {
            $accObj = \App\Models\Account::find($accIdVal);
            if ($accObj) {
                $criteriaList[] = 'Company: ' . strtoupper($accObj->title);
            }
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
    $remarks = trim($filterParams['remarks'] ?? $filterParams['search'] ?? '');
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

@if(!empty($criteriaList))
<div class="criteria-text text-left" style="font-size: 10px; margin-bottom: 15px; font-weight: bold; line-height: 1.4; text-align: left;">
    CRITERIA : {{ implode(' | ', $criteriaList) }}
</div>
@endif

