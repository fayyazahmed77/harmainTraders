<?php

namespace App\Exports;

use App\Models\Account;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class AccountSampleExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    public function collection()
    {
        $accounts = Account::with([
            'accountType',
            'accountCategory',
            'saleman',
            'booker',
            'country',
            'province',
            'city',
            'area',
            'subarea',
        ])->get();

        if ($accounts->isEmpty()) {
            return collect([
                [
                    'title' => 'Al-Madina Pharmacy',
                    'code' => '000001',
                    'type_name' => 'Customers',
                    'category_name' => '',
                    'opening_balance' => '0.00',
                    'opening_balance_type' => 'DR',
                    'credit_limit' => '500000.00',
                    'aging_days' => '30',
                    'item_category' => '1',
                    'saleman_name' => 'John Doe (JD)',
                    'booker_name' => '',
                    'country' => 'Pakistan',
                    'province' => 'Punjab',
                    'city' => 'Lahore',
                    'area' => 'Gulberg',
                    'subarea' => 'Main Market',
                    'address1' => 'Shop # 12, Main Market Gulberg',
                    'address2' => '',
                    'mobile' => '0300-1234567',
                    'telephone1' => '042-3571111',
                    'telephone2' => '',
                    'fax' => '',
                    'gst' => '3277876543210',
                    'ntn' => '1234567-8',
                    'cnic' => '35202-1234567-1',
                    'opening_date' => now()->toDateString(),
                    'fbr_date' => '',
                    'note_head' => 'Daily Customer',
                    'remarks' => 'Regular Customer',
                    'regards' => '',
                    'ats_percentage' => '',
                    'ats_type' => '',
                    'purchase' => '0',
                    'cashbank' => '0',
                    'sale' => '1',
                    'status' => '1',
                ],
                [
                    'title' => 'Getz Pharma (Pvt) Ltd',
                    'code' => '000002',
                    'type_name' => 'Supplier',
                    'category_name' => 'Pharma Manufacturer',
                    'opening_balance' => '0.00',
                    'opening_balance_type' => 'CR',
                    'credit_limit' => '0.00',
                    'aging_days' => '45',
                    'item_category' => '',
                    'saleman_name' => 'John Doe (JD)',
                    'booker_name' => '',
                    'country' => 'Pakistan',
                    'province' => 'Sindh',
                    'city' => 'Karachi',
                    'area' => 'Korangi',
                    'subarea' => 'Industrial Area',
                    'address1' => 'Plot 29-A, Korangi Industrial Area',
                    'address2' => '',
                    'mobile' => '0321-9876543',
                    'telephone1' => '021-3506000',
                    'telephone2' => '',
                    'fax' => '',
                    'gst' => '1700999988811',
                    'ntn' => '9876543-2',
                    'cnic' => '',
                    'opening_date' => now()->toDateString(),
                    'fbr_date' => '',
                    'note_head' => 'Promotional & Marketing',
                    'remarks' => 'Primary Distributor Supplier',
                    'regards' => '',
                    'ats_percentage' => '',
                    'ats_type' => '',
                    'purchase' => '1',
                    'cashbank' => '0',
                    'sale' => '0',
                    'status' => '1',
                ],
            ]);
        }

        return $accounts->map(function ($acc) {
            $typeRel = $acc->getRelation('accountType');
            $catRel = $acc->getRelation('accountCategory');
            $salemanRel = $acc->getRelation('saleman');
            $bookerRel = $acc->getRelation('booker');
            $countryRel = $acc->getRelation('country');
            $provinceRel = $acc->getRelation('province');
            $cityRel = $acc->getRelation('city');
            $areaRel = $acc->getRelation('area');
            $subareaRel = $acc->getRelation('subarea');

            return [
                'title' => $acc->title ?? '',
                'code' => $acc->code ?? '',
                'type_name' => $typeRel ? $typeRel->name : ($acc->type ?? ''),
                'category_name' => $catRel ? $catRel->name : ($acc->category ?? ''),
                'opening_balance' => (string)($acc->opening_balance ?? '0.00'),
                'opening_balance_type' => (string)($acc->opening_balance_type ?? 'DR'),
                'credit_limit' => (string)($acc->credit_limit ?? '0.00'),
                'aging_days' => (string)($acc->aging_days ?? '0'),
                'item_category' => $acc->item_category !== null ? (string)$acc->item_category : '',
                'saleman_name' => $salemanRel ? $salemanRel->name : ($acc->saleman_id ?? ''),
                'booker_name' => $bookerRel ? $bookerRel->name : ($acc->booker_id ?? ''),
                'country' => $countryRel ? $countryRel->name : '',
                'province' => $provinceRel ? $provinceRel->name : '',
                'city' => $cityRel ? $cityRel->name : '',
                'area' => $areaRel ? $areaRel->name : '',
                'subarea' => $subareaRel ? $subareaRel->name : '',
                'address1' => $acc->address1 ?? '',
                'address2' => $acc->address2 ?? '',
                'mobile' => $acc->mobile ?? '',
                'telephone1' => $acc->telephone1 ?? '',
                'telephone2' => $acc->telephone2 ?? '',
                'fax' => $acc->fax ?? '',
                'gst' => $acc->gst ?? '',
                'ntn' => $acc->ntn ?? '',
                'cnic' => $acc->cnic ?? '',
                'opening_date' => $acc->opening_date ?? '',
                'fbr_date' => $acc->fbr_date ?? '',
                'note_head' => $acc->note_head ?? '',
                'remarks' => $acc->remarks ?? '',
                'regards' => $acc->regards ?? '',
                'ats_percentage' => $acc->ats_percentage !== null ? (string)$acc->ats_percentage : '',
                'ats_type' => $acc->ats_type ?? '',
                'purchase' => $acc->purchase ? '1' : '0',
                'cashbank' => $acc->cashbank ? '1' : '0',
                'sale' => $acc->sale ? '1' : '0',
                'status' => $acc->status ? '1' : '0',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Title*',
            'Code',
            'Account Type*',
            'Category Name',
            'Opening Balance',
            'Opening Balance Type (DR/CR)',
            'Credit Limit',
            'Aging Days',
            'Item Category (1-7)',
            'Salesman Name',
            'Booker Name',
            'Country',
            'Province',
            'City',
            'Area',
            'Sub-Area',
            'Address 1',
            'Address 2',
            'Mobile',
            'Telephone 1',
            'Telephone 2',
            'Fax',
            'GST #',
            'NTN #',
            'CNIC #',
            'Registration Date',
            'FBR Date',
            'Note Head',
            'Remarks',
            'Regards',
            'ATS %',
            'ATS Type',
            'Purchase Flag (1/0)',
            'CashBank Flag (1/0)',
            'Sale Flag (1/0)',
            'Status (1/0)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28, // Title
            'B' => 14, // Code
            'C' => 18, // Account Type
            'D' => 20, // Category Name
            'E' => 16, // Opening Balance
            'F' => 18, // Opening Balance Type
            'G' => 16, // Credit Limit
            'H' => 12, // Aging Days
            'I' => 18, // Item Category
            'J' => 22, // Salesman Name
            'K' => 20, // Booker Name
            'L' => 16, // Country
            'M' => 16, // Province
            'N' => 16, // City
            'O' => 16, // Area
            'P' => 16, // Sub-Area
            'Q' => 30, // Address 1
            'R' => 25, // Address 2
            'S' => 16, // Mobile
            'T' => 16, // Telephone 1
            'U' => 16, // Telephone 2
            'V' => 14, // Fax
            'W' => 18, // GST
            'X' => 16, // NTN
            'Y' => 18, // CNIC
            'Z' => 16, // Opening Date
            'AA' => 16, // FBR Date
            'AB' => 20, // Note Head
            'AC' => 25, // Remarks
            'AD' => 20, // Regards
            'AE' => 12, // ATS %
            'AF' => 14, // ATS Type
            'AG' => 16, // Purchase
            'AH' => 16, // Cashbank
            'AI' => 15, // Sale
            'AJ' => 15, // Status
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = max($sheet->getHighestRow(), 3);

        // Header Row Styling
        $sheet->getStyle('A1:AJ1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'name' => 'Calibri',
                'size' => 11,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'], // Dark slate
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ]);

        $sheet->getRowDimension(1)->setRowHeight(28);

        // Data rows styling
        $sheet->getStyle("A2:AJ{$highestRow}")->applyFromArray([
            'font' => ['name' => 'Calibri', 'size' => 10],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        return [];
    }
}
