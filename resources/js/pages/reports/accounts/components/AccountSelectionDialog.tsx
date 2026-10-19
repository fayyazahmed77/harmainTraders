import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Search, Filter, X, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Account {
    id: number;
    title: string;
    code?: string;
    type?: number;
    area_id?: number;
    subarea_id?: number;
    account_type?: { name: string; id?: number };
    area?: { name: string };
    subarea?: { name: string };
}

interface AccountSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
    selectedAccountId: string;
    onSelect: (accountId: string) => void;
    accountTypes?: Array<{ id: number | string; name: string }>;
}

export function AccountSelectionDialog({
    open,
    onOpenChange,
    accounts,
    selectedAccountId,
    onSelect,
    accountTypes = []
}: AccountSelectionDialogProps) {
    const [accountSearch, setAccountSearch] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');

    // Extract dynamic account types with account counts
    const availableAccountTypes = useMemo(() => {
        const typeCountMap = new Map<string, { id: string | number; name: string; count: number }>();

        // Pre-populate with passed accountTypes if provided
        if (accountTypes && accountTypes.length > 0) {
            accountTypes.forEach(at => {
                if (at.name) {
                    const key = at.name.trim();
                    typeCountMap.set(key.toLowerCase(), {
                        id: at.id,
                        name: key,
                        count: 0
                    });
                }
            });
        }

        // Count active accounts and detect types directly from account list
        const activeAccounts = accounts.filter(acc => (acc as any).status !== false && (acc as any).status !== 0);
        activeAccounts.forEach(acc => {
            const typeName = acc.account_type?.name || (acc as any).type_name;
            const typeId = acc.account_type?.id ?? acc.type;

            if (typeName && typeof typeName === 'string') {
                const trimmed = typeName.trim();
                const key = trimmed.toLowerCase();
                const existing = typeCountMap.get(key);
                if (existing) {
                    existing.count += 1;
                } else {
                    typeCountMap.set(key, {
                        id: typeId ?? trimmed,
                        name: trimmed,
                        count: 1
                    });
                }
            }
        });

        return Array.from(typeCountMap.values())
            .filter(t => t.count > 0)
            .sort((a, b) => b.count - a.count);
    }, [accounts, accountTypes]);

    // Filter accounts based on search query and selected account type
    const filteredAccounts = useMemo(() => {
        const activeAccounts = accounts.filter(acc => (acc as any).status !== false && (acc as any).status !== 0);
        const search = accountSearch.trim().toLowerCase();
        const typeFilter = selectedType.trim().toLowerCase();

        return activeAccounts.filter(acc => {
            // 1. Account Type filter
            if (selectedType !== 'ALL') {
                const accTypeName = acc.account_type?.name?.trim().toLowerCase() || '';
                const accTypeId = String(acc.account_type?.id ?? acc.type ?? '');

                const matchesType = accTypeName === typeFilter || accTypeId === selectedType;
                if (!matchesType) return false;
            }

            // 2. Search query filter
            if (search) {
                const matchesSearch = 
                    acc.title.toLowerCase().includes(search) ||
                    (acc.code && acc.code.toLowerCase().includes(search)) ||
                    (acc.account_type?.name && acc.account_type.name.toLowerCase().includes(search)) ||
                    (acc.area?.name && acc.area.name.toLowerCase().includes(search)) ||
                    (acc.subarea?.name && acc.subarea.name.toLowerCase().includes(search));

                if (!matchesSearch) return false;
            }

            return true;
        });
    }, [accounts, accountSearch, selectedType]);

    const handleClose = () => {
        setAccountSearch('');
        setSelectedType('ALL');
        onOpenChange(false);
    };

    // Helper for badge color based on account type
    const getTypeBadgeColor = (typeName?: string) => {
        if (!typeName) return 'bg-slate-400';
        const lower = typeName.toLowerCase();
        if (lower.includes('bank')) return 'bg-blue-500';
        if (lower.includes('cash')) return 'bg-emerald-500';
        if (lower.includes('customer')) return 'bg-indigo-500';
        if (lower.includes('supplier')) return 'bg-amber-500';
        if (lower.includes('company')) return 'bg-purple-500';
        if (lower.includes('cheque')) return 'bg-teal-500';
        if (lower.includes('expense')) return 'bg-rose-500';
        return 'bg-indigo-400';
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
            <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white max-h-[90dvh] flex flex-col">
                {/* Modal Header */}
                <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 bg-slate-900 text-white relative flex flex-col gap-0 border-none shadow-none shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">Select Account</DialogTitle>
                            <p className="text-slate-400 text-xs mt-1 font-medium">Search and select an account to view its detailed ledger.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedType !== 'ALL' && (
                                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                    {selectedType}
                                </Badge>
                            )}
                            <Badge variant="outline" className="w-fit text-[10px] border-slate-700 text-slate-400">
                                {filteredAccounts.length} / {accounts.length} Accounts
                            </Badge>
                        </div>
                    </div>

                    {/* Search & Filter Controls */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by Title, Code, Area..." 
                                className="h-10 pl-10 pr-9 bg-slate-800/80 border-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 rounded-lg text-sm transition-all text-white placeholder:text-slate-400"
                                value={accountSearch}
                                onChange={(e) => setAccountSearch(e.target.value)}
                                autoFocus
                            />
                            {accountSearch && (
                                <button 
                                    type="button"
                                    onClick={() => setAccountSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Account Type Dropdown Filter */}
                        <div className="w-full sm:w-[220px] shrink-0">
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-10 bg-slate-800/80 border-slate-700 text-white rounded-lg text-xs font-semibold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 w-full">
                                    <div className="flex items-center gap-2 truncate">
                                        <Filter className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                        <SelectValue placeholder="All Account Types" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white z-[100] max-h-72">
                                    <SelectItem value="ALL" className="text-xs font-medium focus:bg-indigo-600 focus:text-white cursor-pointer">
                                        All Account Types ({accounts.length})
                                    </SelectItem>
                                    {availableAccountTypes.map(t => (
                                        <SelectItem 
                                            key={String(t.name)} 
                                            value={String(t.name)}
                                            className="text-xs font-medium focus:bg-indigo-600 focus:text-white cursor-pointer"
                                        >
                                            {t.name} ({t.count})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Quick Filter Badges/Pills */}
                    {availableAccountTypes.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto custom-scrollbar pb-1 text-xs">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                                Type:
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedType('ALL')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 border",
                                    selectedType === 'ALL'
                                        ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                                        : "bg-slate-800/60 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white"
                                )}
                            >
                                All ({accounts.length})
                            </button>
                            {availableAccountTypes.map((t) => (
                                <button
                                    key={String(t.name)}
                                    type="button"
                                    onClick={() => setSelectedType(selectedType === t.name ? 'ALL' : t.name)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap shrink-0 border",
                                        selectedType === t.name
                                            ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                                            : "bg-slate-800/60 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    {t.name} ({t.count})
                                </button>
                            ))}
                        </div>
                    )}
                </DialogHeader>

                {/* Table Body */}
                <div className="p-0 flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
                    <div className="overflow-x-auto touch-scroll-x overflow-y-auto custom-scrollbar flex-1 min-w-0 bg-white">
                        <table className="w-full border-collapse min-w-[550px]">
                            <thead>
                                <tr className="border-none">
                                    <th className="sticky top-0 z-30 bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 px-3 md:px-6 border-b border-slate-800 text-left align-middle whitespace-nowrap">Code</th>
                                    <th className="sticky top-0 z-30 bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 px-3 md:px-6 border-b border-slate-800 text-left align-middle whitespace-nowrap">Name / Title</th>
                                    <th className="sticky top-0 z-30 bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 px-3 md:px-6 border-b border-slate-800 text-left align-middle whitespace-nowrap">Type</th>
                                    <th className="sticky top-0 z-30 bg-slate-900 text-[10px] font-bold uppercase tracking-wider text-slate-400 h-10 px-3 md:px-6 border-b border-slate-800 text-center align-middle whitespace-nowrap">Area / Sub Area</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {selectedType === 'ALL' && (accountSearch === '' || 'all accounts'.includes(accountSearch.toLowerCase())) && (
                                    <tr 
                                        key="all" 
                                        className={cn(
                                            "group cursor-pointer border-b border-slate-50 transition-colors hover:bg-indigo-50/50",
                                            selectedAccountId === 'ALL' && "bg-indigo-50"
                                        )}
                                        onClick={() => {
                                            onSelect('ALL');
                                            handleClose();
                                        }}
                                    >
                                        <td className="px-6 py-3 align-middle">
                                            <Badge variant="outline" className="font-mono text-[10px] font-bold bg-white text-slate-600 border-slate-200">
                                                ALL
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3 align-middle">
                                            <div className="font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                                                All Active Accounts
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 align-middle" colSpan={2}>
                                            <div className="flex items-center gap-1.5 opacity-50">
                                                <span className="text-xs font-medium text-slate-600">
                                                    Select to view aggregate ledger
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {filteredAccounts.length > 0 ? (
                                    filteredAccounts.map((acc) => (
                                        <tr 
                                            key={acc.id} 
                                            className={cn(
                                                "group cursor-pointer border-b border-slate-50 transition-colors hover:bg-indigo-50/50",
                                                selectedAccountId === acc.id.toString() && "bg-indigo-50"
                                            )}
                                            onClick={() => {
                                                onSelect(acc.id.toString());
                                                handleClose();
                                            }}
                                        >
                                            <td className="px-6 py-3 align-middle">
                                                <Badge variant="outline" className="font-mono text-[10px] font-bold bg-white text-slate-600 border-slate-200">
                                                    {acc.code || "---"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-3 align-middle">
                                                <div className="font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors truncate">
                                                    {acc.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full shrink-0", getTypeBadgeColor(acc.account_type?.name))} />
                                                    <span className="text-xs font-medium text-slate-700 truncate">
                                                        {acc.account_type?.name || "---"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-center align-middle">
                                                <div className="flex flex-col italic items-center truncate">
                                                    <span className="text-xs font-semibold text-slate-700">{acc.area?.name || "---"}</span>
                                                    <span className="text-[10px] text-slate-400">{acc.subarea?.name || "---"}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="h-[220px] text-center align-middle bg-white">
                                            <div className="flex flex-col items-center justify-center text-slate-400 p-6">
                                                <Search className="h-10 w-10 mb-3 opacity-25" />
                                                <p className="text-sm font-semibold text-slate-600">
                                                    No accounts found
                                                    {accountSearch ? ` matching "${accountSearch}"` : ''}
                                                    {selectedType !== 'ALL' ? ` under "${selectedType}"` : ''}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Try adjusting your search query or selecting a different account type.
                                                </p>
                                                {(accountSearch || selectedType !== 'ALL') && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => { setAccountSearch(''); setSelectedType('ALL'); }} 
                                                        className="text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold mt-4"
                                                    >
                                                        Reset Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
