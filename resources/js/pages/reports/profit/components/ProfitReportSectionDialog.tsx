import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { profitReports } from '../constants/profitReports';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface ProfitReportSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentReportId: string;
    onSelect: (id: string) => void;
}

export function ProfitReportSectionDialog({ 
    open, 
    onOpenChange, 
    currentReportId, 
    onSelect 
}: ProfitReportSectionDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl bg-card border-border/50 shadow-2xl p-0 overflow-hidden rounded-sm">
                <div className="p-8 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-text-primary flex items-center gap-3 italic">
                            <div className="h-9 w-9 bg-indigo-500/10 rounded-sm flex items-center justify-center border border-indigo-500/20">
                                <ChevronRight className="h-4 w-4 text-indigo-500" />
                            </div>
                            SELECT REPORT MODULE
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-3 opacity-60">
                             Choose the profit analysis dimension you want to explore today.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 mb-6 mx-4">
                    {profitReports.map((report, idx) => {
                        const isSelected = currentReportId === report.id;
                        return (
                            <motion.button
                                key={report.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => {
                                    onSelect(report.id);
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "group relative flex items-start gap-4 p-4 rounded-sm border transition-all duration-300 text-left overflow-hidden",
                                    isSelected 
                                        ? "bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-500/20" 
                                        : "bg-surface-1/40 border-border/40 hover:border-indigo-500/50 hover:bg-surface-1"
                                )}
                            >
                                <div className={cn(
                                    "h-10 w-10 rounded-sm flex items-center justify-center transition-all duration-500 shrink-0 border",
                                    isSelected ? "bg-white/20 border-white/20 text-white" : "bg-card border-border/30 text-text-muted group-hover:text-indigo-500"
                                )}>
                                    <report.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={cn(
                                        "text-[11px] font-black uppercase tracking-widest transition-colors mb-0.5",
                                        isSelected ? "text-white" : "text-text-primary group-hover:text-indigo-500"
                                    )}>
                                        {report.title}
                                    </h4>
                                    <p className={cn(
                                        "text-[10px] font-bold leading-relaxed line-clamp-2",
                                        isSelected ? "text-white/70" : "text-text-muted"
                                    )}>
                                        {report.description}
                                    </p>
                                </div>
                                
                                {isSelected && (
                                    <div className="absolute top-2 right-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
