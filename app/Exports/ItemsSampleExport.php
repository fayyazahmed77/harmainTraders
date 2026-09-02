<?php

namespace App\Exports;

use App\Models\Items;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ItemsSampleExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths
{
    public function collection()
    {
        $items = Items::with(['category', 'companyAccount'])->get();

        if ($items->isEmpty()) {
            return collect([
                [
                    'title' => 'Panadol Extra 500mg',
                    'code' => 'TAB-001',
                    'short_name' => 'Panadol Ex',
                    'category_name' => 'Tablet',
                    'company_name' => 'GSK Pakistan',
                    'trade_price' => '250.00',
                    'retail' => '300.00',
                    'discount' => '0',
                    'packing_qty' => '10',
                    'packing_size' => '10x10s',
                    'reorder_level' => '50',
                    'formation' => '',
                    'type' => '',
                    'shelf' => 'Shelf-A1',
                    'pcs' => '10',
                    'limit_pcs' => '100',
                    'order_qty' => '20',
                    'weight' => '0.2',
                    'stock_1' => '100',
                    'stock_2' => '0',
                    'pt2' => '2',
                    'pt3' => '3',
                    'pt4' => '',
                    'pt5' => '',
                    'pt6' => '',
                    'pt7' => '',
                    'scheme' => 'Buy 10 Get 1 Free',
                    'scheme2' => '',
                    'gst_percent' => '18',
                    'gst_amount' => '45.00',
                    'adv_tax_filer' => '0.5',
                    'adv_tax_non_filer' => '2.5',
                    'adv_tax_manufacturer' => '0',
                    'is_import' => '0',
                    'is_fridge' => '0',
                    'is_recipe' => '0',
                    'is_active' => '1',
                ],
                [
                    'title' => 'Brufen 400mg',
                    'code' => 'TAB-002',
                    'short_name' => 'Brufen 400',
                    'category_name' => 'Tablet',
                    'company_name' => 'Abbott Laboratories',
                    'trade_price' => '180.00',
                    'retail' => '220.00',
                    'discount' => '2',
                    'packing_qty' => '10',
                    'packing_size' => '10x10s',
                    'reorder_level' => '30',
                    'formation' => '',
                    'type' => '',
                    'shelf' => 'Shelf-B2',
                    'pcs' => '10',
                    'limit_pcs' => '50',
                    'order_qty' => '15',
                    'weight' => '0.15',
                    'stock_1' => '75',
                    'stock_2' => '5',
                    'pt2' => '1.5',
                    'pt3' => '2.5',
                    'pt4' => '',
                    'pt5' => '',
                    'pt6' => '',
                    'pt7' => '',
                    'scheme' => '',
                    'scheme2' => 'Market Offer Scheme',
                    'gst_percent' => '18',
                    'gst_amount' => '32.40',
                    'adv_tax_filer' => '0.5',
                    'adv_tax_non_filer' => '2.5',
                    'adv_tax_manufacturer' => '0',
                    'is_import' => '0',
                    'is_fridge' => '0',
                    'is_recipe' => '0',
                    'is_active' => '1',
                ],
            ]);
        }

        return $items->map(function ($item) {
            $catRel = $item->getRelation('category');
            $compRel = $item->getRelation('companyAccount');

            return [
                'title' => $item->title ?? '',
                'code' => $item->code ?? '',
                'short_name' => $item->short_name ?? '',
                'category_name' => $catRel ? $catRel->name : ($item->category ?? ''),
                'company_name' => $compRel ? $compRel->title : ($item->company ?? ''),
                'trade_price' => (string)($item->trade_price ?? '0.00'),
                'retail' => (string)($item->retail ?? '0.00'),
                'discount' => (string)($item->discount ?? '0'),
                'packing_qty' => (string)($item->packing_qty ?? '1'),
                'packing_size' => (string)($item->packing_size ?? '1s'),
                'reorder_level' => (string)($item->reorder_level ?? '0'),
                'formation' => $item->formation ?? '',
                'type' => $item->type ?? '',
                'shelf' => $item->shelf ?? '',
                'pcs' => $item->pcs !== null ? (string)$item->pcs : '',
                'limit_pcs' => $item->limit_pcs !== null ? (string)$item->limit_pcs : '',
                'order_qty' => $item->order_qty !== null ? (string)$item->order_qty : '',
                'weight' => $item->weight !== null ? (string)$item->weight : '',
                'stock_1' => (string)($item->stock_1 ?? '0'),
                'stock_2' => (string)($item->stock_2 ?? '0'),
                'pt2' => $item->pt2 !== null ? (string)$item->pt2 : '',
                'pt3' => $item->pt3 !== null ? (string)$item->pt3 : '',
                'pt4' => $item->pt4 !== null ? (string)$item->pt4 : '',
                'pt5' => $item->pt5 !== null ? (string)$item->pt5 : '',
                'pt6' => $item->pt6 !== null ? (string)$item->pt6 : '',
                'pt7' => $item->pt7 !== null ? (string)$item->pt7 : '',
                'scheme' => $item->scheme ?? '',
                'scheme2' => $item->scheme2 ?? '',
                'gst_percent' => $item->gst_percent !== null ? (string)$item->gst_percent : '',
                'gst_amount' => $item->gst_amount !== null ? (string)$item->gst_amount : '',
                'adv_tax_filer' => $item->adv_tax_filer !== null ? (string)$item->adv_tax_filer : '',
                'adv_tax_non_filer' => $item->adv_tax_non_filer !== null ? (string)$item->adv_tax_non_filer : '',
                'adv_tax_manufacturer' => $item->adv_tax_manufacturer !== null ? (string)$item->adv_tax_manufacturer : '',
                'is_import' => $item->is_import ? '1' : '0',
                'is_fridge' => $item->is_fridge ? '1' : '0',
                'is_recipe' => $item->is_recipe ? '1' : '0',
                'is_active' => $item->is_active ? '1' : '0',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Title*',
            'Code',
            'Short Name',
            'Category Name*',
            'Company Name*',
            'Trade Price*',
            'Retail Price*',
            'Discount %',
            'Packing Qty*',
            'Packing Size*',
            'Reorder Level*',
            'Formation',
            'Type',
            'Shelf',
            'Pcs',
            'Limit Pcs',
            'Order Qty',
            'Weight (kg)',
            'Stock 1 (Full)',
            'Stock 2 (Loose)',
            'TP 2 (%)',
            'TP 3 (%)',
            'TP 4 (%)',
            'TP 5 (%)',
            'TP 6 (%)',
            'TP 7 (%)',
            'Scheme',
            'Scheme 2',
            'GST %',
            'GST Amount',
            'Adv Tax Filer %',
            'Adv Tax Non Filer %',
            'Adv Tax Manufacturer %',
            'Is Import (1/0)',
            'Is Fridge (1/0)',
            'Is Recipe (1/0)',
            'Is Active (1/0)',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 28, // Title
            'B' => 14, // Code
            'C' => 16, // Short Name
            'D' => 20, // Category Name
            'E' => 25, // Company Name
            'F' => 14, // Trade Price
            'G' => 14, // Retail Price
            'H' => 12, // Discount %
            'I' => 14, // Packing Qty
            'J' => 14, // Packing Size
            'K' => 14, // Reorder Level
            'L' => 14, // Formation
            'M' => 12, // Type
            'N' => 14, // Shelf
            'O' => 10, // Pcs
            'P' => 12, // Limit Pcs
            'Q' => 12, // Order Qty
            'R' => 12, // Weight
            'S' => 14, // Stock 1
            'T' => 14, // Stock 2
            'U' => 12, // TP 2
            'V' => 12, // TP 3
            'W' => 12, // TP 4
            'X' => 12, // TP 5
            'Y' => 12, // TP 6
            'Z' => 12, // TP 7
            'AA' => 22, // Scheme
            'AB' => 22, // Scheme 2
            'AC' => 10, // GST %
            'AD' => 14, // GST Amount
            'AE' => 16, // Adv Tax Filer
            'AF' => 18, // Adv Tax Non Filer
            'AG' => 20, // Adv Tax Manufacturer
            'AH' => 15, // Is Import
            'AI' => 15, // Is Fridge
            'AJ' => 15, // Is Recipe
            'AK' => 15, // Is Active
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = max($sheet->getHighestRow(), 3);

        // Header Row Styling
        $sheet->getStyle('A1:AK1')->applyFromArray([
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
        $sheet->getStyle("A2:AK{$highestRow}")->applyFromArray([
            'font' => ['name' => 'Calibri', 'size' => 10],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        return [];
    }
}
