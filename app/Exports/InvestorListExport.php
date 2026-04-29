<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Maatwebsite\Excel\Events\AfterSheet;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithCustomStartCell;

class InvestorListExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents, WithCustomStartCell
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function startCell(): string
    {
        return 'A5';
    }

    public function collection()
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'S.#',
            'Investor Name',
            'Email',
            'Phone',
            'CNIC',
            'Joining Date',
            'Current Capital (PKR)',
            'Ownership (%)',
            'Status'
        ];
    }

    private $rowIndex = 0;

    public function map($investor): array
    {
        $this->rowIndex++;
        return [
            $this->rowIndex,
            $investor->full_name,
            $investor->user->email,
            $investor->phone,
            $investor->cnic,
            $investor->joining_date->format('d-M-Y'),
            $investor->capitalAccount->current_capital,
            $investor->capitalAccount->ownership_percentage,
            strtoupper($investor->status)
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            5 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'C9A84C']], // Gold
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $lastCol = 'I';
                $lastRow = $this->data->count() + 5;
                
                $sheet->getRowDimension(1)->setRowHeight(35);
                $sheet->getRowDimension(3)->setRowHeight(25);
                $sheet->getRowDimension(5)->setRowHeight(25);

                // Branded Header
                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->setCellValue('A1', 'HARMAIN TRADERS - INVESTOR PORTFOLIO');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 20, 'color' => ['rgb' => '0A0C10']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue('A3', 'MASTER INVESTOR LIST & OWNERSHIP DISTRIBUTION');
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12, 'color' => ['rgb' => '6B7280']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // Borders
                $sheet->getStyle("A5:{$lastCol}{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'E5E7EB']],
                    ],
                ]);

                // Totals Row
                $footerRow = $lastRow + 1;
                $sheet->mergeCells("A{$footerRow}:F{$footerRow}");
                $sheet->setCellValue("A{$footerRow}", "TOTAL MANAGED CAPITAL");
                $sheet->setCellValue("G{$footerRow}", $this->data->sum(function($inv) { return $inv->capitalAccount->current_capital; }));
                $sheet->setCellValue("H{$footerRow}", "100.00%");
                
                $sheet->getStyle("A{$footerRow}:{$lastCol}{$footerRow}")->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F9FAFB']],
                ]);
            },
        ];
    }
}
