<?php

namespace App\Services;

use App\Models\Account;
use App\Models\AccountType;
use App\Models\AccountCategory;
use App\Models\Saleman;
use App\Models\Booker;
use App\Models\Country;
use App\Models\Province;
use App\Models\City;
use App\Models\Areas;
use App\Models\Subarea;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class AccountBulkUploadService
{
    /**
     * Parse and preview an uploaded Excel/CSV file.
     * Returns an array with summary metrics and row-by-row validation states.
     */
    public function preview(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        if (empty($rows) || count($rows) < 2) {
            return [
                'total_rows' => 0,
                'valid_count' => 0,
                'error_count' => 0,
                'rows' => [],
                'file_error' => 'The uploaded file is empty or missing data rows.',
            ];
        }

        // Extract raw header row
        $rawHeaders = array_shift($rows);
        $headers = array_map(function ($h) {
            $h = strtolower(trim((string)$h));
            $h = str_replace(['*', '(', ')', '%', '#'], '', $h);
            $h = preg_replace('/\s+/', '_', $h);
            return $h;
        }, $rawHeaders);

        $headerMap = $this->resolveHeaderMapping($headers);

        // Pre-fetch reference dictionaries
        $typesByName = AccountType::all()->keyBy(fn($t) => strtolower(trim($t->name)));
        $typesById = AccountType::all()->keyBy('id');

        $categoriesByName = AccountCategory::all()->keyBy(fn($c) => strtolower(trim($c->name)));
        $categoriesById = AccountCategory::all()->keyBy('id');

        $salemenByName = Saleman::all()->keyBy(fn($s) => strtolower(trim($s->name)));
        $salemenById = Saleman::all()->keyBy('id');
        $defaultSaleman = Saleman::where('defult', true)->orWhere('defult', 1)->first() ?? Saleman::first();

        $bookersByName = Booker::all()->keyBy(fn($b) => strtolower(trim($b->name)));
        $bookersById = Booker::all()->keyBy('id');

        $countriesByName = Country::all()->keyBy(fn($c) => strtolower(trim($c->name)));
        $provincesByName = Province::all()->keyBy(fn($p) => strtolower(trim($p->name)));
        $citiesByName = City::all()->keyBy(fn($c) => strtolower(trim($c->name)));
        $areasByName = Areas::all()->keyBy(fn($a) => strtolower(trim($a->name)));
        $subareasByName = Subarea::all()->keyBy(fn($s) => strtolower(trim($s->name)));

        $existingTitles = Account::pluck('title')
            ->map(fn($t) => strtolower(trim($t)))
            ->flip()
            ->toArray();

        $typeCodeCounters = [];
        $seenTitlesInBatch = [];

        $parsedRows = [];
        $validCount = 0;
        $errorCount = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;

            // Check if empty row
            $isEmpty = true;
            foreach ($row as $cell) {
                if ($cell !== null && trim((string)$cell) !== '') {
                    $isEmpty = false;
                    break;
                }
            }
            if ($isEmpty) continue;

            $title = $this->getValue($row, $headerMap, 'title');
            $code = $this->getValue($row, $headerMap, 'code');
            $typeNameVal = $this->getValue($row, $headerMap, 'type_name');
            $catNameVal = $this->getValue($row, $headerMap, 'category_name');
            $openingBalVal = $this->getValue($row, $headerMap, 'opening_balance', '0');
            $creditLimitVal = $this->getValue($row, $headerMap, 'credit_limit');
            $agingDaysVal = $this->getValue($row, $headerMap, 'aging_days', '0');
            $itemCategoryVal = $this->getValue($row, $headerMap, 'item_category');

            $salemanVal = $this->getValue($row, $headerMap, 'saleman_name');
            $bookerVal = $this->getValue($row, $headerMap, 'booker_name');

            $countryVal = $this->getValue($row, $headerMap, 'country');
            $provinceVal = $this->getValue($row, $headerMap, 'province');
            $cityVal = $this->getValue($row, $headerMap, 'city');
            $areaVal = $this->getValue($row, $headerMap, 'area');
            $subareaVal = $this->getValue($row, $headerMap, 'subarea');

            $address1 = $this->getValue($row, $headerMap, 'address1');
            $address2 = $this->getValue($row, $headerMap, 'address2');
            $mobile = $this->getValue($row, $headerMap, 'mobile');
            $telephone1 = $this->getValue($row, $headerMap, 'telephone1');
            $telephone2 = $this->getValue($row, $headerMap, 'telephone2');
            $fax = $this->getValue($row, $headerMap, 'fax');
            $gst = $this->getValue($row, $headerMap, 'gst');
            $ntn = $this->getValue($row, $headerMap, 'ntn');
            $cnic = $this->getValue($row, $headerMap, 'cnic');

            $openingDate = $this->getValue($row, $headerMap, 'opening_date', now()->toDateString());
            $fbrDate = $this->getValue($row, $headerMap, 'fbr_date');
            $noteHead = $this->getValue($row, $headerMap, 'note_head');
            $remarks = $this->getValue($row, $headerMap, 'remarks');
            $regards = $this->getValue($row, $headerMap, 'regards');

            $atsPercentVal = $this->getValue($row, $headerMap, 'ats_percentage');
            $atsType = $this->getValue($row, $headerMap, 'ats_type');

            $purchaseVal = $this->getValue($row, $headerMap, 'purchase');
            $cashbankVal = $this->getValue($row, $headerMap, 'cashbank');
            $saleVal = $this->getValue($row, $headerMap, 'sale');
            $statusVal = $this->getValue($row, $headerMap, 'status', '1');

            $errors = [];
            $typeId = null;
            $typeName = $typeNameVal;
            $categoryId = null;
            $categoryName = $catNameVal;
            $salemanId = null;
            $salemanName = $salemanVal;
            $bookerId = null;
            $bookerName = $bookerVal;

            // 1. Title Validation
            if (empty($title)) {
                $errors[] = 'Account Title is required.';
            } else {
                $lowerTitle = strtolower($title);
                if (isset($existingTitles[$lowerTitle])) {
                    $errors[] = "Account name '{$title}' already exists in database.";
                } elseif (isset($seenTitlesInBatch[$lowerTitle])) {
                    $errors[] = "Duplicate account title '{$title}' found in this file.";
                } else {
                    $seenTitlesInBatch[$lowerTitle] = true;
                }
            }

            // 2. Account Type Validation
            if (empty($typeNameVal)) {
                $errors[] = 'Account Type is required.';
            } else {
                $lowerType = strtolower($typeNameVal);
                if (isset($typesByName[$lowerType])) {
                    $typeObj = $typesByName[$lowerType];
                    $typeId = $typeObj->id;
                    $typeName = $typeObj->name;
                } elseif (is_numeric($typeNameVal) && isset($typesById[(int)$typeNameVal])) {
                    $typeObj = $typesById[(int)$typeNameVal];
                    $typeId = $typeObj->id;
                    $typeName = $typeObj->name;
                } else {
                    $errors[] = "Account Type '{$typeNameVal}' not found in database.";
                }
            }

            // 3. Category Resolution
            if (!empty($catNameVal)) {
                $lowerCat = strtolower($catNameVal);
                if (isset($categoriesByName[$lowerCat])) {
                    $catObj = $categoriesByName[$lowerCat];
                    $categoryId = $catObj->id;
                    $categoryName = $catObj->name;
                } elseif (is_numeric($catNameVal) && isset($categoriesById[(int)$catNameVal])) {
                    $catObj = $categoriesById[(int)$catNameVal];
                    $categoryId = $catObj->id;
                    $categoryName = $catObj->name;
                }
            }

            // 4. Salesman Resolution
            if (!empty($salemanVal)) {
                $lowerSal = strtolower($salemanVal);
                if (isset($salemenByName[$lowerSal])) {
                    $salObj = $salemenByName[$lowerSal];
                    $salemanId = $salObj->id;
                    $salemanName = $salObj->name;
                } elseif (is_numeric($salemanVal) && isset($salemenById[(int)$salemanVal])) {
                    $salObj = $salemenById[(int)$salemanVal];
                    $salemanId = $salObj->id;
                    $salemanName = $salObj->name;
                }
            }
            if (!$salemanId && $defaultSaleman) {
                $salemanId = $defaultSaleman->id;
                $salemanName = $defaultSaleman->name;
            }

            // 5. Booker Resolution
            if (!empty($bookerVal)) {
                $lowerBooker = strtolower($bookerVal);
                if (isset($bookersByName[$lowerBooker])) {
                    $bObj = $bookersByName[$lowerBooker];
                    $bookerId = $bObj->id;
                    $bookerName = $bObj->name;
                } elseif (is_numeric($bookerVal) && isset($bookersById[(int)$bookerVal])) {
                    $bObj = $bookersById[(int)$bookerVal];
                    $bookerId = $bObj->id;
                    $bookerName = $bObj->name;
                }
            }

            // 6. Location Resolutions
            $countryId = !empty($countryVal) && isset($countriesByName[strtolower($countryVal)]) ? $countriesByName[strtolower($countryVal)]->id : null;
            $provinceId = !empty($provinceVal) && isset($provincesByName[strtolower($provinceVal)]) ? $provincesByName[strtolower($provinceVal)]->id : null;
            $cityId = !empty($cityVal) && isset($citiesByName[strtolower($cityVal)]) ? $citiesByName[strtolower($cityVal)]->id : null;
            $areaId = !empty($areaVal) && isset($areasByName[strtolower($areaVal)]) ? $areasByName[strtolower($areaVal)]->id : null;
            $subareaId = !empty($subareaVal) && isset($subareasByName[strtolower($subareaVal)]) ? $subareasByName[strtolower($subareaVal)]->id : null;

            // 7. Conditional Type Rules
            $isCustomer = strtolower($typeName) === 'customers';
            $isSupplier = strtolower($typeName) === 'supplier';
            $isCompany = strtolower($typeName) === 'company';

            if ($isCustomer) {
                if (!$salemanId) {
                    $errors[] = 'Salesman is required for Customer accounts.';
                }
                if (empty($creditLimitVal)) {
                    $creditLimitVal = '99999999';
                }
                if (empty($itemCategoryVal)) {
                    $itemCategoryVal = '1';
                }
            }

            if ($isSupplier) {
                if (!$salemanId) {
                    $errors[] = 'Salesman is required for Supplier accounts.';
                }
                if (empty($catNameVal) || !$categoryId) {
                    $errors[] = "Account Category is required for Supplier accounts.";
                }
            }

            // Flags & Permissions
            $purchase = in_array(strtolower((string)$purchaseVal), ['1', 'true', 'yes']) ? 1 : ($isSupplier ? 1 : 0);
            $cashbank = in_array(strtolower((string)$cashbankVal), ['1', 'true', 'yes']) ? 1 : (in_array(strtolower($typeName), ['bank', 'cash', 'cheque in hand']) ? 1 : 0);
            $sale = in_array(strtolower((string)$saleVal), ['1', 'true', 'yes']) ? 1 : ($isCustomer ? 1 : 0);
            $status = in_array(strtolower((string)$statusVal), ['1', 'true', 'yes', 'active']) ? 1 : 0;

            // 8. Auto-Code Generation
            $generatedCode = $code;
            if (empty($code) && $typeId) {
                if (!isset($typeCodeCounters[$typeId])) {
                    $latestAccount = Account::where('type', $typeId)->latest('id')->first();
                    $startNum = 0;
                    if ($latestAccount && preg_match('/(\d+)$/', $latestAccount->code, $m)) {
                        $startNum = (int)$m[1];
                    }
                    $typeCodeCounters[$typeId] = $startNum;
                }
                $typeCodeCounters[$typeId]++;
                $generatedCode = str_pad($typeCodeCounters[$typeId], 6, '0', STR_PAD_LEFT);
            }

            $rowStatus = empty($errors) ? 'valid' : 'error';
            if ($rowStatus === 'valid') {
                $validCount++;
            } else {
                $errorCount++;
            }

            $parsedRows[] = [
                'row_number' => $rowNumber,
                'title' => $title,
                'code' => $generatedCode,
                'type_id' => $typeId,
                'type_name' => $typeName,
                'category_id' => $categoryId,
                'category_name' => $categoryName,
                'opening_balance' => is_numeric($openingBalVal) ? (float)$openingBalVal : 0,
                'credit_limit' => is_numeric($creditLimitVal) ? (float)$creditLimitVal : 99999999,
                'aging_days' => is_numeric($agingDaysVal) ? (int)$agingDaysVal : 0,
                'item_category' => is_numeric($itemCategoryVal) ? (int)$itemCategoryVal : null,
                'saleman_id' => $salemanId,
                'saleman_name' => $salemanName,
                'booker_id' => $bookerId,
                'booker_name' => $bookerName,
                'country_id' => $countryId,
                'province_id' => $provinceId,
                'city_id' => $cityId,
                'area_id' => $areaId,
                'subarea_id' => $subareaId,
                'address1' => $address1,
                'address2' => $address2,
                'mobile' => $mobile,
                'telephone1' => $telephone1,
                'telephone2' => $telephone2,
                'fax' => $fax,
                'gst' => $gst,
                'ntn' => $ntn,
                'cnic' => $cnic,
                'opening_date' => $openingDate,
                'fbr_date' => $fbrDate,
                'note_head' => $noteHead,
                'remarks' => $remarks,
                'regards' => $regards,
                'ats_percentage' => is_numeric($atsPercentVal) ? (float)$atsPercentVal : null,
                'ats_type' => $atsType,
                'purchase' => $purchase,
                'cashbank' => $cashbank,
                'sale' => $sale,
                'status' => $status,
                'row_status' => $rowStatus,
                'errors' => $errors,
            ];
        }

        return [
            'total_rows' => count($parsedRows),
            'valid_count' => $validCount,
            'error_count' => $errorCount,
            'rows' => $parsedRows,
        ];
    }

    /**
     * Perform actual import of valid accounts inside DB transaction.
     */
    public function import(array $rowsToImport): array
    {
        $createdAccounts = [];
        $skippedRows = [];

        DB::transaction(function () use ($rowsToImport, &$createdAccounts, &$skippedRows) {
            foreach ($rowsToImport as $row) {
                // Double-check title uniqueness
                if (Account::where('title', $row['title'])->exists()) {
                    $skippedRows[] = [
                        'row_number' => $row['row_number'] ?? null,
                        'title' => $row['title'],
                        'reason' => 'Account title already exists in database.',
                    ];
                    continue;
                }

                $account = Account::create([
                    'code' => $row['code'] ?? null,
                    'title' => $row['title'],
                    'type' => $row['type_id'],
                    'category' => $row['category_id'] ?? null,
                    'opening_balance' => $row['opening_balance'] ?? 0,
                    'credit_limit' => $row['credit_limit'] ?? 99999999,
                    'aging_days' => $row['aging_days'] ?? 0,
                    'item_category' => $row['item_category'] ?? null,
                    'saleman_id' => $row['saleman_id'] ?? null,
                    'booker_id' => $row['booker_id'] ?? null,
                    'country_id' => $row['country_id'] ?? null,
                    'province_id' => $row['province_id'] ?? null,
                    'city_id' => $row['city_id'] ?? null,
                    'area_id' => $row['area_id'] ?? null,
                    'subarea_id' => $row['subarea_id'] ?? null,
                    'address1' => $row['address1'] ?? null,
                    'address2' => $row['address2'] ?? null,
                    'mobile' => $row['mobile'] ?? null,
                    'telephone1' => $row['telephone1'] ?? null,
                    'telephone2' => $row['telephone2'] ?? null,
                    'fax' => $row['fax'] ?? null,
                    'gst' => $row['gst'] ?? null,
                    'ntn' => $row['ntn'] ?? null,
                    'cnic' => $row['cnic'] ?? null,
                    'opening_date' => $row['opening_date'] ?? now()->toDateString(),
                    'fbr_date' => $row['fbr_date'] ?? null,
                    'note_head' => $row['note_head'] ?? null,
                    'remarks' => $row['remarks'] ?? null,
                    'regards' => $row['regards'] ?? null,
                    'ats_percentage' => $row['ats_percentage'] ?? null,
                    'ats_type' => $row['ats_type'] ?? null,
                    'purchase' => $row['purchase'] ?? 0,
                    'cashbank' => $row['cashbank'] ?? 0,
                    'sale' => $row['sale'] ?? 0,
                    'status' => $row['status'] ?? 1,
                ]);

                $createdAccounts[] = $account;
            }
        });

        return [
            'success_count' => count($createdAccounts),
            'skipped_count' => count($skippedRows),
            'skipped_rows' => $skippedRows,
        ];
    }

    private function getValue(array $row, array $headerMap, string $key, string $default = ''): string
    {
        return isset($headerMap[$key]) ? trim((string)($row[$headerMap[$key]] ?? $default)) : $default;
    }

    private function resolveHeaderMapping(array $headers): array
    {
        $mapping = [];
        foreach ($headers as $colIndex => $h) {
            if (in_array($h, ['title', 'account_title', 'name', 'account_name'])) {
                $mapping['title'] = $colIndex;
            } elseif (in_array($h, ['code', 'account_code'])) {
                $mapping['code'] = $colIndex;
            } elseif (in_array($h, ['account_type', 'type', 'type_name'])) {
                $mapping['type_name'] = $colIndex;
            } elseif (in_array($h, ['category_name', 'category', 'account_category'])) {
                $mapping['category_name'] = $colIndex;
            } elseif (in_array($h, ['opening_balance', 'balance', 'open_bal'])) {
                $mapping['opening_balance'] = $colIndex;
            } elseif (in_array($h, ['credit_limit', 'limit'])) {
                $mapping['credit_limit'] = $colIndex;
            } elseif (in_array($h, ['aging_days', 'aging'])) {
                $mapping['aging_days'] = $colIndex;
            } elseif (in_array($h, ['item_category', 'item_cat'])) {
                $mapping['item_category'] = $colIndex;
            } elseif (in_array($h, ['salesman_name', 'salesman', 'saleman'])) {
                $mapping['saleman_name'] = $colIndex;
            } elseif (in_array($h, ['booker_name', 'booker'])) {
                $mapping['booker_name'] = $colIndex;
            } elseif (in_array($h, ['country'])) {
                $mapping['country'] = $colIndex;
            } elseif (in_array($h, ['province'])) {
                $mapping['province'] = $colIndex;
            } elseif (in_array($h, ['city'])) {
                $mapping['city'] = $colIndex;
            } elseif (in_array($h, ['area'])) {
                $mapping['area'] = $colIndex;
            } elseif (in_array($h, ['subarea', 'sub_area', 'locality'])) {
                $mapping['subarea'] = $colIndex;
            } elseif (in_array($h, ['address_1', 'address1', 'address'])) {
                $mapping['address1'] = $colIndex;
            } elseif (in_array($h, ['address_2', 'address2'])) {
                $mapping['address2'] = $colIndex;
            } elseif (in_array($h, ['mobile', 'phone'])) {
                $mapping['mobile'] = $colIndex;
            } elseif (in_array($h, ['telephone_1', 'telephone1', 'telephone'])) {
                $mapping['telephone1'] = $colIndex;
            } elseif (in_array($h, ['telephone_2', 'telephone2'])) {
                $mapping['telephone2'] = $colIndex;
            } elseif (in_array($h, ['fax'])) {
                $mapping['fax'] = $colIndex;
            } elseif (in_array($h, ['gst', 'gst_num'])) {
                $mapping['gst'] = $colIndex;
            } elseif (in_array($h, ['ntn', 'ntn_num'])) {
                $mapping['ntn'] = $colIndex;
            } elseif (in_array($h, ['cnic', 'cnic_num'])) {
                $mapping['cnic'] = $colIndex;
            } elseif (in_array($h, ['registration_date', 'opening_date', 'date'])) {
                $mapping['opening_date'] = $colIndex;
            } elseif (in_array($h, ['fbr_date'])) {
                $mapping['fbr_date'] = $colIndex;
            } elseif (in_array($h, ['note_head'])) {
                $mapping['note_head'] = $colIndex;
            } elseif (in_array($h, ['remarks', 'notes'])) {
                $mapping['remarks'] = $colIndex;
            } elseif (in_array($h, ['regards'])) {
                $mapping['regards'] = $colIndex;
            } elseif (in_array($h, ['ats_percentage', 'ats_percent'])) {
                $mapping['ats_percentage'] = $colIndex;
            } elseif (in_array($h, ['ats_type'])) {
                $mapping['ats_type'] = $colIndex;
            } elseif (in_array($h, ['purchase_flag', 'purchase'])) {
                $mapping['purchase'] = $colIndex;
            } elseif (in_array($h, ['cashbank_flag', 'cashbank'])) {
                $mapping['cashbank'] = $colIndex;
            } elseif (in_array($h, ['sale_flag', 'sale'])) {
                $mapping['sale'] = $colIndex;
            } elseif (in_array($h, ['status', 'active'])) {
                $mapping['status'] = $colIndex;
            }
        }
        return $mapping;
    }
}
