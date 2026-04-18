import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { format } from 'date-fns';
import AppLogoIcon from '@/components/app-logo-icon';

interface AgingRow {
    party_name: string;
    account_type: string;
    total: number;
    days_01_30: number;
    days_31_60: number;
    days_61_90: number;
    days_91_120: number;
    days_121_150: number;
    days_151_180_plus: number;
    trial_balance: number;
}

interface AgingReportViewProps {
    data: AgingRow[];
    criteria: string;
    loading?: boolean;
}

export function AgingReportView({ data, criteria, loading }: AgingReportViewProps) {
    const formatCurrency = (amount: number) => {
        if (!amount || amount === 0) return '';
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercent = (val: number) => {
        if (!val || val === 0) return '';
        return Math.round(val);
    };

    // Grouping logic
    const groups = data.reduce((acc, row) => {
        const type = row.account_type || 'Uncategorized';
        if (!acc[type]) acc[type] = [];
        acc[type].push(row);
        return acc;
    }, {} as Record<string, AgingRow[]>);

    const grandTotals = data.reduce((acc, row) => ({
        total: acc.total + row.total,
        days_01_30: acc.days_01_30 + row.days_01_30,
        days_31_60: acc.days_31_60 + row.days_31_60,
        days_61_90: acc.days_61_90 + row.days_61_90,
        days_91_120: acc.days_91_120 + row.days_91_120,
        days_121_150: acc.days_121_150 + row.days_121_150,
        days_151_180_plus: acc.days_151_180_plus + row.days_151_180_plus,
        trial_balance: acc.trial_balance + row.trial_balance,
    }), {
        total: 0, days_01_30: 0, days_31_60: 0, days_61_90: 0, 
        days_91_120: 0, days_121_150: 0, days_151_180_plus: 0, trial_balance: 0
    });

    return (
        <Card className="p-8 bg-card border-border shadow-sm print:shadow-none print:border-none">
            {/* Report Header */}
            <div className="flex flex-col items-center justify-center space-y-2 mb-8">
                <div className="flex items-center justify-center gap-3 border-b-2 border-text-primary px-4 pb-2">
                    <AppLogoIcon className="w-8 h-8" />
                    <div className="flex flex-col text-left leading-none">
                        <span className="text-sidebar-primary text-xl tracking-tight text-text-primary">Haramain <span className="font-semibold text-sidebar-primary text-xl">Traders</span></span>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Wholesale & Supply Chain</span>
                    </div>
                </div>
                <h2 className="text-sm font-bold text-text-secondary tracking-wider uppercase mt-2">Accounts Aging Wise Detail</h2>
            </div>

            <div className="mb-6">
                <span className="text-[11px] font-black text-text-primary uppercase tracking-widest border-b border-border pb-1">Criteria:</span>
                <span className="text-[11px] font-bold text-text-muted ml-2 uppercase">{criteria}</span>
            </div>

            {/* Table */}
            <div className="border border-text-primary/40">
                <Table className="text-[11px] border-collapse">
                    <TableHeader>
                        <TableRow className="bg-surface-1 hover:bg-surface-1 border-b border-text-primary/40">
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center px-2 uppercase">Party Name</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[80px] px-2 uppercase">Total</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">01-30 Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">31-60 Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">61-90 Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">91-120 Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">121-150 Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 border-r border-border text-center w-[70px] px-2 uppercase">151-180 + Days</TableHead>
                            <TableHead className="font-black text-text-primary h-8 text-center w-[80px] px-2 uppercase">Trial Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow><TableCell colSpan={9} className="h-40 text-center text-text-muted font-bold uppercase tracking-widest">Loading Report...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={9} className="h-40 text-center text-text-muted font-bold uppercase tracking-widest">No Records Found</TableCell></TableRow>
                        ) : (
                            Object.entries(groups).map(([type, rows]) => {
                                const typeTotals = rows.reduce((acc, r) => ({
                                    total: acc.total + r.total,
                                    days_01_30: acc.days_01_30 + r.days_01_30,
                                    days_31_60: acc.days_31_60 + r.days_31_60,
                                    days_61_90: acc.days_61_90 + r.days_61_90,
                                    days_91_120: acc.days_91_120 + r.days_91_120,
                                    days_121_150: acc.days_121_150 + r.days_121_150,
                                    days_151_180_plus: acc.days_151_180_plus + r.days_151_180_plus,
                                }), {
                                    total: 0, days_01_30: 0, days_31_60: 0, days_61_90: 0, 
                                    days_91_120: 0, days_121_150: 0, days_151_180_plus: 0
                                });

                                return (
                                    <React.Fragment key={type}>
                                        {/* Type Header Row */}
                                        <TableRow className="bg-surface-1 font-black h-8 border-b border-border">
                                            <TableCell colSpan={9} className="px-4 py-1">
                                                <div className="flex items-center gap-4">
                                                    <span className="text-text-primary uppercase tracking-tighter">Account Type :</span>
                                                    <span className="text-text-secondary uppercase tracking-widest">{type}</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {/* Party Rows */}
                                        {rows.map((row, i) => (
                                            <TableRow key={i} className="hover:bg-surface-1 border-b border-border/10">
                                                <TableCell className="font-bold text-text-secondary border-r border-border/10 py-1 px-2 uppercase">{row.party_name}</TableCell>
                                                <TableCell className="text-right font-black text-text-primary border-r border-border/10 tabular-nums px-2">{formatCurrency(row.total)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_01_30)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_31_60)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_61_90)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_91_120)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_121_150)}</TableCell>
                                                <TableCell className="text-right border-r border-border/10 tabular-nums px-2">{formatCurrency(row.days_151_180_plus)}</TableCell>
                                                <TableCell className="text-right tabular-nums px-2 font-bold">{formatCurrency(row.trial_balance)}</TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Type Totals Row */}
                                        <TableRow className="bg-surface-1/50 font-black text-text-primary border-b border-border">
                                            <TableCell className="text-right px-4 py-1.5 uppercase tracking-tighter">Type Wise Total :</TableCell>
                                            <TableCell className="text-right border-x border-border font-black bg-surface-1 px-2">{formatCurrency(typeTotals.total)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_01_30)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_31_60)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_61_90)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_91_120)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_121_150)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatCurrency(typeTotals.days_151_180_plus)}</TableCell>
                                            <TableCell className="text-right px-2"></TableCell>
                                        </TableRow>

                                        {/* Type % Row */}
                                        <TableRow className="bg-card font-black text-text-primary border-b border-text-primary/40">
                                            <TableCell className="text-right px-4 py-1.5 uppercase tracking-tighter">Type Wise % :</TableCell>
                                            <TableCell className="text-right border-x border-border px-2"></TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_01_30 / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_31_60 / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_61_90 / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_91_120 / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_121_150 / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right border-r border-border px-2">{formatPercent((typeTotals.days_151_180_plus / typeTotals.total) * 100)}</TableCell>
                                            <TableCell className="text-right px-2"></TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                );
                            })
                        )}
                        
                        {/* Grand Totals */}
                        {!loading && data.length > 0 && (
                            <TableRow className="bg-surface-1 font-black text-text-primary border-t-2 border-text-primary">
                                <TableCell className="text-right px-4 py-2 uppercase tracking-tighter text-sm">Grand Total :</TableCell>
                                <TableCell className="text-right border-x border-text-primary px-2 text-sm">{formatCurrency(grandTotals.total)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_01_30)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_31_60)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_61_90)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_91_120)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_121_150)}</TableCell>
                                <TableCell className="text-right border-r border-text-primary px-2">{formatCurrency(grandTotals.days_151_180_plus)}</TableCell>
                                <TableCell className="text-right px-2 font-black text-sm">{formatCurrency(grandTotals.trial_balance)}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <div className="mt-8 flex justify-between items-end border-t border-border pt-10 px-4 opacity-50">
                <div className="text-center">
                    <div className="w-40 border-t border-text-primary m-auto mb-1"></div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Checked By</span>
                </div>
                <div className="text-center">
                    <div className="w-40 border-t border-text-primary m-auto mb-1"></div>
                    <span className="text-[10px] font-bold text-text-secondary uppercase">Authorized signature</span>
                </div>
            </div>
        </Card>
    );
}
