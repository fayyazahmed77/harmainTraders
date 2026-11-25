import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { DateRangePicker } from '@/components/Reports/DateRangePicker';
import { AccountSelectionDialog } from './components/AccountSelectionDialog';
import { ReportSectionDialog } from './components/ReportSectionDialog';
import { PaginationState } from '@tanstack/react-table';
import { DateRange } from 'react-day-picker';
import { format, subDays, subMonths } from 'date-fns';
import axios from 'axios';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { BreadcrumbItem } from '@/types';
import { ResponsiveContainer, Tooltip as RechartsTooltip, Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Banknote, ChevronLeft, ChevronRight, Printer, Download, Filter, RefreshCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Account {
    id: number;
    title: string;
    code?: string;
    type?: number;
    area_id?: number;
    subarea_id?: number;
    account_type?: { name: string };
    area?: { name: string };
    subarea?: { name: string };
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

import { ReportParameterForm } from './components/ReportParameterForm';
import { AgingReportView } from './components/reports/AgingReportView';
import { AccountListReportView } from './components/reports/AccountListReportView';
import { DetailLedgerReportView } from './components/reports/DetailLedgerReportView';
import { GeneralLedgerReportView } from './components/reports/GeneralLedgerReportView';
import { BankLedgerReportView } from './components/reports/BankLedgerReportView';
import { DueBillsReportView } from './components/reports/DueBillsReportView';
import { DayBookReportView } from './components/reports/DayBookReportView';
import { OutstandingBillWiseView } from './components/reports/OutstandingBillWiseView';
import { PaymentDetailReportView } from './components/reports/PaymentDetailReportView';
import { ReceivingDetailReportView } from './components/reports/ReceivingDetailReportView';
import { ReceivableReportView } from './components/reports/ReceivableReportView';
import { RoznamchaReportView, RoznamchaData } from './components/reports/RoznamchaReportView';
import { SummaryReportView, SummaryRow } from './components/reports/SummaryReportView';
import { TrialBalance6ColReportView, TrialBalance6ColRow } from './components/reports/TrialBalance6ColReportView';
import { Card } from '@/components/ui/card';

interface PageProps {
    accounts: Account[];
    firms: any[];
    salesmen: any[];
    areas?: any[];
    subareas?: any[];
    account_types: any[];
    account_categories: any[];
    users: any[];
    provinces?: any[];
    cities?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Reports", href: "/reports" },
    { title: "Account Reports", href: "/reports/accounts/ledger" },
];

export default function AccountReports({ 
    accounts, firms, salesmen, areas = [], subareas = [], account_types, account_categories, users, provinces = [], cities = []
}: PageProps) {
    // Large state object for all parameters with URL pre-population
    const [params, setParams] = useState(() => {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlReport = urlParams?.get('report') || urlParams?.get('reportId');
        const urlType = urlParams?.get('type');
        return {
            fromDate: subMonths(new Date(), 1),
            toDate: new Date(),
            accountId: 'ALL',
            reportId: urlReport ? urlReport.toLowerCase() : 'general_ledger',
            firmId: 'ALL',
            salemanId: 'ALL',
            areaId: 'ALL',
            subareaId: 'ALL',
            provinceId: 'ALL',
            cityId: 'ALL',
            type: urlType || 'ALL',
            noteHead: 'ALL',
            nature: 'ALL',
            contraId: 'ALL',
            parentId: 'ALL',
            voucherType: 'ALL',
            userId: 'ALL',
            shift: 'ALL',
            sortBy: 'INV_DATE',
            remarks: '',
            printOn: 'screen',
            dateType: 'invdate',
            bankFilter: 'ALL',
            ledgerDesc: 'contraa/c',
            balanceCriteria: 'all',
            identityType: 'code',
        };
    });

    const [ledgerData, setLedgerData] = useState<LedgerRow[]>([]);
    const [agingData, setAgingData] = useState<any[]>([]);
    const [dueBillsData, setDueBillsData] = useState<any[]>([]);
    const [outstandingBillWiseData, setOutstandingBillWiseData] = useState<any[]>([]);
    const [accountsListData, setAccountsListData] = useState<any[]>([]);
    const [dayBookData, setDayBookData] = useState<any>(null);
    const [paymentDetailData, setPaymentDetailData] = useState<any[]>([]);
    const [receivingDetailData, setReceivingDetailData] = useState<any[]>([]);
    const [receivableData, setReceivableData] = useState<any[]>([]);
    const [roznamchaData, setRoznamchaData] = useState<RoznamchaData | null>(null);
    const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
    const [trialBalanceData, setTrialBalanceData] = useState<SummaryRow[]>([]);
    const [trialBalance6ColData, setTrialBalance6ColData] = useState<TrialBalance6ColRow[]>([]);
    
    const [openingBalance, setOpeningBalance] = useState(0);
    const [pageStartBalance, setPageStartBalance] = useState(0);
    const [totalDebit, setTotalDebit] = useState(0);
    const [totalCredit, setTotalCredit] = useState(0);
    const [totalUnclearedFloat, setTotalUnclearedFloat] = useState(0);
    const [closingBalance, setClosingBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageCount, setPageCount] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [balanceType, setBalanceType] = useState<'dr' | 'cr'>('dr');
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 50,
    });
    const [hasSearched, setHasSearched] = useState(false);
    const [executedReportId, setExecutedReportId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [bankFilterMode, setBankFilterMode] = useState<'all' | 'cleared' | 'pending'>('all');
    const [bankSearchTerm, setBankSearchTerm] = useState('');
    const [debouncedBankSearch, setDebouncedBankSearch] = useState('');

    const requestIdRef = useRef(0);
    const prevBankFilterRef = useRef(params.bankFilter);
    const prevDateTypeRef = useRef(params.dateType);
    const bankSearchMountedRef = useRef(false);

    const fetchData = async (overrides?: {
        pageIndex?: number;
        pageSize?: number;
        bankFilter?: string;
        bankFilterMode?: 'all' | 'cleared' | 'pending';
        bankSearch?: string;
        dateType?: string;
    }) => {
        const reqId = ++requestIdRef.current;
        const targetPageIndex = overrides?.pageIndex ?? pagination.pageIndex;
        const targetPageSize = overrides?.pageSize ?? pagination.pageSize;
        const effectiveBankFilter = overrides?.bankFilter ?? params.bankFilter;
        const effectiveDateType = overrides?.dateType ?? params.dateType;
        const effectiveBankStatus = overrides?.bankFilterMode ?? bankFilterMode;
        const effectiveBankSearch = overrides?.bankSearch ?? debouncedBankSearch;

        setHasSearched(true);
        setLoading(true);
        try {
            // This is a generic fetcher that handles multiple report types
            const reportId = params.reportId.toLowerCase();
            const endpoint = route('reports.accounts.ledger');

            const queryParams: Record<string, any> = {
                ...params,
                dateType: effectiveDateType,
                bankFilter: effectiveBankFilter,
                reportId: reportId,
                account_id: params.accountId,
                from: format(params.fromDate, 'yyyy-MM-dd'),
                to: format(params.toDate, 'yyyy-MM-dd'),
                page: targetPageIndex + 1,
                per_page: targetPageSize,
            };

            if (reportId === 'bank_ledger') {
                delete queryParams.dateType;
                if (effectiveBankSearch.trim() !== '') {
                    queryParams.search = effectiveBankSearch.trim();
                }
            }

            const response = await axios.get(endpoint, {
                params: queryParams,
                headers: { 'Accept': 'application/json' }
            });

            if (reqId !== requestIdRef.current) return;

            setExecutedReportId(reportId);

            if (reportId === 'accounts_aging') {
                setAgingData(response.data?.data || []);
            } else if (reportId === 'due_bills') {
                setDueBillsData(response.data?.data || []);
            } else if (reportId === 'account_list') {
                setAccountsListData(response.data?.data?.map((acc: any) => ({
                    code: acc.code || '',
                    title: acc.title,
                    address: acc.area?.name || '',
                    tel: '',
                    typed: acc.account_type?.name || ''
                })) || []);
            } else if (reportId === 'bank_ledger') {
                setLedgerData(response.data?.data?.data || []);
                setPageCount(response.data?.data?.last_page || 0);
                setTotalRecords(response.data?.data?.total || 0);
                setOpeningBalance(response.data.opening_balance || 0);
                setPageStartBalance(response.data.page_start_balance || 0);
                // Real Bank Statement convention: Debit = Withdrawals (OUT), Credit = Deposits (IN)
                setTotalDebit(response.data.total_cleared_withdrawals ?? response.data.total_debit ?? 0);
                setTotalCredit(response.data.total_cleared_deposits ?? response.data.total_credit ?? 0);
                setTotalUnclearedFloat(0);
                setClosingBalance(response.data.closing_bank_balance ?? response.data.closing_balance ?? 0);
                setBalanceType(response.data.balance_type || 'dr');
            } else if (params.reportId === 'detail_ledger' || params.reportId === 'general_ledger') {
                setLedgerData(response.data?.data?.data || []);
                setPageCount(response.data?.data?.last_page || 0);
                setTotalRecords(response.data?.data?.total || 0);
                setOpeningBalance(response.data.opening_balance);
                setPageStartBalance(response.data.page_start_balance);
                setTotalDebit(response.data.total_debit);
                setTotalCredit(response.data.total_credit);
                setClosingBalance(response.data.closing_balance);
                setBalanceType(response.data.balance_type || 'dr');
            } else if (reportId === 'day_book') {
                setDayBookData(response.data?.data || null);
            } else if (reportId === 'outstanding_billwise') {
                setOutstandingBillWiseData(response.data?.data || []);
            } else if (reportId === 'payment_detail') {
                setPaymentDetailData(response.data?.data || []);
            } else if (reportId === 'receiving_detail') {
                setReceivingDetailData(response.data?.data || []);
            } else if (reportId === 'receivable' || reportId === 'payable') {
                setReceivableData(response.data?.data || []);
            } else if (reportId === 'roznamcha') {
                setRoznamchaData(response.data?.data || null);
            } else if (reportId === 'summary') {
                setSummaryData(response.data?.data || []);
            } else if (reportId === 'trial_balance_2col') {
                setTrialBalanceData(response.data?.data || []);
            } else if (reportId === 'trial_balance_6col') {
                setTrialBalance6ColData(response.data?.data || []);
            }
        } catch (error: any) {
            if (reqId !== requestIdRef.current) return;
            console.error("Failed to fetch report", error);
            const message = error.response?.data?.message || "Failed to load report data";
            const details = error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(", ") : "";
            toast.error(`${message} ${details}`);
        } finally {
            if (reqId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    const handleExecute = () => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        fetchData({ pageIndex: 0 });
    };

    const handlePaginationChange = (updater: PaginationState | ((prev: PaginationState) => PaginationState)) => {
        const next = typeof updater === 'function' ? updater(pagination) : updater;
        setPagination(next);
        if (hasSearched) {
            fetchData({ pageIndex: next.pageIndex, pageSize: next.pageSize });
        }
    };

    const handleBankFilterModeChange = (mode: 'all' | 'cleared' | 'pending') => {
        setBankFilterMode(mode);
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        if (hasSearched && params.reportId.toLowerCase() === 'bank_ledger') {
            fetchData({ pageIndex: 0, bankFilterMode: mode });
        }
    };

    // Debounce Bank Ledger table search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBankSearch(bankSearchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [bankSearchTerm]);

    // Refetch from page 1 when debounced Bank Ledger search changes
    useEffect(() => {
        if (!bankSearchMountedRef.current) {
            bankSearchMountedRef.current = true;
            return;
        }
        if (hasSearched && params.reportId.toLowerCase() === 'bank_ledger') {
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            fetchData({ pageIndex: 0, bankSearch: debouncedBankSearch });
        }
    }, [debouncedBankSearch]);

    // Refetch from page 1 when Bank Ledger Payment Filter changes after initial execute
    useEffect(() => {
        const bankFilterChanged = prevBankFilterRef.current !== params.bankFilter;
        prevBankFilterRef.current = params.bankFilter;
        prevDateTypeRef.current = params.dateType;

        if (!bankFilterChanged) return;

        if (hasSearched && params.reportId.toLowerCase() === 'bank_ledger') {
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            fetchData({
                pageIndex: 0,
                bankFilter: params.bankFilter,
            });
        }
    }, [params.bankFilter]);

    // Auto-fetch if navigated with a specific report query
    useEffect(() => {
        const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        if (urlParams?.get('report') || urlParams?.get('reportId')) {
            fetchData({ pageIndex: 0 });
        }
    }, []);

    const filteredLedgerData = useMemo(() => {
        let balance = Number(pageStartBalance);
        const withBalance = ledgerData.map(row => {
            if (balanceType === 'cr') {
                balance = balance + Number(row.credit) - Number(row.debit);
            } else {
                balance = balance + Number(row.debit) - Number(row.credit);
            }
            return { ...row, balance };
        });

        if (!searchTerm) return withBalance;
        return withBalance.filter(row =>
            row.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            row.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ledgerData, pageStartBalance, balanceType, searchTerm]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const buildReportQueryParams = (reportId: string) => {
        const queryParams: Record<string, any> = {
            account_id: params.accountId,
            report_id: reportId,
            from: format(params.fromDate, 'yyyy-MM-dd'),
            to: format(params.toDate, 'yyyy-MM-dd'),
        };

        if (params.firmId && params.firmId !== 'ALL') queryParams.firmId = params.firmId;
        if (params.salemanId && params.salemanId !== 'ALL') queryParams.salemanId = params.salemanId;
        if (params.areaId && params.areaId !== 'ALL') queryParams.areaId = params.areaId;
        if (params.subareaId && params.subareaId !== 'ALL') queryParams.subareaId = params.subareaId;
        if (params.cityId && params.cityId !== 'ALL') queryParams.cityId = params.cityId;
        if (params.provinceId && params.provinceId !== 'ALL') queryParams.provinceId = params.provinceId;
        if (params.type && params.type !== 'ALL') queryParams.type = params.type;
        if (params.noteHead && params.noteHead !== 'ALL') queryParams.noteHead = params.noteHead;
        if (params.nature && params.nature !== 'ALL') queryParams.nature = params.nature;
        if (params.contraId && params.contraId !== 'ALL') queryParams.contraId = params.contraId;
        if (params.remarks) queryParams.remarks = params.remarks;
        if (params.sortBy && params.sortBy !== 'INV_DATE') queryParams.sortBy = params.sortBy;
        if (reportId !== 'bank_ledger' && params.dateType && params.dateType !== 'invdate') queryParams.dateType = params.dateType;
        if (reportId === 'bank_ledger') {
            if (params.bankFilter && params.bankFilter !== 'ALL') queryParams.bankFilter = params.bankFilter;
            if (bankSearchTerm.trim() !== '') queryParams.search = bankSearchTerm.trim();
        }

        return queryParams;
    };

    const handleExportPdf = () => {
        const reportId = params.reportId.toLowerCase();
        let routeName = 'reports.accounts.ledger.export.pdf';
        
        if (reportId === 'account_list') {
            routeName = 'reports.accounts.account_list.export.pdf';
        } else if (reportId === 'accounts_aging') {
            routeName = 'reports.accounts.aging.export.pdf';
        } else if (reportId === 'due_bills') {
            routeName = 'reports.accounts.due_bills.export.pdf';
        } else if (reportId === 'day_book') {
            routeName = 'reports.accounts.day_book.export.pdf';
        } else if (reportId === 'outstanding_billwise') {
            routeName = 'reports.accounts.outstanding_billwise.export.pdf';
        } else if (reportId === 'payment_detail') {
            routeName = 'reports.accounts.payment_detail.export.pdf';
        } else if (reportId === 'receiving_detail') {
            routeName = 'reports.accounts.receiving_detail.export.pdf';
        } else if (reportId === 'receivable') {
            routeName = 'reports.accounts.receivable.export.pdf';
        } else if (reportId === 'payable') {
            routeName = 'reports.accounts.payable.export.pdf';
        } else if (reportId === 'roznamcha') {
            routeName = 'reports.accounts.roznamcha.export.pdf';
        } else if (reportId === 'summary') {
            routeName = 'reports.accounts.summary.export.pdf';
        } else if (reportId === 'trial_balance_2col') {
            routeName = 'reports.accounts.trial_balance_2col.export.pdf';
        } else if (reportId === 'trial_balance_6col') {
            routeName = 'reports.accounts.trial_balance_6col.export.pdf';
        }

        const url = route(routeName, buildReportQueryParams(reportId));
        window.open(url, '_blank');
    };

    const handlePrint = () => {
        const reportId = params.reportId.toLowerCase();
        let routeName = 'reports.accounts.ledger.print';
        
        if (reportId === 'account_list') {
            routeName = 'reports.accounts.account_list.print';
        } else if (reportId === 'accounts_aging') {
            routeName = 'reports.accounts.aging.print';
        } else if (reportId === 'due_bills') {
            routeName = 'reports.accounts.due_bills.print';
        } else if (reportId === 'day_book') {
            routeName = 'reports.accounts.day_book.print';
        } else if (reportId === 'outstanding_billwise') {
            routeName = 'reports.accounts.outstanding_billwise.print';
        } else if (reportId === 'payment_detail') {
            routeName = 'reports.accounts.payment_detail.print';
        } else if (reportId === 'receiving_detail') {
            routeName = 'reports.accounts.receiving_detail.print';
        } else if (reportId === 'receivable') {
            routeName = 'reports.accounts.receivable.print';
        } else if (reportId === 'payable') {
            routeName = 'reports.accounts.payable.print';
        } else if (reportId === 'roznamcha') {
            routeName = 'reports.accounts.roznamcha.print';
        } else if (reportId === 'summary') {
            routeName = 'reports.accounts.summary.print';
        } else if (reportId === 'trial_balance_2col') {
            routeName = 'reports.accounts.trial_balance_2col.print';
        } else if (reportId === 'trial_balance_6col') {
            routeName = 'reports.accounts.trial_balance_6col.print';
        }

        const url = route(routeName, buildReportQueryParams(reportId));
        window.open(url, '_blank');
    };

    const getCriteriaString = () => {
        const parts = [];
        parts.push(`${format(params.fromDate, 'dd/MM/yyyy')} TO ${format(params.toDate, 'dd/MM/yyyy')}`);
        
        if (params.accountId !== 'ALL') {
            const acc = accounts.find(a => a.id.toString() === params.accountId);
            if (acc) parts.push(`ACCOUNT: ${acc.title}`);
        } else {
            parts.push('ALL ACCOUNTS');
        }

        if (params.type !== 'ALL') {
            const t = account_types?.find(x => x.id.toString() === params.type);
            if (t) parts.push(`TYPE: ${t.name.toUpperCase()}`);
        }
        if (params.areaId !== 'ALL') parts.push('AREA FILTERED');
        if (params.salemanId !== 'ALL') parts.push('SALEMAN FILTERED');

        return parts.join(' | ');
    }

    return (
        <>
            <Head title="Account Reports" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset className="bg-background">
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <div className="relative min-h-screen font-sans">
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-border" />
                        <div className="relative p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">

                            {/* Main Parameter Form */}
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                                <ReportParameterForm 
                                    data={params} 
                                    setData={setParams} 
                                    onExecute={handleExecute}
                                    onPrint={handlePrint}
                                    onExportPdf={handleExportPdf}
                                    bootstrap={{
                                        accounts, firms, salesmen, areas, subareas, 
                                        accountTypes: account_types, 
                                        accountCategories: account_categories, 
                                        users,
                                        provinces,
                                        cities
                                    }} 
                                />
                            </motion.div>

                            {/* Report View Area */}
                            <AnimatePresence mode="wait">
                                {!hasSearched ? (
                                    <motion.div 
                                        key="empty"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="h-96 flex flex-col items-center justify-center bg-surface-0 rounded-xl border border-dashed border-border"
                                    >
                                        <div className="h-20 w-20 bg-surface-1 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                            <Search className="h-10 w-10 text-text-muted/30" />
                                        </div>
                                        <h3 className="text-xl font-bold text-text-primary uppercase tracking-tight">Ready to Generate Report</h3>
                                        <p className="text-sm text-text-muted mt-1 max-w-sm text-center">Configure your account, date range, and filters in the form above and click "Execute" to view your report.</p>
                                    </motion.div>
                                ) : loading && executedReportId !== params.reportId.toLowerCase() ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="h-96 flex flex-col items-center justify-center bg-surface-0 rounded-xl border border-dashed border-border"
                                    >
                                        <RefreshCcw className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                                        <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Generating {params.reportId.replace('_', ' ')} Report...</p>
                                    </motion.div>
                                ) : (params.reportId === 'detail_ledger') ? (
                                    <motion.div key="detail-ledger" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className={cn("space-y-6 transition-opacity", loading && "opacity-60 pointer-events-none")}>
                                        <DetailLedgerReportView 
                                            data={filteredLedgerData}
                                            criteria={getCriteriaString()}
                                            openingBalance={openingBalance}
                                            totalDebit={totalDebit}
                                            totalCredit={totalCredit}
                                            closingBalance={closingBalance}
                                            pageCount={pageCount}
                                            totalRecords={totalRecords}
                                            pagination={pagination}
                                            setPagination={handlePaginationChange}
                                            balanceType={balanceType}
                                        />
                                    </motion.div>
                                ) : (params.reportId === 'bank_ledger') ? (
                                    <motion.div key="bank-ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                        <BankLedgerReportView 
                                            data={ledgerData}
                                            criteria={getCriteriaString()}
                                            openingBalance={openingBalance}
                                            totalDebit={totalDebit}
                                            totalCredit={totalCredit}
                                            closingBalance={closingBalance}
                                            pageCount={pageCount}
                                            totalRecords={totalRecords}
                                            pagination={pagination}
                                            setPagination={handlePaginationChange}
                                            bankFilter={params.bankFilter}
                                            searchTerm={bankSearchTerm}
                                            setSearchTerm={setBankSearchTerm}
                                            isLoading={loading}
                                            accountInfo={accounts.find(a => a.id.toString() === params.accountId)}
                                        />
                                    </motion.div>
                                ) : (params.reportId === 'general_ledger') ? (
                                    <motion.div key="ledger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn("space-y-6 transition-opacity", loading && "opacity-60 pointer-events-none")}>
                                        <GeneralLedgerReportView 
                                            data={filteredLedgerData}
                                            criteria={getCriteriaString()}
                                            openingBalance={openingBalance}
                                            totalDebit={totalDebit}
                                            totalCredit={totalCredit}
                                            closingBalance={closingBalance}
                                            pageCount={pageCount}
                                            totalRecords={totalRecords}
                                            pagination={pagination}
                                            setPagination={handlePaginationChange}
                                            balanceType={balanceType}
                                        />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'accounts_aging') ? (
                                    <motion.div key="aging" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <AgingReportView data={agingData} criteria={getCriteriaString()} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'account_list') ? (
                                    <motion.div key="list" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <AccountListReportView data={accountsListData} criteria={getCriteriaString()} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'due_bills') ? (
                                    <motion.div key="due-bills" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <DueBillsReportView data={dueBillsData} criteria={getCriteriaString()} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'day_book') ? (
                                    <motion.div key="day-book" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <DayBookReportView data={dayBookData} criteria={getCriteriaString()} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'outstanding_billwise') ? (
                                    <motion.div key="outstanding-billwise" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <OutstandingBillWiseView data={outstandingBillWiseData} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'payment_detail') ? (
                                    <motion.div key="payment-detail" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <PaymentDetailReportView data={paymentDetailData} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'receiving_detail') ? (
                                    <motion.div key="receiving-detail" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <ReceivingDetailReportView data={receivingDetailData} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'receivable' || params.reportId.toLowerCase() === 'payable') ? (
                                    <motion.div key="receivable-payable" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <ReceivableReportView data={receivableData} reportType={params.reportId.toLowerCase() === 'payable' ? 'payable' : 'receivable'} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'roznamcha') ? (
                                    <motion.div key="roznamcha" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <RoznamchaReportView data={roznamchaData} />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'summary') ? (
                                    <motion.div key="summary" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <SummaryReportView data={summaryData} title="TOTAL SUMMARY" />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'trial_balance_2col') ? (
                                    <motion.div key="trial-balance-2" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <SummaryReportView data={trialBalanceData} title="TOTAL TRIAL BALANCE" />
                                    </motion.div>
                                ) : (params.reportId.toLowerCase() === 'trial_balance_6col') ? (
                                    <motion.div key="trial-balance-6" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }}>
                                        <TrialBalance6ColReportView data={trialBalance6ColData} fromDate={params.fromDate} toDate={params.toDate} />
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="placeholder"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="h-96 flex flex-col items-center justify-center bg-surface-0 rounded-xl border border-dashed border-border"
                                    >
                                        <LayoutDashboard className="h-12 w-12 text-text-muted/20 mb-4" />
                                        <h3 className="text-lg font-bold text-text-muted uppercase tracking-widest">Report Not Implemented</h3>
                                        <p className="text-xs text-text-muted/60 mt-1 uppercase">Logic for "{params.reportId}" is coming soon.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}

