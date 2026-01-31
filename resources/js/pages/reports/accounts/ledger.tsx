import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { PaginationState } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';
import { ResponsiveContainer, Tooltip as RechartsTooltip, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Banknote, ChevronLeft, ChevronRight, Printer, Download, Filter, RefreshCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Account {
    id: number;
    title: string;
}

interface LedgerRow {
    id: number;
    date: string;
    type: string;
    description: string;
    debit: number;
    credit: number;
    created_at: string;
    balance?: number;
}

interface PageProps {
    accounts: Account[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Account Ledger", href: "/reports/accounts/ledger" },
];

export default function AccountLedger({ accounts }: PageProps) {
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const [data, setData] = useState<LedgerRow[]>([]);
    const [openingBalance, setOpeningBalance] = useState(0);
    const [pageStartBalance, setPageStartBalance] = useState(0);
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [balanceType, setBalanceType] = useState<'dr' | 'cr'>('dr');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });

    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!selectedAccount) return;

        setLoading(true);
        try {
            const response = await axios.get(route('reports.accounts.ledger'), {
                params: {
                    account_id: selectedAccount,
                    from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null,
                    to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null,
                    page: pagination.pageIndex + 1,
                    per_page: pagination.pageSize,
                },
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (response.data?.data?.data) {
                setData(response.data.data.data);
            } else {
                setData([]);
            }

            setPageCount(response.data.data.last_page);
            setOpeningBalance(response.data.opening_balance);
            setPageStartBalance(response.data.page_start_balance);
            setTotalDebit(response.data.total_debit);
            setTotalCredit(response.data.total_credit);
            setClosingBalance(response.data.closing_balance);
            setBalanceType(response.data.balance_type || 'dr');
        } catch (error) {
            console.error("Failed to fetch ledger", error);
            toast.error("Failed to load ledger data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAccount) {
            fetchData();
        }
    }, [selectedAccount, dateRange, pagination.pageIndex, pagination.pageSize]);

    // Calculate running balance and filter
    const filteredData = useMemo(() => {
        let balance = Number(pageStartBalance);

        // First calculate balances
        const withBalance = data.map(row => {
            if (balanceType === 'cr') {
                balance = balance + Number(row.credit) - Number(row.debit);
            } else {
                balance = balance + Number(row.debit) - Number(row.credit);
            }
            return { ...row, balance };
        });

        // Then filter if search term exists
        if (!searchTerm) return withBalance;

        return withBalance.filter(row =>
            row.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.type.toLowerCase().includes(searchTerm.toLowerCase())
        );

    }, [data, pageStartBalance, balanceType, searchTerm]);

    // Chart Data
    const chartData = useMemo(() => {
        return filteredData.map(row => ({
            date: format(new Date(row.date), 'dd MMM'),
            balance: row.balance,
            debit: row.debit,
            credit: row.credit
        }));
    }, [filteredData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <>
            <Head title="Account Ledger" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-[#f8fafc]">
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="relative min-h-screen font-sans">

                        {/* Subtle Top Border */}
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-slate-200" />

                        <div className="relative p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">

                            {/* Header Section - Clean & Structural */}
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col lg:flex-row gap-6 justify-between items-end border-b border-slate-200/60 pb-6"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="outline" className="rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold text-slate-500 border-slate-200 bg-white">
                                            Financial Reports
                                        </Badge>
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                                        Account Ledger
                                    </h1>
                                    <p className="text-slate-500 text-sm max-w-2xl">
                                        Detailed transaction history and liquidity analysis.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right hidden lg:block">
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Period</p>
                                        <p className="text-sm font-medium text-slate-700 tabular-nums">
                                            {dateRange?.from ? format(dateRange.from, 'MMM dd, yyyy') : '...'} - {dateRange?.to ? format(dateRange.to, 'MMM dd, yyyy') : '...'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Control Bar - Floating Toolbar style */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 flex flex-col md:flex-row gap-4 items-center justify-between"
                            >
                                <div className="flex flex-1 gap-3 w-full md:w-auto items-center">
                                    <div className="w-full md:w-[300px]">
                                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                                            <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm rounded transition-all">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <Wallet className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                    <SelectValue placeholder="Select Account..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-slate-200 shadow-lg p-1">
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id.toString()} className="cursor-pointer rounded py-2 px-3 text-sm focus:bg-indigo-50 focus:text-indigo-700">
                                                        {acc.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block" />
                                    <DateRangePicker
                                        date={dateRange}
                                        setDate={setDateRange}
                                        className="h-9 rounded border-slate-200 bg-slate-50 hover:bg-slate-100 w-full md:w-auto shadow-none text-sm px-3"
                                    />
                                </div>

                                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                    <div className="relative hidden md:block group">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-slate-600" />
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-9 pl-8 pr-3 rounded border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-[240px] transition-all"
                                        />
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={fetchData} className="h-9 w-9 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                                        <RefreshCcw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                                    </Button>
                                    <div className="h-8 w-[1px] bg-slate-200 mx-1" />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 px-3 rounded text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
                                        onClick={() => {
                                            if (!selectedAccount) {
                                                toast.error("Please select an account first");
                                                return;
                                            }
                                            const params = new URLSearchParams({
                                                account_id: selectedAccount,
                                                from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
                                                to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
                                            });
                                            window.open(route('reports.accounts.ledger.print') + '?' + params.toString(), '_blank');
                                        }}
                                    >
                                        <Printer className="h-3.5 w-3.5 mr-2 text-slate-400" /> Print
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        className="h-9 px-3 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
                                        onClick={() => {
                                            if (!selectedAccount) {
                                                toast.error("Please select an account first");
                                                return;
                                            }
                                            const params = new URLSearchParams({
                                                account_id: selectedAccount,
                                                from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
                                                to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
                                            });
                                            window.open(route('reports.accounts.ledger.export.pdf') + '?' + params.toString(), '_blank');
                                        }}
                                    >
                                        <Download className="h-3.5 w-3.5 mr-2 text-slate-300" /> Export PDF
                                    </Button>
                                </div>
                            </motion.div>

                            {selectedAccount ? (
                                <motion.div
                                    key={selectedAccount}
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-6"
                                >
                                    {/* Ultra-Pro Metrics Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Opening Balance */}
                                        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-indigo-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Opening Balance</p>
                                                <div className="h-6 w-6 rounded bg-indigo-50 flex items-center justify-center">
                                                    <Wallet className="h-3.5 w-3.5 text-indigo-600" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
                                                <span className="text-slate-400 text-sm align-top mr-1 font-medium">PKR</span>
                                                {formatCurrency(openingBalance)}
                                            </h3>
                                        </motion.div>

                                        {/* Credit */}
                                        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-emerald-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Credit</p>
                                                <div className="h-6 w-6 rounded bg-emerald-50 flex items-center justify-center">
                                                    <ArrowDownCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-emerald-700 tabular-nums tracking-tight">
                                                <span className="text-emerald-300 text-sm align-top mr-1 font-medium">PKR</span>
                                                {formatCurrency(totalCredit)}
                                            </h3>
                                        </motion.div>

                                        {/* Debit */}
                                        <motion.div variants={itemVariants} className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-rose-500 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Debit</p>
                                                <div className="h-6 w-6 rounded bg-rose-50 flex items-center justify-center">
                                                    <ArrowUpCircle className="h-3.5 w-3.5 text-rose-600" />
                                                </div>
                                            </div>
                                            <h3 className="text-2xl font-bold text-rose-700 tabular-nums tracking-tight">
                                                <span className="text-rose-300 text-sm align-top mr-1 font-medium">PKR</span>
                                                {formatCurrency(totalDebit)}
                                            </h3>
                                        </motion.div>

                                        {/* Closing Balance */}
                                        <motion.div variants={itemVariants} className={cn("bg-white rounded-lg border border-slate-200 border-l-4 p-5 shadow-sm hover:shadow-md transition-shadow", closingBalance >= 0 ? "border-l-slate-800" : "border-l-red-600")}>
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Closing Balance</p>
                                                {closingBalance >= 0 ? (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5 bg-emerald-50 text-emerald-700 border-emerald-200">SOLVENT</Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-[10px] py-0 px-1.5 h-5">OVERDRAWN</Badge>
                                                )}
                                            </div>
                                            <h3 className={cn("text-3xl font-black tabular-nums tracking-tight", closingBalance >= 0 ? "text-slate-900" : "text-red-600")}>
                                                <span className="text-slate-300 text-sm align-top mr-1 font-medium">PKR</span>
                                                {formatCurrency(closingBalance)}
                                            </h3>
                                        </motion.div>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                                        {/* Transaction Table */}
                                        <motion.div variants={itemVariants} className="xl:col-span-2 space-y-4">
                                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full">
                                                <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                                    <div className="flex items-center gap-2">
                                                        <Banknote className="h-4 w-4 text-slate-400" />
                                                        <h3 className="font-semibold text-slate-800 text-sm">Transactions</h3>
                                                    </div>
                                                    <span className="text-xs text-slate-500 font-medium">
                                                        {filteredData.length} entries shown
                                                    </span>
                                                </div>

                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="text-[11px] text-slate-500 uppercase font-bold bg-slate-50 border-b border-slate-200">
                                                            <tr>
                                                                <th className="px-5 py-2.5 tracking-wide">Date</th>
                                                                <th className="px-5 py-2.5 tracking-wide">Description</th>
                                                                <th className="px-5 py-2.5 tracking-wide text-right">Debit</th>
                                                                <th className="px-5 py-2.5 tracking-wide text-right">Credit</th>
                                                                <th className="px-5 py-2.5 tracking-wide text-right">Balance</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            <AnimatePresence>
                                                                {loading ? (
                                                                    <tr>
                                                                        <td colSpan={5} className="py-16 text-center">
                                                                            <RefreshCcw className="h-6 w-6 text-indigo-500 animate-spin mx-auto mb-3" />
                                                                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Loading Ledger...</p>
                                                                        </td>
                                                                    </tr>
                                                                ) : filteredData.length === 0 ? (
                                                                    <tr>
                                                                        <td colSpan={5} className="py-16 text-center text-slate-400">
                                                                            No transactions match your criteria.
                                                                        </td>
                                                                    </tr>
                                                                ) : (
                                                                    filteredData.map((row, i) => (
                                                                        <motion.tr
                                                                            key={`${row.id}-${i}`}
                                                                            initial={{ opacity: 0 }}
                                                                            animate={{ opacity: 1 }}
                                                                            className="group hover:bg-slate-50 transition-colors"
                                                                        >
                                                                            <td className="px-5 py-3 whitespace-nowrap border-l-2 border-transparent group-hover:border-indigo-500 transition-all">
                                                                                <div className="font-semibold text-slate-900 tabular-nums text-xs">
                                                                                    {format(new Date(row.date), 'dd MMM yyyy')}
                                                                                </div>
                                                                                <div className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                                                                                    {row.type}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-3">
                                                                                <div className="text-slate-600 font-medium text-xs line-clamp-1 group-hover:text-slate-900">
                                                                                    {row.description}
                                                                                </div>
                                                                            </td>
                                                                            <td className="px-5 py-3 text-right">
                                                                                {row.debit > 0 ? (
                                                                                    <span className="text-rose-600 font-mono text-xs font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                                                                                        {formatCurrency(row.debit)}
                                                                                    </span>
                                                                                ) : <span className="text-slate-300 text-xs">-</span>}
                                                                            </td>
                                                                            <td className="px-5 py-3 text-right">
                                                                                {row.credit > 0 ? (
                                                                                    <span className="text-emerald-600 font-mono text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                                        {formatCurrency(row.credit)}
                                                                                    </span>
                                                                                ) : <span className="text-slate-300 text-xs">-</span>}
                                                                            </td>
                                                                            <td className="px-5 py-3 text-right">
                                                                                <span className={cn("font-bold font-mono text-xs", (row.balance || 0) >= 0 ? "text-slate-700" : "text-red-600")}>
                                                                                    {formatCurrency(row.balance || 0)}
                                                                                </span>
                                                                            </td>
                                                                        </motion.tr>
                                                                    ))
                                                                )}
                                                            </AnimatePresence>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                <div className="p-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex - 1 }))} disabled={pagination.pageIndex === 0} className="h-7 w-7 p-0 rounded-full hover:bg-slate-100">
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" onClick={() => setPagination(p => ({ ...p, pageIndex: p.pageIndex + 1 }))} disabled={pagination.pageIndex >= (pageCount - 1)} className="h-7 w-7 p-0 rounded-full hover:bg-slate-100">
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <span className="font-medium mr-2">Page {pagination.pageIndex + 1} of {pageCount}</span>
                                                </div>
                                            </div>
                                        </motion.div>

                                        {/* Right Sidebar - Analytics */}
                                        <motion.div variants={itemVariants} className="xl:col-span-1 space-y-6">

                                            {/* Trend Chart - Minimalist */}
                                            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                                                <div className="mb-6 flex justify-between items-end">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Analysis</p>
                                                        <h3 className="font-bold text-slate-800 text-sm">Balance History</h3>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] text-slate-400 font-normal border-slate-200">Last 30 Days</Badge>
                                                </div>
                                                <div className="h-[180px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                            <XAxis dataKey="date" hide />
                                                            <YAxis hide />
                                                            <RechartsTooltip
                                                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px', padding: '8px 12px' }}
                                                                itemStyle={{ paddingTop: 0, paddingBottom: 0, fontWeight: 600, color: '#1e293b' }}
                                                                formatter={(value: number) => [formatCurrency(value), 'Balance']}
                                                                labelStyle={{ color: '#94a3b8', marginBottom: '2px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="balance"
                                                                stroke="#4f46e5"
                                                                strokeWidth={2}
                                                                fillOpacity={1}
                                                                fill="url(#colorBalance)"
                                                                activeDot={{ r: 4, strokeWidth: 0, fill: '#4f46e5' }}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                                                    <span className="text-slate-400">Trend</span>
                                                    <div className="flex items-center gap-1 font-bold text-emerald-600">
                                                        <ArrowUpCircle className="h-3 w-3" />
                                                        <span>Active</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Minimal Quick Actions */}
                                            <div className="space-y-3">
                                                <Button variant="outline" className="w-full justify-start h-10 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 text-slate-600 text-xs font-medium transition-all group">
                                                    <Download className="h-3.5 w-3.5 mr-3 text-slate-400 group-hover:text-slate-600" />
                                                    Download PDF Report
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start h-10 border-slate-200 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 text-slate-600 text-xs font-medium transition-all group">
                                                    <Banknote className="h-3.5 w-3.5 mr-3 text-slate-400 group-hover:text-slate-600" />
                                                    Download Excel Sheet
                                                </Button>
                                            </div>

                                        </motion.div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center min-h-[500px] border border-dashed border-slate-200 rounded-xl bg-slate-50/50"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
                                        <Wallet className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Select an Account</h3>
                                    <p className="text-slate-400 text-sm mt-1 max-w-xs text-center">
                                        Choose an account from the toolbar above to view the detailed ledger.
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
