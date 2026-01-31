<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PurchaseReportExport implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data['purchases'])->map(function ($purchase) {
            return [
                'Date' => $purchase->date,
                'Invoice' => $purchase->invoice,
                'Supplier' => $purchase->supplier_name,
                'Items' => $purchase->no_of_items,
                'Gross Total' => $purchase->gross_total,
                'Discount' => $purchase->discount_total,
                'Net Total' => $purchase->net_total,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Invoice',
            'Supplier',
            'Items',
            'Gross Total',
            'Discount',
            'Net Total',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function title(): string
    {
        return 'Purchase Report';
    }
}
