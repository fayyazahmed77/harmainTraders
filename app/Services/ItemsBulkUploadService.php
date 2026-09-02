<?php

namespace App\Services;

use App\Models\Items;
use App\Models\ItemCategory;
use App\Models\Account;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ItemsBulkUploadService
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
            $h = str_replace(['*', '(', ')', '%'], '', $h);
            $h = preg_replace('/\s+/', '_', $h);
            return $h;
        }, $rawHeaders);

        // Build header mapping dictionary
        $headerMap = $this->resolveHeaderMapping($headers);

        // Pre-fetch reference dictionaries
        $categoriesByName = ItemCategory::all()->keyBy(fn($c) => strtolower(trim($c->name)));
        $categoriesById = ItemCategory::all()->keyBy('id');

        $companiesByName = Account::with('accountType')
            ->whereHas('accountType', function ($q) {
                $q->whereIn('name', ['Company']);
            })
            ->get()
            ->keyBy(fn($a) => strtolower(trim($a->title)));
        $companiesById = Account::all()->keyBy('id');

        $existingTitles = Items::pluck('title')
            ->map(fn($t) => strtolower(trim($t)))
            ->flip()
            ->toArray();

        // Counter map for auto-generated codes per category
        $categoryCodeCounters = [];
        $seenTitlesInBatch = [];

        $parsedRows = [];
        $validCount = 0;
        $errorCount = 0;

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2; // Accounting for 1-based index + header row

            // Check if row is completely empty
            $isEmptyRow = true;
            foreach ($row as $cell) {
                if ($cell !== null && trim((string)$cell) !== '') {
                    $isEmptyRow = false;
                    break;
                }
            }
            if ($isEmptyRow) {
                continue;
            }

            // Extract string values
            $title = $this->getValue($row, $headerMap, 'title');
            $code = $this->getValue($row, $headerMap, 'code');
            $shortName = $this->getValue($row, $headerMap, 'short_name');
            $catVal = $this->getValue($row, $headerMap, 'category_name');
            $compVal = $this->getValue($row, $headerMap, 'company_name');

            $tradePriceVal = $this->getValue($row, $headerMap, 'trade_price');
            $retailVal = $this->getValue($row, $headerMap, 'retail');
            $discountVal = $this->getValue($row, $headerMap, 'discount', '0');

            $packingQtyVal = $this->getValue($row, $headerMap, 'packing_qty', '1');
            $packingSizeVal = $this->getValue($row, $headerMap, 'packing_size', '1s');
            $reorderLevelVal = $this->getValue($row, $headerMap, 'reorder_level', '0');

            $formation = $this->getValue($row, $headerMap, 'formation');
            $type = $this->getValue($row, $headerMap, 'type');
            $shelf = $this->getValue($row, $headerMap, 'shelf');

            $pcsVal = $this->getValue($row, $headerMap, 'pcs');
            $limitPcsVal = $this->getValue($row, $headerMap, 'limit_pcs');
            $orderQtyVal = $this->getValue($row, $headerMap, 'order_qty');
            $weightVal = $this->getValue($row, $headerMap, 'weight');

            $stock1Val = $this->getValue($row, $headerMap, 'stock_1', '0');
            $stock2Val = $this->getValue($row, $headerMap, 'stock_2', '0');

            $pt2Val = $this->getValue($row, $headerMap, 'pt2');
            $pt3Val = $this->getValue($row, $headerMap, 'pt3');
            $pt4Val = $this->getValue($row, $headerMap, 'pt4');
            $pt5Val = $this->getValue($row, $headerMap, 'pt5');
            $pt6Val = $this->getValue($row, $headerMap, 'pt6');
            $pt7Val = $this->getValue($row, $headerMap, 'pt7');

            $scheme = $this->getValue($row, $headerMap, 'scheme');
            $scheme2 = $this->getValue($row, $headerMap, 'scheme2');

            $gstPercentVal = $this->getValue($row, $headerMap, 'gst_percent', '0');
            $gstAmountVal = $this->getValue($row, $headerMap, 'gst_amount');

            $advTaxFilerVal = $this->getValue($row, $headerMap, 'adv_tax_filer');
            $advTaxNonFilerVal = $this->getValue($row, $headerMap, 'adv_tax_non_filer');
            $advTaxManufacturerVal = $this->getValue($row, $headerMap, 'adv_tax_manufacturer');

            $isImportVal = $this->getValue($row, $headerMap, 'is_import', '0');
            $isFridgeVal = $this->getValue($row, $headerMap, 'is_fridge', '0');
            $isRecipeVal = $this->getValue($row, $headerMap, 'is_recipe', '0');
            $isActiveVal = $this->getValue($row, $headerMap, 'is_active', '1');

            $errors = [];
            $categoryId = null;
            $categoryName = $catVal;
            $companyId = null;
            $companyName = $compVal;

            // 1. Title Validation
            if (empty($title)) {
                $errors[] = 'Title is required.';
            } else {
                $lowerTitle = strtolower($title);
                if (isset($existingTitles[$lowerTitle])) {
                    $errors[] = "Item title '{$title}' already exists in database.";
                } elseif (isset($seenTitlesInBatch[$lowerTitle])) {
                    $errors[] = "Duplicate title '{$title}' found multiple times in this file.";
                } else {
                    $seenTitlesInBatch[$lowerTitle] = true;
                }
            }

            // 2. Category Validation & Resolution
            if (empty($catVal)) {
                $errors[] = 'Category is required.';
            } else {
                $lowerCat = strtolower($catVal);
                if (isset($categoriesByName[$lowerCat])) {
                    $catObj = $categoriesByName[$lowerCat];
                    $categoryId = $catObj->id;
                    $categoryName = $catObj->name;
                } elseif (is_numeric($catVal) && isset($categoriesById[(int)$catVal])) {
                    $catObj = $categoriesById[(int)$catVal];
                    $categoryId = $catObj->id;
                    $categoryName = $catObj->name;
                } else {
                    $errors[] = "Category '{$catVal}' not found in database.";
                }
            }

            // 3. Company Validation & Resolution
            if (empty($compVal)) {
                $errors[] = 'Company Account is required.';
            } else {
                $lowerComp = strtolower($compVal);
                if (isset($companiesByName[$lowerComp])) {
                    $compObj = $companiesByName[$lowerComp];
                    $companyId = $compObj->id;
                    $companyName = $compObj->title;
                } elseif (is_numeric($compVal) && isset($companiesById[(int)$compVal])) {
                    $compObj = $companiesById[(int)$compVal];
                    $companyId = $compObj->id;
                    $companyName = $compObj->title;
                } else {
                    $errors[] = "Company Account '{$compVal}' not found under 'Company' account type.";
                }
            }

            // 4. Pricing & Quantity Validation
            if (!is_numeric($tradePriceVal) || (float)$tradePriceVal < 0) {
                $errors[] = 'Trade Price must be a non-negative number.';
            }
            if (!is_numeric($retailVal) || (float)$retailVal < 0) {
                $errors[] = 'Retail Price must be a non-negative number.';
            }

            $tradePrice = is_numeric($tradePriceVal) ? (float)$tradePriceVal : 0;
            $retail = is_numeric($retailVal) ? (float)$retailVal : 0;
            $retailTpDiff = ($tradePrice > 0) ? round((($retail - $tradePrice) / $tradePrice) * 100, 2) : 0;

            $packingQty = is_numeric($packingQtyVal) && (int)$packingQtyVal > 0 ? (int)$packingQtyVal : 1;
            $packingSize = !empty($packingSizeVal) ? $packingSizeVal : '1s';
            $reorderLevel = is_numeric($reorderLevelVal) && (int)$reorderLevelVal >= 0 ? (int)$reorderLevelVal : 0;

            $stock1 = is_numeric($stock1Val) ? (int)$stock1Val : 0;
            $stock2 = is_numeric($stock2Val) ? (int)$stock2Val : 0;
            $discount = is_numeric($discountVal) ? (float)$discountVal : 0;

            $isImport = in_array(strtolower((string)$isImportVal), ['1', 'true', 'yes']) ? 1 : 0;
            $isFridge = in_array(strtolower((string)$isFridgeVal), ['1', 'true', 'yes']) ? 1 : 0;
            $isRecipe = in_array(strtolower((string)$isRecipeVal), ['1', 'true', 'yes']) ? 1 : 0;
            $isActive = in_array(strtolower((string)$isActiveVal), ['1', 'true', 'yes', 'active']) ? 1 : 0;

            // 5. Code Auto-Generation if empty
            $generatedCode = $code;
            if (empty($code) && $categoryId) {
                if (!isset($categoryCodeCounters[$categoryId])) {
                    $catObj = $categoriesById[$categoryId] ?? null;
                    $prefix = $catObj && $catObj->code
                        ? strtoupper($catObj->code)
                        : ($catObj ? strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $catObj->name), 0, 3)) : 'ITEM');

                    $latestItem = Items::where('category', $categoryId)
                        ->where('code', 'like', $prefix . '-%')
                        ->orderBy('id', 'desc')
                        ->first();

                    $startNum = 0;
                    if ($latestItem && preg_match('/-(\d+)$/', $latestItem->code, $m)) {
                        $startNum = (int)$m[1];
                    }
                    $categoryCodeCounters[$categoryId] = ['prefix' => $prefix, 'seq' => $startNum];
                }

                $categoryCodeCounters[$categoryId]['seq']++;
                $generatedCode = $categoryCodeCounters[$categoryId]['prefix'] . '-' . str_pad($categoryCodeCounters[$categoryId]['seq'], 3, '0', STR_PAD_LEFT);
            }

            $status = empty($errors) ? 'valid' : 'error';
            if ($status === 'valid') {
                $validCount++;
            } else {
                $errorCount++;
            }

            $parsedRows[] = [
                'row_number' => $rowNumber,
                'title' => $title,
                'code' => $generatedCode,
                'short_name' => $shortName,
                'category_id' => $categoryId,
                'category_name' => $categoryName,
                'company_id' => $companyId,
                'company_name' => $companyName,
                'trade_price' => $tradePrice,
                'retail' => $retail,
                'retail_tp_diff' => $retailTpDiff,
                'packing_qty' => $packingQty,
                'packing_size' => $packingSize,
                'reorder_level' => $reorderLevel,
                'formation' => $formation,
                'type' => $type,
                'shelf' => $shelf,
                'pcs' => is_numeric($pcsVal) ? (int)$pcsVal : null,
                'limit_pcs' => is_numeric($limitPcsVal) ? (int)$limitPcsVal : null,
                'order_qty' => is_numeric($orderQtyVal) ? (int)$orderQtyVal : null,
                'weight' => is_numeric($weightVal) ? (float)$weightVal : null,
                'stock_1' => $stock1,
                'stock_2' => $stock2,
                'pt2' => is_numeric($pt2Val) ? (float)$pt2Val : null,
                'pt3' => is_numeric($pt3Val) ? (float)$pt3Val : null,
                'pt4' => is_numeric($pt4Val) ? (float)$pt4Val : null,
                'pt5' => is_numeric($pt5Val) ? (float)$pt5Val : null,
                'pt6' => is_numeric($pt6Val) ? (float)$pt6Val : null,
                'pt7' => is_numeric($pt7Val) ? (float)$pt7Val : null,
                'scheme' => $scheme,
                'scheme2' => $scheme2,
                'discount' => $discount,
                'gst_percent' => is_numeric($gstPercentVal) ? (float)$gstPercentVal : null,
                'gst_amount' => is_numeric($gstAmountVal) ? (float)$gstAmountVal : null,
                'adv_tax_filer' => is_numeric($advTaxFilerVal) ? (float)$advTaxFilerVal : null,
                'adv_tax_non_filer' => is_numeric($advTaxNonFilerVal) ? (float)$advTaxNonFilerVal : null,
                'adv_tax_manufacturer' => is_numeric($advTaxManufacturerVal) ? (float)$advTaxManufacturerVal : null,
                'is_import' => $isImport,
                'is_fridge' => $isFridge,
                'is_recipe' => $isRecipe,
                'is_active' => $isActive,
                'status' => $status,
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
     * Perform the actual import of valid items inside a DB transaction.
     */
    public function import(array $rowsToImport): array
    {
        $createdItems = [];
        $skippedRows = [];

        DB::transaction(function () use ($rowsToImport, &$createdItems, &$skippedRows) {
            foreach ($rowsToImport as $row) {
                // Double-check title uniqueness inside transaction
                if (Items::where('title', $row['title'])->exists()) {
                    $skippedRows[] = [
                        'row_number' => $row['row_number'] ?? null,
                        'title' => $row['title'],
                        'reason' => 'Item title already exists in database.',
                    ];
                    continue;
                }

                $item = Items::create([
                    'date' => now()->toDateString(),
                    'code' => $row['code'] ?? null,
                    'title' => $row['title'],
                    'short_name' => $row['short_name'] ?? null,
                    'company' => $row['company_id'],
                    'category' => $row['category_id'],
                    'trade_price' => $row['trade_price'],
                    'retail' => $row['retail'],
                    'retail_tp_diff' => $row['retail_tp_diff'] ?? null,
                    'packing_qty' => $row['packing_qty'] ?? 1,
                    'packing_size' => $row['packing_size'] ?? '1s',
                    'reorder_level' => $row['reorder_level'] ?? 0,
                    'formation' => $row['formation'] ?? null,
                    'type' => $row['type'] ?? null,
                    'shelf' => $row['shelf'] ?? null,
                    'pcs' => $row['pcs'] ?? null,
                    'limit_pcs' => $row['limit_pcs'] ?? null,
                    'order_qty' => $row['order_qty'] ?? null,
                    'weight' => $row['weight'] ?? null,
                    'stock_1' => $row['stock_1'] ?? 0,
                    'stock_2' => $row['stock_2'] ?? 0,
                    'pt2' => $row['pt2'] ?? null,
                    'pt3' => $row['pt3'] ?? null,
                    'pt4' => $row['pt4'] ?? null,
                    'pt5' => $row['pt5'] ?? null,
                    'pt6' => $row['pt6'] ?? null,
                    'pt7' => $row['pt7'] ?? null,
                    'scheme' => $row['scheme'] ?? null,
                    'scheme2' => $row['scheme2'] ?? null,
                    'discount' => $row['discount'] ?? 0,
                    'gst_percent' => $row['gst_percent'] ?? null,
                    'gst_amount' => $row['gst_amount'] ?? null,
                    'adv_tax_filer' => $row['adv_tax_filer'] ?? null,
                    'adv_tax_non_filer' => $row['adv_tax_non_filer'] ?? null,
                    'adv_tax_manufacturer' => $row['adv_tax_manufacturer'] ?? null,
                    'is_import' => $row['is_import'] ?? 0,
                    'is_fridge' => $row['is_fridge'] ?? 0,
                    'is_recipe' => $row['is_recipe'] ?? 0,
                    'is_active' => $row['is_active'] ?? 1,
                ]);

                $createdItems[] = $item;
            }
        });

        return [
            'success_count' => count($createdItems),
            'skipped_count' => count($skippedRows),
            'skipped_rows' => $skippedRows,
        ];
    }

    private function getValue(array $row, array $headerMap, string $key, string $default = ''): string
    {
        return isset($headerMap[$key]) ? trim((string)($row[$headerMap[$key]] ?? $default)) : $default;
    }

    /**
     * Maps raw CSV header columns to internal field keys.
     */
    private function resolveHeaderMapping(array $headers): array
    {
        $mapping = [];
        foreach ($headers as $colIndex => $h) {
            if (in_array($h, ['title', 'item_name', 'name', 'product_name'])) {
                $mapping['title'] = $colIndex;
            } elseif (in_array($h, ['code', 'item_code', 'sku'])) {
                $mapping['code'] = $colIndex;
            } elseif (in_array($h, ['short_name', 'shortname', 'alias'])) {
                $mapping['short_name'] = $colIndex;
            } elseif (in_array($h, ['category_name', 'category', 'item_category'])) {
                $mapping['category_name'] = $colIndex;
            } elseif (in_array($h, ['company_name', 'company', 'manufacturer', 'company_account'])) {
                $mapping['company_name'] = $colIndex;
            } elseif (in_array($h, ['trade_price', 'tp', 'trade_price_rs'])) {
                $mapping['trade_price'] = $colIndex;
            } elseif (in_array($h, ['retail_price', 'retail', 'rp', 'mrp'])) {
                $mapping['retail'] = $colIndex;
            } elseif (in_array($h, ['packing_qty', 'packing', 'pack_qty', 'p_qty'])) {
                $mapping['packing_qty'] = $colIndex;
            } elseif (in_array($h, ['packing_size', 'pack_size', 'size', 'carton_size'])) {
                $mapping['packing_size'] = $colIndex;
            } elseif (in_array($h, ['reorder_level', 'reorder', 're_order'])) {
                $mapping['reorder_level'] = $colIndex;
            } elseif (in_array($h, ['formation'])) {
                $mapping['formation'] = $colIndex;
            } elseif (in_array($h, ['type'])) {
                $mapping['type'] = $colIndex;
            } elseif (in_array($h, ['shelf'])) {
                $mapping['shelf'] = $colIndex;
            } elseif (in_array($h, ['pcs'])) {
                $mapping['pcs'] = $colIndex;
            } elseif (in_array($h, ['limit_pcs', 'limit'])) {
                $mapping['limit_pcs'] = $colIndex;
            } elseif (in_array($h, ['order_qty'])) {
                $mapping['order_qty'] = $colIndex;
            } elseif (in_array($h, ['weight', 'weight_kg'])) {
                $mapping['weight'] = $colIndex;
            } elseif (in_array($h, ['stock_1_full', 'stock_1', 'full_stock', 'boxes_stock'])) {
                $mapping['stock_1'] = $colIndex;
            } elseif (in_array($h, ['stock_2_loose', 'stock_2', 'loose_stock', 'pcs_stock'])) {
                $mapping['stock_2'] = $colIndex;
            } elseif (in_array($h, ['tp_2', 'tp2', 'pt2', 'p_t_2'])) {
                $mapping['pt2'] = $colIndex;
            } elseif (in_array($h, ['tp_3', 'tp3', 'pt3', 'p_t_3'])) {
                $mapping['pt3'] = $colIndex;
            } elseif (in_array($h, ['tp_4', 'tp4', 'pt4', 'p_t_4'])) {
                $mapping['pt4'] = $colIndex;
            } elseif (in_array($h, ['tp_5', 'tp5', 'pt5', 'p_t_5'])) {
                $mapping['pt5'] = $colIndex;
            } elseif (in_array($h, ['tp_6', 'tp6', 'pt6', 'p_t_6'])) {
                $mapping['pt6'] = $colIndex;
            } elseif (in_array($h, ['tp_7', 'tp7', 'pt7', 'p_t_7'])) {
                $mapping['pt7'] = $colIndex;
            } elseif (in_array($h, ['scheme', 'scheme_1'])) {
                $mapping['scheme'] = $colIndex;
            } elseif (in_array($h, ['scheme_2', 'scheme2'])) {
                $mapping['scheme2'] = $colIndex;
            } elseif (in_array($h, ['discount', 'disc', 'discount_percent'])) {
                $mapping['discount'] = $colIndex;
            } elseif (in_array($h, ['gst_percent', 'gst', 'gst_rate'])) {
                $mapping['gst_percent'] = $colIndex;
            } elseif (in_array($h, ['gst_amount'])) {
                $mapping['gst_amount'] = $colIndex;
            } elseif (in_array($h, ['adv_tax_filer', 'filer_tax'])) {
                $mapping['adv_tax_filer'] = $colIndex;
            } elseif (in_array($h, ['adv_tax_non_filer', 'non_filer_tax'])) {
                $mapping['adv_tax_non_filer'] = $colIndex;
            } elseif (in_array($h, ['adv_tax_manufacturer', 'manufacturer_tax'])) {
                $mapping['adv_tax_manufacturer'] = $colIndex;
            } elseif (in_array($h, ['is_import', 'import'])) {
                $mapping['is_import'] = $colIndex;
            } elseif (in_array($h, ['is_fridge', 'fridge'])) {
                $mapping['is_fridge'] = $colIndex;
            } elseif (in_array($h, ['is_recipe', 'recipe'])) {
                $mapping['is_recipe'] = $colIndex;
            } elseif (in_array($h, ['is_active', 'active', 'status'])) {
                $mapping['is_active'] = $colIndex;
            }
        }
        return $mapping;
    }
}
