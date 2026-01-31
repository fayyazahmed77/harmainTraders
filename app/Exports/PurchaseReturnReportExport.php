<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PurchaseReturnReportExport implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data['returns'])->map(function ($return) {
            return [
                'Date' => $return->date,
                'Invoice' => $return->invoice,
                'Supplier' => $return->supplier_name,
                'Items' => $return->no_of_items,
                'Gross Total' => $return->gross_total,
                'Discount' => $return->discount_total,
                'Net Total' => $return->net_total,
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
        return 'Purchase Return Report';
    }
}
