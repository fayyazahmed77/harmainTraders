import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Search, 
    FileText, 
    BarChart3, 
    PieChart, 
    ArrowLeftRight, 
    Wallet, 
    TrendingUp, 
    ShoppingCart,
    Package,
    Clock,
    List,
    FileSpreadsheet,
    AlertCircle,
    CalendarDays,
    BookOpen,
    Receipt,
    CreditCard,
    Banknote,
    NotebookText,
    BarChartHorizontal,
    Columns2,
    Columns
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

import { reports } from '../constants/reports';

interface ReportSectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (reportId: string) => void;
    currentReportId: string;
}

export function ReportSectionDialog({ open, onOpenChange, onSelect, currentReportId }: ReportSectionDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const enhancedReports = reports.map(r => ({
        ...r,
        active: r.id.toUpperCase() === currentReportId.toUpperCase()
    }));

    const filteredReports = enhancedReports.filter(report => 
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white w-full">
                <DialogHeader className="p-6 pb-4 bg-slate-900 text-white relative flex flex-col gap-0 border-none shadow-none">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Report Intelligence</DialogTitle>
                            <p className="text-slate-400 text-xs mt-1 font-medium">Select a specialized report module to analyze your business metrics.</p>
                        </div>
                        <Badge variant="outline" className="w-fit text-[10px] border-slate-700 text-slate-400">
                            Enterprise Suite v2.0
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Search report type (e.g. Ledger, Sales, Stock)..." 
                            className="h-10 pl-10 pr-4 bg-slate-800/50 border-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 rounded-lg text-sm transition-all text-white placeholder:text-slate-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </DialogHeader>
                <div className="p-6 bg-slate-50/50 min-h-[400px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "group relative p-4 rounded-xl border bg-white shadow-sm transition-all cursor-pointer hover:shadow-md hover:border-indigo-200",
                                    report.active ? "border-indigo-100 ring-2 ring-indigo-500/10" : "border-slate-100"
                                )}
                                onClick={() => {
                                    onSelect(report.id); 
                                    onOpenChange(false);
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        report.active ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500"
                                    )}>
                                        <report.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-bold text-slate-900 leading-none">{report.title}</h3>
                                            {report.active && (
                                                <Badge className="text-[8px] h-4 bg-indigo-500 text-white border-none uppercase">Current</Badge>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                                            {report.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        {report.category}
                                    </span>
                                    <span className="text-[9px] font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Open Module →
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    {filteredReports.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Search className="h-10 w-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No reports matching "{searchTerm}"</p>
                            <button onClick={() => setSearchTerm('')} className="text-xs text-indigo-500 font-bold mt-2">Clear search</button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
