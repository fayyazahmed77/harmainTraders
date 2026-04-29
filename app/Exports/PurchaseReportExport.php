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

class PurchaseReportExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles, WithEvents, WithCustomStartCell
{
    protected $data;
    protected $type;
    protected $totals;

    public function __construct($data, $type)
    {
        $this->type = $type;
        $rawData = collect($data);

        if ($this->type === 'invoice_details') {
            $processed = collect();
            $grouped = $rawData->groupBy('invoice');
            
            foreach ($grouped as $invoice => $items) {
                $first = $items->first();
                $invTotal = $items->sum('amount');
                
                // Add Header Row marker
                $processed->push([
                    'is_header' => true,
                    'invoice' => $invoice,
                    'date' => $first['date'],
                    'account_name' => $first['account_name'],
                    'total_amount' => $invTotal
                ]);

                // Add Items
                foreach ($items as $item) {
                    $item['is_item'] = true;
                    $processed->push($item);
                }

                // Add Spacer/Total Row marker
                $processed->push(['is_spacer' => true]);
            }
            $this->data = $processed;
        } else {
            $this->data = $rawData;
        }
        
        $this->totals = [
            'amount' => $rawData->sum('amount'),
            'qty' => $rawData->sum('qty'),
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
            case 'bill': return ['S.#', 'Inv #', 'Date', 'Account', 'Gross', 'Discount', 'Net Amount', 'Cash Paid'];
            case 'date': return ['S.#', 'Date', 'Amount'];
            case 'details': return ['S.#', 'Inv #', 'Inv Date', 'PARTY', 'Item', 'T.P.', 'Qty F', 'Qty P', 'Rate', 'B.Full', 'B.Pcs', 'Disc 1', 'Tax Amt', 'Amount'];
            case 'invoice_details': return ['S.#', 'Inv #', 'Inv Date', 'PARTY', 'Item', 'T.P.', 'Qty F', 'Qty P', 'Rate', 'B.Full', 'B.Pcs', 'Disc', 'Tax', 'Amount'];
            case 'item': return ['S.#', 'Item Description', 'Packing', 'Full', 'Pcs', 'Gross Amount', 'Disc Amt', 'Net Amount'];
            case 'month': return ['S.#', 'Month', 'Account', 'Amount', 'Discount', 'Tax', 'Total', 'Paid', 'Balance'];
            case 'payment': return ['S.#', 'Area', 'Account', 'Contact', 'Purchases', 'Payment', 'Balance'];
            default: return ['S.#'];
        }
    }

    private $rowIndex = 0;

    public function map($row): array
    {
        if ($this->type === 'invoice_details') {
            if (isset($row['is_header'])) {
                return [
                    'INV: ' . $row['invoice'],
                    'DATE: ' . \Carbon\Carbon::parse($row['date'])->format('d-M-Y'),
                    'PARTY: ' . strtoupper($row['account_name']),
                    '', '', '', '', '', '', '', '', '', 
                    'INV TOTAL:',
                    $row['total_amount']
                ];
            }
            if (isset($row['is_spacer'])) {
                return ['', '', '', '', '', '', '', '', '', '', '', '', '', ''];
            }
            
            // Standard Item Row
            $this->rowIndex++;
            return [
                $this->rowIndex,
                $row['product_name'],
                $row['tp'],
                $row['qty_full'],
                $row['qty_pcs'],
                $row['rate'],
                $row['b_full'],
                $row['b_pcs'],
                $row['disc_1'],
                $row['tax_amt'],
                $row['amount']
            ];
        }

        $this->rowIndex++;

        switch ($this->type) {
            case 'bill':
                return [$this->rowIndex, $row['invoice'], $row['date'], $row['account_name'], $row['gross'], $row['discount'], $row['amount'], $row['paid_amount']];
            case 'date':
                return [$this->rowIndex, $row['date'], $row['total_amount']];
            case 'details':
                return [$this->rowIndex, $row['invoice'], $row['date'], $row['account_name'], $row['product_name'], $row['tp'], $row['qty_full'], $row['qty_pcs'], $row['rate'], $row['b_full'], $row['b_pcs'], $row['disc_1'], $row['tax_amt'], $row['amount']];
            case 'item':
                return [$this->rowIndex, $row['name'], $row['packing'], $row['qty_full'], $row['qty_pcs'], $row['gross_amount'], $row['discount_amount'], $row['net_amount']];
            case 'month':
                return [$this->rowIndex, $row['month_name'], $row['account_name'], $row['gross_amount'], $row['discount_amount'], $row['tax_amount'], $row['total_amount'], $row['paid_amount'], $row['balance']];
            case 'payment':
                return [$this->rowIndex, $row['area_name'], $row['account_name'], $row['contact'], $row['total_purchase'], $row['total_payment'], $row['balance']];
            default:
                return [$this->rowIndex];
        }
    }

