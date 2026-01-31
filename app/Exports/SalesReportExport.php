<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportExport implements FromCollection, WithHeadings, WithStyles, WithTitle
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function collection()
    {
        return collect($this->data['sales'])->map(function ($sale) {
            return [
                'Date' => $sale->date,
                'Invoice' => $sale->invoice,
                'Customer' => $sale->customer_name,
                'Items' => $sale->no_of_items,
                'Gross Total' => $sale->gross_total,
                'Discount' => $sale->discount_total,
                'Net Total' => $sale->net_total,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Date',
            'Invoice',
            'Customer',
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
        return 'Sales Report';
    }
}
