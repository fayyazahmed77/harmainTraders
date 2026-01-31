import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface PDFPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string | null;
    title?: string;
}

export function PDFPreviewModal({ isOpen, onClose, pdfUrl, title = "Report Preview" }: PDFPreviewModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 h-full w-full">
                    {pdfUrl ? (
                        <iframe src={pdfUrl} className="w-full h-full border-none" title="PDF Preview" />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            Loading PDF...
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
