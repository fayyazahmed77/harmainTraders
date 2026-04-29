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

class ProfitReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents, WithCustomStartCell
{
    protected $data;
    protected $type;
    protected $totals;

    public function __construct($data, $type)
    {
        $this->data = collect($data);
        $this->type = $type;
        
        $this->totals = [
            'revenue' => $this->data->sum('revenue'),
            'cogs' => $this->data->sum('cogs'),
            'profit' => $this->data->sum('profit'),
        ];
        $this->totals['margin'] = $this->totals['revenue'] > 0 
            ? ($this->totals['profit'] / $this->totals['revenue']) * 100 
            : 0;
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
        // Headers start from row 5 because of our custom header
        if ($this->type === 'transaction') {
            return [
                'S.#', 'Invoice #', 'Date', 'Customer/Account', 'Product Name', 
                'Qty', 'Sale Rate', 'Total Sales', 'Purchase Rate', 
                'Total COGS', 'Gross Profit', 'Margin %'
            ];
        }

        if ($this->type === 'month') {
            return [
                'S.#', 'Month', 'Sale Amount', 'Pur Amount', 
                'Gross Profit', 'Margin %', 'Expense', 
                'Net Profit', 'Net Margin %'
            ];
        }

        return count($this->data) > 0 ? array_merge(['S.#'], array_keys((array)$this->data->first())) : [];
    }

    private $rowIndex = 0;

    public function map($row): array
    {
        $this->rowIndex++;

        if ($this->type === 'transaction') {
            return [
                $this->rowIndex,
                $row['invoice'] ?? '',
                $row['date'] ?? '',
                $row['customer_name'] ?? '',
                $row['product_name'] ?? '',
                $row['qty'] ?? 0,
                $row['sale_rate'] ?? 0,
                $row['revenue'] ?? 0,
                $row['purchase_rate'] ?? 0,
                $row['cogs'] ?? 0,
                $row['profit'] ?? 0,
                number_format($row['margin'] ?? 0, 1) . '%'
            ];
        }

        if ($this->type === 'month') {
            return [
                $this->rowIndex,
                $row['month'] ?? '', // Corrected key from 'month_name' to 'month'
                $row['revenue'] ?? 0,
                $row['cogs'] ?? 0,
                $row['profit'] ?? 0,
                number_format($row['margin'] ?? 0, 1) . '%',
                $row['expense'] ?? 0,
                $row['net_profit'] ?? 0,
                number_format($row['net_margin'] ?? 0, 1) . '%'
            ];
        }

        return array_merge([$this->rowIndex], array_values((array)$row));
    }

    public function styles(Worksheet $sheet)
    {
        return [
            5 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1e293b']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                $colMapping = [
                    'transaction' => 'L',
                    'month' => 'I',
                    'party' => 'F',
                    'salesman' => 'F',
                    'company' => 'F',
                    'date' => 'F'
                ];
                
                $lastCol = $colMapping[$this->type] ?? 'K';
                $lastRow = $this->data->count() + 5;
                
                // 0. Global Setup - Set row heights
                $sheet->getRowDimension(1)->setRowHeight(30);
                $sheet->getRowDimension(2)->setRowHeight(20);
                $sheet->getRowDimension(3)->setRowHeight(25);
                $sheet->getRowDimension(5)->setRowHeight(25);

                // 1. BRANDED HEADER
                $sheet->mergeCells("A1:{$lastCol}1");
                $sheet->setCellValue('A1', 'HARMAIN TRADERS');
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 22, 'color' => ['rgb' => '1e293b']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->mergeCells("A2:{$lastCol}2");
                $sheet->setCellValue('A2', 'WHOLESALE & SUPPLY CHAIN');
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '64748b']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue('A3', 'PROFIT & LOSS ANALYSIS REPORT (' . strtoupper($this->type) . ')');
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '4f46e5']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // 2. DATA BORDERS & ALIGNMENT
                $sheet->getStyle("A5:{$lastCol}{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']],
                    ],
                ]);
                
                // Center align all numeric headers
                $sheet->getStyle("F5:{$lastCol}5")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // 3. CONDITIONAL FORMATTING (Green/Red for Profit)
                $profitCol = $this->type === 'transaction' ? 'K' : ($this->type === 'month' ? 'E' : 'E');
                // For month, we have two profit columns (Gross and Net)
                // Gross Profit is E, Net Profit is H
                
                for ($i = 6; $i <= $lastRow; $i++) {
                    if ($this->type === 'month') {
                        // Gross Profit
                        $grossProfit = (float)$sheet->getCell("E{$i}")->getValue();
                        $color = $grossProfit >= 0 ? '059669' : 'e11d48';
                        $sheet->getStyle("E{$i}")->getFont()->getColor()->setRGB($color);
                        $sheet->getStyle("F{$i}")->getFont()->getColor()->setRGB($color);
                        
                        // Net Profit
                        $netProfit = (float)$sheet->getCell("H{$i}")->getValue();
                        $colorNet = $netProfit >= 0 ? '059669' : 'e11d48';
                        $sheet->getStyle("H{$i}")->getFont()->getColor()->setRGB($colorNet);
                        $sheet->getStyle("I{$i}")->getFont()->getColor()->setRGB($colorNet);
                    } else if ($this->type === 'transaction') {
                        $profit = (float)$sheet->getCell("K{$i}")->getValue();
                        $color = $profit >= 0 ? '059669' : 'e11d48';
                        $sheet->getStyle("K{$i}")->getFont()->getColor()->setRGB($color);
                        $sheet->getStyle("L{$i}")->getFont()->getColor()->setRGB($color);
                    }
                }

                // 4. FOOTER / TOTALS
                $footerRow = $lastRow + 1;
                $sheet->getStyle("A{$footerRow}:{$lastCol}{$footerRow}")->applyFromArray([
                    'font' => ['bold' => true],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'f8fafc']],
                    'borders' => [
                        'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '000000']],
                    ],
                ]);

                if ($this->type === 'transaction') {
                    $sheet->setCellValue('A' . $footerRow, 'GRAND TOTALS');
                    $sheet->mergeCells("A{$footerRow}:G{$footerRow}");
                    $sheet->setCellValue('H' . $footerRow, $this->totals['revenue']);
                    $sheet->setCellValue('J' . $footerRow, $this->totals['cogs']);
                    $sheet->setCellValue('K' . $footerRow, $this->totals['profit']);
                    $sheet->setCellValue('L' . $footerRow, number_format($this->totals['margin'], 1) . '%');
                } else if ($this->type === 'month') {
                    $sheet->setCellValue('A' . $footerRow, 'GRAND TOTALS');
                    $sheet->mergeCells("A{$footerRow}:B{$footerRow}");
                    $sheet->setCellValue('C' . $footerRow, $this->totals['revenue']);
                    $sheet->setCellValue('D' . $footerRow, $this->totals['cogs']);
                    $sheet->setCellValue('E' . $footerRow, $this->totals['profit']);
                    $sheet->setCellValue('F' . $footerRow, number_format($this->totals['margin'], 1) . '%');
                    
                    $totalExpense = $this->data->sum('expense');
                    $totalNetProfit = $this->totals['profit'] - $totalExpense;
                    $totalNetMargin = $this->totals['revenue'] > 0 ? ($totalNetProfit / $this->totals['revenue']) * 100 : 0;
                    
                    $sheet->setCellValue('G' . $footerRow, $totalExpense);
                    $sheet->setCellValue('H' . $footerRow, $totalNetProfit);
                    $sheet->setCellValue('I' . $footerRow, number_format($totalNetMargin, 1) . '%');
                }
            },
        ];
    }
}
