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

class PurchaseReturnReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents, WithCustomStartCell
{
    protected $data;
    protected $type;
    protected $totals;

    public function __construct($data, $type)
    {
        $this->type = $type;
        $rawData = collect($data);
        $this->data = $rawData;
        
        $this->totals = [
            'amount' => $rawData->sum('amount') ?: $rawData->sum('net_amount') ?: $rawData->sum('total_amount'),
            'qty' => $rawData->sum('qty') ?: $rawData->sum('total_qty') ?: $rawData->sum('qty_full'),
        ];
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
        switch ($this->type) {
            case 'bill': return ['S.#', 'Inv #', 'Date', 'Supplier', 'Gross', 'Discount', 'Net Return'];
            case 'date': return ['S.#', 'Date', 'Invoices Returned', 'Net Reversal'];
            case 'details': return ['S.#', 'Inv #', 'Date', 'Supplier', 'Item', 'Qty F', 'Qty P', 'Rate', 'Disc', 'Net Value'];
            case 'invoice_details': return ['S.#', 'Inv #', 'Date', 'Supplier', 'Item', 'Qty F', 'Qty P', 'Rate', 'Disc', 'Net Value'];
            case 'item': return ['S.#', 'Item Description', 'Packing', 'Full', 'Pcs', 'Gross Value', 'Disc Amt', 'Net Reversal'];
            case 'month': return ['S.#', 'Month', 'Supplier', 'Gross', 'Discount', 'Net Return'];
            case 'payment': return ['S.#', 'Inv #', 'Date', 'Supplier', 'Net Return', 'Refund Recv', 'Pending Credit'];
            default: return ['S.#'];
        }
    }

    private $rowIndex = 0;

    public function map($row): array
    {
        $this->rowIndex++;

        switch ($this->type) {
            case 'bill':
                return [$this->rowIndex, $row['invoice'], $row['date'], $row['account_name'], $row['gross'], $row['discount'], $row['amount']];
            case 'date':
                return [$this->rowIndex, $row['date_display'] ?? $row['date'], $row['total_bills'], $row['total_amount']];
            case 'details':
            case 'invoice_details':
                return [$this->rowIndex, $row['invoice'], $row['date'], $row['account_name'], $row['product_name'], $row['qty_full'], $row['qty_pcs'], $row['rate'], $row['disc_1'], $row['amount']];
            case 'item':
                return [$this->rowIndex, $row['name'], $row['packing'], $row['qty_full'], $row['qty_pcs'], $row['gross_amount'], $row['discount_amount'], $row['net_amount']];
            case 'month':
                return [$this->rowIndex, $row['month_name'], $row['account_name'], $row['gross_amount'], $row['discount_amount'], $row['total_amount']];
            case 'payment':
                return [$this->rowIndex, $row['invoice'], $row['date'], $row['account_name'], $row['total_amount'], $row['paid_amount'], $row['balance']];
            default:
                return [$this->rowIndex];
        }
    }

    public function styles(Worksheet $sheet)
    {
        return [
            5 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'be123c']], // Rose-700
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
                    'bill' => 'G',
                    'date' => 'D',
                    'details' => 'J',
                    'item' => 'H',
                ];
                
                $lastCol = $colMapping[$this->type] ?? 'D';
                $lastRow = $this->data->count() + 5;
                
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
                $sheet->setCellValue('A2', 'PROCUREMENT REVERSAL ANALYSIS');
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '64748b']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue('A3', 'PURCHASE RETURN REPORT (' . strtoupper($this->type) . ')');
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'e11d48']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // 2. DATA BORDERS & ALIGNMENT
                $sheet->getStyle("A5:{$lastCol}{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'e2e8f0']],
                    ],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);
                
                // 3. FOOTER / TOTALS
                $footerRow = $lastRow + 1;
                $sheet->getStyle("A{$footerRow}:{$lastCol}{$footerRow}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'fff1f2']], // Rose-50
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'e2e8f0']],
                        'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => 'e11d48']],
                    ],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->setCellValue('A' . $footerRow, 'GRAND TOTALS');
                if ($this->type === 'bill') {
                    $sheet->mergeCells("A{$footerRow}:D{$footerRow}");
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('gross'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('discount'));
                    $sheet->setCellValue('G' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'date') {
                    $sheet->mergeCells("A{$footerRow}:B{$footerRow}");
                    $sheet->setCellValue('C' . $footerRow, $this->data->sum('total_bills'));
                    $sheet->setCellValue('D' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'details') {
                    $sheet->mergeCells("A{$footerRow}:E{$footerRow}");
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('qty_full'));
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('qty_pcs'));
                    $sheet->setCellValue('J' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'item') {
                    $sheet->mergeCells("A{$footerRow}:C{$footerRow}");
                    $sheet->setCellValue('D' . $footerRow, $this->data->sum('qty_full'));
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('qty_pcs'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('gross_amount'));
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('discount_amount'));
                    $sheet->setCellValue('H' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'month') {
                    $sheet->mergeCells("A{$footerRow}:C{$footerRow}");
                    $sheet->setCellValue('D' . $footerRow, $this->data->sum('gross_amount'));
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('discount_amount'));
                    $sheet->setCellValue('F' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'payment') {
                    $sheet->mergeCells("A{$footerRow}:D{$footerRow}");
                    $sheet->setCellValue('E' . $footerRow, $this->totals['amount']);
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('paid_amount'));
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('balance'));
                }
            },
        ];
    }
}
