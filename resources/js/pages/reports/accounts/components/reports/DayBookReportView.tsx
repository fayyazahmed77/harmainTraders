import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Wallet, Banknote, CreditCard, ShoppingCart, ShoppingBag, TrendingUp, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BankDetail {
    name: string;
    opening: number;
    receipts: number;
    payments: number;
    closing: number;
}

interface DayBookData {
    stock: {
        opening: number;
        in: number;
        out: number;
        closing: number;
        closing_amt: number;
    };
    cash: {
        opening: number;
        receiving: number;
        payment: number;
        closing: number;
    };
    cheque: {
        opening: number;
        receiving: number;
        payment: number;
        closing: number;
    };
    bank: {
        details: BankDetail[];
        summary: {
            opening: number;
            receiving: number;
            payment: number;
            closing: number;
        };
    };
    trade: {
        purchase: number;
        purchase_return: number;
        net_purchase: number;
        sale: number;
        sales_return: number;
        net_sale: number;
    };
    financial: {
        day_receivable: number;
        total_receivable: number;
        day_payable: number;
        total_payable: number;
        capital: number;
        total_dr: number;
        total_cr: number;
        cogs: number;
        gross_profit: number;
        gross_margin: number;
        total_expenses: number;
        net_profit: number;
        net_margin: number;
        roi: number;
        profit: number; // backward compat
    };
}

interface DayBookReportViewProps {
    data: DayBookData;
    criteria: string;
}

