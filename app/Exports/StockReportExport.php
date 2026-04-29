<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class StockReportExport implements FromView, WithColumnWidths, WithStyles, WithColumnFormatting
{
    protected $data;
    protected $type;
    protected $valuation;
    protected $fromDate;
    protected $toDate;
    protected $params;

    public function __construct($data, $type, $valuation, $fromDate, $toDate, $params = [])
    {
        $this->data = $data;
        $this->type = $type;
        $this->valuation = $valuation;
        $this->fromDate = $fromDate;
        $this->toDate = $toDate;
        $this->params = $params;
    }

    public function view(): View
    {
        $view = "pdf.stock.types.{$this->type}";
        if (!view()->exists($view)) {
            $view = "pdf.stock.types.summary";
        }

        return view($view, [
            'data' => $this->data,
            'title' => 'Stock Report - ' . strtoupper($this->type),
            'valuation' => $this->valuation,
            'fromDate' => $this->fromDate,
            'toDate' => $this->toDate,
            'params' => $this->params,
            'is_excel' => true
        ]);
    }

    public function columnWidths(): array
    {
        switch ($this->type) {
            case 'detail':
                return [
                    'A' => 12, // Date
                    'B' => 12, // Voucher
                    'C' => 40, // Account
                    'D' => 12, // Rate
                    'E' => 10, // In
                    'F' => 10, // Out
                    'G' => 12, // Balance
                    'H' => 12, // COGS
                    'I' => 15, // Amount
                    'J' => 15, // Profit/Loss
                ];
            case 'price_list':
                return [
                    'A' => 8, 'B' => 50, 'C' => 30, 'D' => 10, 'E' => 15, 'F' => 15, 'G' => 15,
                ];
            default:
                return [
                    'A' => 8, 'B' => 50, 'C' => 30, 'D' => 10, 'E' => 15, 'F' => 15, 'G' => 20,
                ];
        }
    }

    public function columnFormats(): array
    {
        if ($this->type === 'detail') {
            return [
                'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            ];
        }
        return [
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // Base styles
        $sheet->getStyle("A1:{$highestColumn}{$highestRow}")->applyFromArray([
            'font' => ['name' => 'Calibri', 'size' => 10],
            'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
        ]);

        // Title and Header Styling
        $sheet->getStyle('A1:A4')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1:A4')->getFont()->getColor()->setRGB('059669');
        
        foreach ($sheet->getRowIterator() as $row) {
            $rowIndex = $row->getRowIndex();
            $cellA = $sheet->getCell('A' . $rowIndex)->getValue();
            
            // Detection of Table Header
            if (in_array(strtoupper((string)$cellA), ['S.#', 'S.N', 'DATE'])) {
                $sheet->getStyle("A{$rowIndex}:{$highestColumn}{$rowIndex}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '059669'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
            }

            // Detection of Total Row
            if (str_contains(strtoupper((string)$cellA), 'TOTAL')) {
                $sheet->getStyle("A{$rowIndex}:{$highestColumn}{$rowIndex}")->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'ECFDF5'],
                    ],
                    'borders' => [
                        'top' => ['borderStyle' => Border::BORDER_THICK, 'color' => ['rgb' => '059669']],
                    ],
                ]);
            }
        }

        // Add borders to the data range
        $sheet->getStyle("A5:{$highestColumn}{$highestRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        return [];
    }
}
