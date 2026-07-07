<?php

namespace App\Exports;

use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class SalesReportExport implements FromView, ShouldAutoSize, WithStyles, WithColumnWidths, WithColumnFormatting
{
    protected $data;
    protected $type;
    protected $params;
    protected $title;

    public function __construct($data, $type, $params = [], $title = '')
    {
        $this->data = $data;
        $this->type = $type;
        $this->params = $params;
        $this->title = $title;
    }

    public function view(): View
    {
        $viewPath = "pdf.sales.types.{$this->type}";
        if (!view()->exists($viewPath)) {
            $viewPath = 'pdf.sales.types.default';
        }

        return view($viewPath, [
            'data' => $this->data,
            'params' => $this->params,
            'type' => $this->type,
            'title' => $this->title,
            'logo_base64' => null,
            'isExcel' => true
        ]);
    }

    public function columnWidths(): array
    {
        switch ($this->type) {
            case 'details_wise':
                return [
                    'A' => 8,
                    'B' => 15,
                    'C' => 15,
                    'D' => 12,
                    'E' => 12,
                    'F' => 18,
                    'G' => 15,
                    'H' => 18,
                ];
            case 'detail':
                return [
                    'A' => 8,
                    'B' => 12,
                    'C' => 15,
                    'D' => 30,
                    'E' => 35,
                    'F' => 12,
                    'G' => 12,
                    'H' => 15,
                    'I' => 15,
                    'J' => 18,
                ];
            case 'company':
                return [
                    'A' => 10,
                    'B' => 50,
                    'C' => 20,
                    'D' => 15,
                ];
            case 'recovery':
                return [
                    'A' => 10,
                    'B' => 20,
                    'C' => 40,
                    'D' => 15,
                    'E' => 15,
                    'F' => 15,
                    'G' => 15,
                    'H' => 15,
                    'I' => 20,
                ];
            default:
                return [
                    'A' => 25,
                    'B' => 45,
                    'C' => 15,
                    'D' => 20,
                ];
        }
    }

    public function columnFormats(): array
    {
        switch ($this->type) {
            case 'details_wise':
                return [
                    'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                ];
            case 'detail':
                return [
                    'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                ];
            case 'company':
                return [
                    'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'D' => '0.00',
                ];
            case 'recovery':
                return [
                    'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'G' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'H' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                ];
            case 'salesman':
                return [
                    'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'E' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'F' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                ];
            default:
                return [
                    'C' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                    'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
                ];
        }
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
        $sheet->getStyle('A1:A4')->getFont()->setBold(true)->setSize(12);
        
        foreach ($sheet->getRowIterator() as $row) {
            $rowIndex = $row->getRowIndex();
            $cellA = $sheet->getCell('A' . $rowIndex)->getValue();
            $cellB = $sheet->getCell('B' . $rowIndex)->getValue();
            
            // Detection of Table Header (S.# or S# or Client or Account)
            if (in_array(strtoupper((string)$cellA), ['S.#', 'S#']) || in_array(strtoupper((string)$cellB), ['CLIENT', 'ACCOUNT'])) {
                $sheet->getStyle("A{$rowIndex}:{$highestColumn}{$rowIndex}")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '1E293B'],
                    ],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);
            }

            // Detection of Total Row (usually starts with "Total" in some column)
            // Or if it's the last row and contains sums
            if (str_contains(strtoupper((string)$cellA), 'TOTAL') || str_contains(strtoupper((string)$cellB), 'TOTAL')) {
                $sheet->getStyle("A{$rowIndex}:{$highestColumn}{$rowIndex}")->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F1F5F9'],
                    ],
                    'borders' => [
                        'top' => ['borderStyle' => Border::BORDER_THICK],
                    ],
                ]);
            }
        }

        // Add borders to the entire data range
        $sheet->getStyle("A5:{$highestColumn}{$highestRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        return [];
    }
}