    public function styles(Worksheet $sheet)
    {
        return [
            5 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '064e3b']], // Deep Emerald
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
                    'bill' => 'H',
                    'date' => 'C',
                    'details' => 'N',
                    'invoice_details' => 'N',
                    'item' => 'H',
                    'month' => 'I',
                    'payment' => 'G'
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
                $sheet->setCellValue('A2', 'WHOLESALE & SUPPLY CHAIN');
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '64748b']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->mergeCells("A3:{$lastCol}3");
                $sheet->setCellValue('A3', 'PURCHASE ANALYSIS REPORT (' . strtoupper($this->type) . ')');
                $sheet->getStyle('A3')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => '10b981']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // 2. DATA BORDERS & ALIGNMENT
                $sheet->getStyle("A5:{$lastCol}{$lastRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']],
                    ],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);

                if ($this->type === 'invoice_details') {
                    $currentRow = 6;
                    foreach ($this->data as $row) {
                        if (isset($row['is_header'])) {
                            $sheet->mergeCells("A{$currentRow}:M{$currentRow}");
                            $sheet->getStyle("A{$currentRow}:N{$currentRow}")->applyFromArray([
                                'font' => ['bold' => true, 'size' => 10],
                                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'f1f5f9']],
                                'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                            ]);
                            $sheet->getStyle("N{$currentRow}")->getFont()->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('059669'));
                        }
                        $currentRow++;
                    }
                }
                
                // 3. FOOTER / TOTALS
                $footerRow = $lastRow + 1;
                $sheet->getStyle("A{$footerRow}:{$lastCol}{$footerRow}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 11],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'ecfdf5']],
                    'borders' => [
                        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']],
                        'top' => ['borderStyle' => Border::BORDER_MEDIUM, 'color' => ['rgb' => '000000']],
                    ],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->setCellValue('A' . $footerRow, 'GRAND TOTALS');
                if ($this->type === 'bill') {
                    $sheet->mergeCells("A{$footerRow}:D{$footerRow}");
                    $sheet->getStyle('E' . $footerRow . ':H' . $footerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('gross'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('discount'));
                    $sheet->setCellValue('G' . $footerRow, $this->totals['amount']);
                    $sheet->setCellValue('H' . $footerRow, $this->data->sum('paid_amount'));
                } else if ($this->type === 'date') {
                    $sheet->mergeCells("A{$footerRow}:B{$footerRow}");
                    $sheet->setCellValue('C' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'details') {
                    $sheet->mergeCells("A{$footerRow}:F{$footerRow}");
                    $sheet->getStyle('G' . $footerRow . ':N' . $footerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('qty_full'));
                    $sheet->setCellValue('H' . $footerRow, $this->data->sum('qty_pcs'));
                    $sheet->setCellValue('J' . $footerRow, $this->data->sum('b_full'));
                    $sheet->setCellValue('K' . $footerRow, $this->data->sum('b_pcs'));
                    $sheet->setCellValue('M' . $footerRow, $this->data->sum('tax_amt'));
                    $sheet->setCellValue('N' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'invoice_details') {
                    $sheet->mergeCells("A{$footerRow}:M{$footerRow}");
                    $sheet->setCellValue('N' . $footerRow, $this->totals['amount']);
                } else if ($this->type === 'item') {
                    $sheet->mergeCells("A{$footerRow}:C{$footerRow}");
                    $sheet->setCellValue('D' . $footerRow, $this->data->sum('qty_full'));
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('qty_pcs'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('gross_amount'));
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('discount_amount'));
                    $sheet->setCellValue('H' . $footerRow, $this->data->sum('net_amount'));
                } else if ($this->type === 'month') {
                    $sheet->mergeCells("A{$footerRow}:C{$footerRow}");
                    $sheet->getStyle('D' . $footerRow . ':I' . $footerRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
                    $sheet->setCellValue('D' . $footerRow, $this->data->sum('gross_amount'));
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('discount_amount'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('tax_amount'));
                    $sheet->setCellValue('G' . $footerRow, $this->totals['amount']);
                    $sheet->setCellValue('H' . $footerRow, $this->data->sum('paid_amount'));
                    $sheet->setCellValue('I' . $footerRow, $this->data->sum('balance'));
                } else if ($this->type === 'payment') {
                    $sheet->mergeCells("A{$footerRow}:D{$footerRow}");
                    $sheet->setCellValue('E' . $footerRow, $this->data->sum('total_purchase'));
                    $sheet->setCellValue('F' . $footerRow, $this->data->sum('total_payment'));
                    $sheet->setCellValue('G' . $footerRow, $this->data->sum('balance'));
                } else {
                    $sheet->mergeCells("A{$footerRow}:B{$footerRow}");
                    $sheet->setCellValue('C' . $footerRow, $this->data->sum('total_bills') ?: $this->data->sum('total_qty'));
                    $sheet->setCellValue('D' . $footerRow, $this->totals['amount']);
                }
            },
        ];
    }
}