export const DayBookReportView: React.FC<DayBookReportViewProps> = ({ data, criteria }) => {
    if (!data) return null;

    const formatCurrency = (amount: number, accountingStyle = false) => {
        const abs = Math.abs(amount);
        const formatted = new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(abs);
        
        if (accountingStyle && amount < 0) return `(${formatted})`;
        return formatted;
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
                        <span className={`font-bold ${item.isBold ? 'text-text-primary' : 'text-text-secondary'} ${item.className || ''}`}>
                            {item.isCurrency ? formatCurrency(item.value, item.accounting) : item.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );

    const netProfit = data.financial?.net_profit ?? 0;
    const profitColor = netProfit >= 0 ? 'emerald' : 'rose';

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-8"
        >
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { 
                        label: 'Net Profit', 
                        value: netProfit, 
                        icon: TrendingUp, 
                        color: profitColor, 
                        isCurrency: true,
                        subtitle: `Margin: ${data.financial?.net_margin ?? 0}%`
                    },
                    { 
                        label: 'Net Sales', 
                        value: data.trade.net_sale, 
                        icon: ShoppingBag, 
                        color: 'indigo', 
                        isCurrency: true,
                        subtitle: `COGS: ${formatCurrency(data.financial?.cogs ?? 0)}`
                    },
                    { 
                        label: 'Net Purchase', 
                        value: data.trade.net_purchase, 
                        icon: ShoppingCart, 
                        color: 'rose', 
                        isCurrency: true,
                        subtitle: `Return: ${formatCurrency(data.trade.purchase_return)}`
                    },
                    { 
                        label: 'Return on Inv.', 
                        value: `${data.financial?.roi ?? 0}%`, 
                        icon: Info, 
                        color: 'amber', 
                        isCurrency: false,
                        subtitle: `Gross: ${data.financial?.gross_margin ?? 0}%`
                    },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 relative overflow-hidden group border-none bg-card shadow-sm hover:shadow-md transition-all duration-300">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                        <div className="relative flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.15em]">{stat.label}</p>
                                <h3 className={`text-2xl font-black text-text-primary`}>
                                    {stat.isCurrency ? formatCurrency(stat.value as number) : stat.value}
                                </h3>
                                <p className="text-[10px] font-bold text-text-muted/60 uppercase">{stat.subtitle}</p>
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
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">
                            {criteria}  ·  Net Profit: {formatCurrency(netProfit)}
                        </p>
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
                        {/* P&L SUMMARY (Waterfall) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 mb-4">
                                <Wallet className="h-4 w-4" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">🏦 P&L SUMMARY</h3>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-text-muted font-medium">Net Sales</span>
                                    <span className="font-bold text-text-primary">{formatCurrency(data.trade.net_sale)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pl-4">
                                    <span className="text-text-muted/70 font-medium">− COGS</span>
                                    <span className="font-bold text-rose-600">{formatCurrency(data.financial?.cogs ?? 0, true)}</span>
                                </div>
                                
                                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-lg px-3 py-2 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-600 uppercase">Gross Profit</span>
                                        <span className="text-lg font-black text-indigo-600">{formatCurrency(data.financial?.gross_profit ?? 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-text-muted uppercase font-bold">Gross Margin</span>
                                        <span className="text-[10px] font-bold text-indigo-600/70">{data.financial?.gross_margin ?? 0}%</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center text-sm pl-4 mt-2">
                                    <span className="text-text-muted/70 font-medium">− Operating Expenses</span>
                                    <span className="font-bold text-rose-600">{formatCurrency(data.financial?.total_expenses ?? 0, true)}</span>
                                </div>

                                <div className={`border rounded-xl px-4 py-3 mt-4 ${netProfit >= 0 ? 'bg-emerald-500/8 border-emerald-500/15' : 'bg-rose-500/8 border-rose-500/15'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs font-bold uppercase ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>NET PROFIT</span>
                                        <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(netProfit)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-text-muted uppercase font-bold">Net Margin</span>
                                        <span className={`text-[10px] font-bold ${netProfit >= 0 ? 'text-emerald-600/70' : 'text-rose-600/70'}`}>
                                            {data.financial?.net_margin ?? 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-6 pt-6 border-t border-border/10 text-[11px] uppercase tracking-wider font-bold text-text-muted">
                                <div className="flex justify-between">
                                    <span>Day Receivable</span>
                                    <span className="text-text-primary">{formatCurrency(data.financial.day_receivable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Day Payable</span>
                                    <span className="text-text-primary">{formatCurrency(data.financial.day_payable)}</span>
                                </div>
                                <div className="flex justify-between bg-surface-1/50 p-1 rounded">
                                    <span>Total Receivable</span>
                                    <span className="text-text-primary font-black">{formatCurrency(data.financial.total_receivable)}</span>
                                </div>
                                <div className="flex justify-between bg-surface-1/50 p-1 rounded">
                                    <span>Total Payable</span>
                                    <span className="text-text-primary font-black">({formatCurrency(data.financial.total_payable)})</span>
                                </div>
                                <div className="flex justify-between col-span-2">
                                    <span>Capital</span>
                                    <span className="text-text-primary">{formatCurrency(data.financial.capital)}</span>
                                </div>
                            </div>
                        </div>

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
                                    { label: 'Gross Margin', value: `${data.financial?.gross_margin ?? 0}%`, isBold: true }
                                ]}
                            />
                        </div>

                        {/* ROI & Gross Margin */}
                        <div className="bg-surface-1 p-4 rounded-xl flex justify-between items-center border border-border/20">
                            <div>
                                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">R. O. I.</span>
                                <span className={`text-xl font-black ml-4 ${data.financial?.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {data.financial?.roi ?? 0}%
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Gross Margin</span>
                                <span className="text-sm font-black ml-2 text-indigo-600">
                                    {data.financial?.gross_margin ?? 0}%
                                </span>
                            </div>
                        </div>

                        {/* Cash & Cheque Side by Side */}
                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border/10">
                            <SummarySection 
                                title="Cash" 
                                icon={Banknote}
                                color="green"
                                items={[
                                    { label: 'Opening', value: data.cash.opening, isCurrency: true },
                                    { label: 'Closing', value: data.cash.closing, isCurrency: true, isBold: true },
                                ]}
                            />
                            <SummarySection 
                                title="Cheque" 
                                icon={CreditCard}
                                color="blue"
                                items={[
                                    { label: 'Opening', value: data.cheque.opening, isCurrency: true },
                                    { label: 'Closing', value: data.cheque.closing, isCurrency: true, isBold: true },
                                ]}
                            />
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
                                    {data.bank.details.map((bank: BankDetail, bIdx: number) => {
                                        const delta = bank.closing - bank.opening;
                                        const isZero = bank.closing === 0;

                                        return (
                                            <React.Fragment key={bIdx}>
                                                <TableRow className={`bg-surface-1/30 ${isZero ? 'opacity-50' : ''}`}>
                                                    <TableCell className="font-bold text-indigo-600 text-xs uppercase" colSpan={3}>
                                                        {bank.name}
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow className={isZero ? 'opacity-50' : ''}>
                                                    <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase min-w-[150px]">Opening</TableCell>
                                                    <TableCell className="text-right font-bold text-text-secondary">{formatCurrency(bank.opening)}</TableCell>
                                                    <TableCell />
                                                </TableRow>
                                                <TableRow className={isZero ? 'opacity-50' : ''}>
                                                    <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase">Receiving</TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600">+{formatCurrency(bank.receipts)}</TableCell>
                                                    <TableCell />
                                                </TableRow>
                                                <TableRow className={isZero ? 'opacity-50' : ''}>
                                                    <TableCell className="text-text-muted/60 pl-8 text-xs font-medium uppercase">Payment</TableCell>
                                                    <TableCell className="text-right font-bold text-rose-600">−{formatCurrency(bank.payments)}</TableCell>
                                                    <TableCell />
                                                </TableRow>

                                                <TableRow className={`border-b-2 border-border/20 ${isZero ? 'opacity-50' : ''}`}>
                                                    <TableCell className="text-text-secondary pl-8 text-xs font-bold uppercase">Closing</TableCell>
                                                    <TableCell className="text-right font-black text-text-primary border-t border-border/20">
                                                        {formatCurrency(bank.closing)}
                                                    </TableCell>

                                                    <TableCell className="w-24 text-right pr-4">
                                                        {delta > 0 && <span className="text-[9px] text-emerald-600 flex items-center justify-end gap-1 font-bold">▲ {formatCurrency(delta)}</span>}
                                                        {delta < 0 && <span className="text-[9px] text-rose-600 flex items-center justify-end gap-1 font-bold">▼ {formatCurrency(delta)}</span>}
                                                        {delta === 0 && <span className="text-[9px] text-text-muted/50 flex items-center justify-end gap-1 font-bold"><Minus className="h-2 w-2" /></span>}
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        );
                                    })}
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
                                    <span className="font-bold text-rose-400">−{formatCurrency(data.bank.summary.payment)}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
                                    <span className="text-xs text-indigo-200 uppercase font-bold">Bank Closing</span>
                                    <span className="font-black text-white text-lg">{formatCurrency(data.bank.summary.closing)}</span>
                                </div>
                                
                                {/* Net Movement */}
                                <div className="flex justify-between items-center col-span-2 border-t border-white/10 pt-2">
                                    <span className="text-xs text-white/60 uppercase font-medium">Net Movement</span>
                                    <span className={`font-bold ${(data.bank.summary.closing - data.bank.summary.opening) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {(data.bank.summary.closing - data.bank.summary.opening) >= 0 ? '+' : ''}
                                        {formatCurrency(data.bank.summary.closing - data.bank.summary.opening)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-between items-center text-[10px] text-text-muted font-bold uppercase tracking-widest pt-4 opacity-50 border-t border-border/10">
                <div className="flex items-center gap-4">
                    <span>{new Date().toLocaleString()}</span>
                    <span>System Generated Report</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        Net Profit: {formatCurrency(netProfit)} | Margin: {data.financial?.net_margin ?? 0}%
                    </span>
                </div>
                <span>Page 1 of 1</span>
            </div>
        </motion.div>
    );
};
