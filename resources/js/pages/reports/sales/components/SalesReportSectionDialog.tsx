import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { salesReports } from '../constants/salesReports';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface SalesReportSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: string) => void;
    currentReportId: string;
}

export function SalesReportSectionDialog({ 
    open, 
    onOpenChange, 
    onSelect, 
    currentReportId 
}: SalesReportSectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl bg-surface-1/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden rounded-sm">
                <DialogHeader className="p-6 border-b border-border/10 bg-surface-1">
                    <DialogTitle className="text-xl font-black text-text-primary uppercase tracking-tighter italic">
                        Select <span className="text-indigo-600">Sales Module</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">
                        Choose the dimension of analysis for your sales data
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-6 bg-surface-0/50 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {salesReports.map((report) => {
                        const Icon = (LucideIcons as any)[report.icon] || LucideIcons.FileText;
                        const isActive = currentReportId === report.id;

                        return (
                            <button
                                key={report.id}
                                onClick={() => {
                                    onSelect(report.id);
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "flex items-start gap-4 p-4 rounded-sm transition-all text-left border relative overflow-hidden group",
                                    isActive 
                                        ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]" 
                                        : "bg-surface-1 border-border/20 hover:border-indigo-500/30 hover:bg-indigo-500/5"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-sm flex items-center justify-center shrink-0 border transition-all",
                                    isActive 
                                        ? "bg-indigo-600 border-indigo-400 text-white shadow-lg" 
                                        : "bg-surface-1 border-border/10 text-text-muted group-hover:text-indigo-600 group-hover:border-indigo-500/20"
                                )}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col gap-1 min-w-0">
                                    <span className={cn(
                                        "text-[11px] font-black uppercase tracking-tight leading-tight",
                                        isActive ? "text-indigo-600" : "text-text-primary group-hover:text-indigo-600"
                                    )}>
                                        {report.title}
                                    </span>
                                    <span className="text-[9px] font-medium text-text-secondary leading-tight opacity-60">
                                        {report.description}
                                    </span>
                                </div>

                                {isActive && (
                                    <div className="absolute top-2 right-2">
                                        <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
