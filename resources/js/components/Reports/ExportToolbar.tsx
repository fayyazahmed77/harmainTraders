import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet } from 'lucide-react';

interface ExportToolbarProps {
    onExportPDF: () => void;
    onExportExcel: () => void;
    isExporting?: boolean;
}

export function ExportToolbar({ onExportPDF, onExportExcel, isExporting }: ExportToolbarProps) {
    return (
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={onExportPDF} disabled={isExporting}>
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel} disabled={isExporting}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Excel
            </Button>
        </div>
    );
}
