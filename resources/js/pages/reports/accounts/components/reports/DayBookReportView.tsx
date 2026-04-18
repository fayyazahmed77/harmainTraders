import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Wallet, Banknote, CreditCard, ShoppingCart, ShoppingBag, TrendingUp, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


interface DayBookReportViewProps {
    data: any;
    criteria: string;
}

export const DayBookReportView: React.FC<DayBookReportViewProps> = ({ data, criteria }) => {
    if (!data) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const SummarySection = ({ title, icon: Icon, items, color = "indigo" }: any) => (
        <div className="space-y-3">
            <div className={`flex items-center gap-2 text-${color}-600 mb-2`}>
                <Icon className="h-4 w-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
            </div>
            <div className="space-y-1">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-border/10 last:border-0">
                        <span className="text-text-muted font-medium">{item.label} :</span>
                        <span className={`font-bold ${item.isBold ? 'text-text-primary' : 'text-text-secondary'}`}>
                            {item.isCurrency ? formatCurrency(item.value) : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8"
        >

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Net Profit', value: data.financial.profit, icon: TrendingUp, color: 'emerald', isCurrency: true },
                    { label: 'Net Sales', value: data.trade.net_sale, icon: ShoppingBag, color: 'indigo', isCurrency: true },
                    { label: 'Net Purchase', value: data.trade.net_purchase, icon: ShoppingCart, color: 'rose', isCurrency: true },
                    { label: 'Return on Inv.', value: `${data.financial.roi}%`, icon: Info, color: 'amber', isCurrency: false },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 relative overflow-hidden group border-none bg-card shadow-sm hover:shadow-md transition-all duration-300">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                        <div className="relative flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">{stat.label}</p>
                                <h3 className={`text-2xl font-black text-text-primary`}>
                                    {stat.isCurrency ? formatCurrency(stat.value as number) : stat.value}
                                </h3>
                            </div>
                            <div className={`h-12 w-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-500 shrink-0`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-1/40 p-2 rounded-2xl backdrop-blur-sm border border-border/20">
                <div className="flex items-center gap-3 pl-4">
                    <div>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-tight leading-none">Day End Summary</h2>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">{criteria}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 pr-2">
                    <Badge variant="outline" className="bg-surface-0 border-border text-text-muted font-bold px-4 py-1.5 rounded-full uppercase tracking-widest text-[9px]">
                        Confidential Summary
                    </Badge>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Financial Summaries */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="p-6 bg-card border-none shadow-sm space-y-8">
                        {/* Stock Summary */}
                        <SummarySection 
                            title="Stock Summary" 
                            icon={ShoppingBag}
                            items={[
                                { label: 'Opening Stock Qty', value: data.stock.opening },
                                { label: 'In Qty', value: data.stock.in },
                                { label: 'Out Qty', value: data.stock.out },
                                { label: 'Closing Stock Qty', value: data.stock.closing, isBold: true },
                                { label: 'Closing Stock Amt', value: data.stock.closing_amt, isCurrency: true, isBold: true },
                            ]}
                        />

                        {/* Cash Summary */}
                        <SummarySection 
                            title="Cash Summary" 
                            icon={Banknote}
                            color="green"
                            items={[
                                { label: 'Cash Opening', value: data.cash.opening, isCurrency: true },
                                { label: 'Cash Receiving', value: data.cash.receiving, isCurrency: true },
                                { label: 'Cash Payment', value: data.cash.payment, isCurrency: true },
                                { label: 'Cash Closing', value: data.cash.closing, isCurrency: true, isBold: true },
                            ]}
                        />

                        {/* Cheque Summary */}
                        <SummarySection 
                            title="Cheque Summary" 
                            icon={CreditCard}
                            color="blue"
                            items={[
                                { label: 'Cheque Opening', value: data.cheque.opening, isCurrency: true },
                                { label: 'Cheque Receiving', value: data.cheque.receiving, isCurrency: true },
                                { label: 'Cheque Payment', value: data.cheque.payment, isCurrency: true },
                                { label: 'Cheque Closing', value: data.cheque.closing, isCurrency: true, isBold: true },
                            ]}
                        />

                        {/* Financial Indicators */}
                        <SummarySection 
                            title="Accounts Summary" 
                            icon={Wallet}
                            color="amber"
                            items={[
                                { label: 'Day Receivable', value: data.financial.day_receivable, isCurrency: true },
                                { label: 'Total Receivable', value: data.financial.total_receivable, isCurrency: true, isBold: true },
                                { label: 'Total DR', value: data.financial.total_dr, isCurrency: true },
                                { label: 'Day Payable', value: data.financial.day_payable, isCurrency: true },
                                { label: 'Total Payable', value: data.financial.total_payable, isCurrency: true, isBold: true },
                                { label: 'Capital', value: data.financial.capital, isCurrency: true },
                                { label: 'Total CR', value: data.financial.total_cr, isCurrency: true },
                                { label: 'Profit', value: data.financial.profit, isCurrency: true, isBold: true },
                            ]}
                        />

                        {/* Trade Summary */}
                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/10">
                            <SummarySection 
                                title="Purchase" 
                                icon={ShoppingCart}
                                color="rose"
                                items={[
                                    { label: 'Purchase', value: data.trade.purchase, isCurrency: true },
                                    { label: 'Return', value: data.trade.purchase_return, isCurrency: true },
                                    { label: 'Net Purchase', value: data.trade.net_purchase, isCurrency: true, isBold: true },
                                ]}
                            />
                            <SummarySection 
                                title="Sale" 
                                icon={TrendingUp}
                                color="emerald"
                                items={[
                                    { label: 'Sale', value: data.trade.sale, isCurrency: true },
                                    { label: 'Return', value: data.trade.sales_return, isCurrency: true },
                                    { label: 'Net Sale', value: data.trade.net_sale, isCurrency: true, isBold: true },
                                ]}
                            />
                        </div>

                        {/* ROI */}
                        <div className="bg-surface-1 p-4 rounded-xl flex justify-between items-center border border-border/20">
                            <span className="text-sm font-bold text-text-secondary uppercase tracking-wider">R. O. I.</span>
                            <span className={`text-xl font-black ${data.financial.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {data.financial.roi}%
                            </span>
                        </div>
                    </Card>
                </div>

                {/* Right Column - Bank Details */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="bg-card border-none shadow-sm overflow-hidden">
                        <div className="p-6 bg-surface-1/50 border-b border-border/20 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Wallet className="h-4 w-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">Bank Details Breakdown</h3>
                            </div>
                        </div>
                        <div className="p-0">
                            <Table>
                                <TableBody>
                                    {data.bank.details.map((bank: any, bIdx: number) => (
                                        <React.Fragment key={bIdx}>
                                            <TableRow className="bg-surface-1/30">
                                                <TableCell className="font-bold text-indigo-600 text-xs uppercase" colSpan={3}>
                                                    {bank.name}
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase min-w-[150px]">Opening</TableCell>
                                                <TableCell className="text-right font-bold text-text-secondary">{formatCurrency(bank.opening)}</TableCell>
                                                <TableCell />
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase">Receiving</TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600">+{formatCurrency(bank.receipts)}</TableCell>
                                                <TableCell />
                                            </TableRow>
                                            <TableRow>
                                                <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase">Payment</TableCell>
                                                <TableCell className="text-right font-bold text-rose-600">-{formatCurrency(bank.payments)}</TableCell>
                                                <TableCell />
                                            </TableRow>

                                            <TableRow className="border-b-2 border-border/20">
                                                <TableCell className="text-text-secondary pl-8 text-xs font-bold uppercase">Closing</TableCell>
                                                <TableCell className="text-right font-black text-text-primary border-t border-border/20">{formatCurrency(bank.closing)}</TableCell>
                                                <TableCell />
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Bank Overall Summary */}
                        <div className="p-8 bg-surface-4 text-white space-y-4">
                            <div className="flex items-center gap-2 mb-4 opacity-70">
                                <Info className="h-4 w-4" />
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">Bank Aggregate Summary</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-white/60 uppercase font-medium">Bank Opening</span>
                                    <span className="font-bold">{formatCurrency(data.bank.summary.opening)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-white/60 uppercase font-medium">Bank Receiving</span>
                                    <span className="font-bold text-emerald-400">+{formatCurrency(data.bank.summary.receiving)}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                    <span className="text-xs text-white/60 uppercase font-medium">Bank Payment</span>
                                    <span className="font-bold text-rose-400">-{formatCurrency(data.bank.summary.payment)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                                    <span className="text-xs text-indigo-200 uppercase font-bold">Bank Closing</span>
                                    <span className="font-black text-white text-lg">{formatCurrency(data.bank.summary.closing)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-text-muted font-bold uppercase tracking-widest pt-4 opacity-50">
                <span>{new Date().toLocaleString()}</span>
                <span>System Generated Report</span>
                <span>Page 1 of 1</span>
            </div>
        </motion.div>
    );
};
