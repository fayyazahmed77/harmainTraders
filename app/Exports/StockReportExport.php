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

        $colspan = 7;
        if (isset($this->params['withAmount']) && $this->params['withAmount']) {
            $colspan = 8;
        }
        if ($this->type === 'detail') {
            $colspan = 9;
        } elseif (in_array($this->type, ['available_stock', 'price_list', 're_order_level'])) {
            $colspan = 10;
        }

        return view($view, [
            'data' => $this->data,
            'title' => 'Stock Report - ' . strtoupper($this->type),
            'valuation' => $this->valuation,
            'fromDate' => $this->fromDate,
            'toDate' => $this->toDate,
            'params' => $this->params,
            'is_excel' => true,
            'colspan' => $colspan
        ]);
    }

    public function columnWidths(): array
    {
        switch ($this->type) {
            case 'detail':
                return [
                    'A' => 12, // Date
                    'B' => 30, // Account
                    'C' => 30, // Item
                    'D' => 12, // Rate
                    'E' => 10, // In
                    'F' => 10, // Out
                    'G' => 12, // Balance
                    'H' => 15, // Amount
                    'I' => 15, // Profit/Loss
                ];
            case 're_order_level':
                return [
                    'A' => 8,  // S.#
                    'B' => 40, // Item
                    'C' => 12, // Rate
                    'D' => 10, // Packing
                    'E' => 12, // Re-Order
                    'F' => 12, // Balance
                    'G' => 12, // Shortfall
                    'H' => 15, // Amount
                ];
            case 'price_list':
                return [
                    'A' => 8, 'B' => 50, 'C' => 30, 'D' => 10, 'E' => 15, 'F' => 15, 'G' => 15,
                ];
            default:
                $widths = [
                    'A' => 8, 'B' => 50, 'C' => 15, 'D' => 10, 'E' => 12, 'F' => 12, 'G' => 15,
                ];
                if (isset($this->params['withAmount']) && $this->params['withAmount']) {
                    $widths['H'] = 18;
                }
                return $widths;
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
            ];
        }
        $formats = [
            'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
        if (isset($this->params['withAmount']) && $this->params['withAmount']) {
            $formats['H'] = NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1;
        }
        return $formats;
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
