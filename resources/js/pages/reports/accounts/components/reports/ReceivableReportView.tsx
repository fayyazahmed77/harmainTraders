import React, { useMemo } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '@/components/ui/table';
import { 
    Wallet, 
    Users, 
    TrendingUp, 
    ShieldCheck,
    Layers,
    Search,
    FileText,
    ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ReceivableRow {
    id: number;
    title: string;
    type_name: string;
    debit: number;
    credit: number;
}

interface ReceivableReportViewProps {
    data: ReceivableRow[];
}

export function ReceivableReportView({ data }: ReceivableReportViewProps) {
    const stats = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.debit, 0);
        const count = data.length;
        const avg = count > 0 ? total / count : 0;
        return { total, count, avg };
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-surface-1/30 rounded-3xl border border-border/50">
                <Layers className="h-10 w-10 text-text-muted/20 mb-4" />
                <h3 className="text-sm font-display font-black text-text-muted uppercase tracking-widest">No Intelligence Data</h3>
            </div>
        );
    }

    return (
        <div className="relative -mt-6">
            {/* Intel Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-surface-2 border border-border/40 rounded-2xl p-4 flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Wallet className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Receivable</p>
                        <p className="text-lg font-display font-black text-text tabular-nums leading-none mt-1">
                            {stats.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>
                
                <div className="bg-surface-2 border border-border/40 rounded-2xl p-4 flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Active Parties</p>
                        <p className="text-lg font-display font-black text-text leading-none mt-1">
                            {stats.count} <span className="text-[10px] text-text-muted font-normal ml-1 whitespace-nowrap uppercase tracking-widest">Accounts</span>
                        </p>
                    </div>
                </div>

                <div className="bg-surface-2 border border-border/40 rounded-2xl p-4 flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Average Exposure</p>
                        <p className="text-lg font-display font-black text-text tabular-nums leading-none mt-1">
                            {stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden bg-card border border-border shadow-sm rounded-xl flex flex-col">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full border-separate border-spacing-0 p-0 m-0">
                        <thead className="sticky top-0 z-20">
                            <tr className="bg-gradient-to-r from-surface-4/95 to-surface-3/95 backdrop-blur-2xl border-b border-border/40 hover:bg-surface-4 h-9">
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pl-6 m-0 border-b border-border/40 text-left align-middle h-9">#</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-left align-middle h-9">Account Description</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-center align-middle h-9">Typed</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white m-0 border-b border-border/40 text-right align-middle h-9">Debit (Receivable)</th>
                                <th className="text-[9px] font-display font-black uppercase tracking-[0.2em] text-white pr-6 m-0 border-b border-border/40 text-right align-middle h-9">Credit</th>
                            </tr>
                        </thead>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={item.id} className="group hover:bg-surface-1/50 transition-colors border-b border-border/30 h-8">
                                    <TableCell className="pl-6 text-[10px] text-text-muted font-bold h-8 py-0">{index + 1}</TableCell>
                                    <TableCell className="h-8 py-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-black text-text tracking-tight uppercase">{item.title}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center h-8 py-0">
                                        <Badge variant="outline" className="text-[7px] font-black border-border/40 text-text-muted bg-surface-2 px-1 tracking-widest uppercase">
                                            {item.type_name}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right h-8 py-0">
                                        <span className="text-sm font-display font-black text-emerald-500 tabular-nums lowercase tracking-tighter">
                                            {item.debit.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 h-8 py-0 text-text-muted/30">
                                        —
                                    </TableCell>
                                </TableRow>
                            ))}
                            
                            {/* Final total row for UI completeness */}
                            <TableRow className="bg-surface-1/80 font-bold border-t-2 border-border/50 h-10">
                                <TableCell colSpan={3} className="pl-6 text-[10px] font-black text-text uppercase tracking-widest text-right">Grand Total Aggregate</TableCell>
                                <TableCell className="text-right text-base font-display font-black text-text tabular-nums underline decoration-emerald-500/30 underline-offset-4 decoration-2">
                                    {stats.total.toLocaleString()}
                                </TableCell>
                                <TableCell className="pr-6 text-right text-text-muted/30">—</TableCell>
                            </TableRow>
                        </TableBody>
                    </table>
                </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em]">Verified Intelligence Digest</span>
                </div>
                <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] flex items-center space-x-1">
                    <span>Aishtycoons</span>
                    <span className="h-1 w-1 bg-surface-5 rounded-full mx-1"></span>
                    <span>Systems Audit</span>
                </div>
            </div>
        </div>
    );
}
