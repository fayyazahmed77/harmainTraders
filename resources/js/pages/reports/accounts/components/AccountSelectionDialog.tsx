import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
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

interface AccountSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
    selectedAccountId: string;
    onSelect: (accountId: string) => void;
}

export function AccountSelectionDialog({
    open,
    onOpenChange,
    accounts,
    selectedAccountId,
    onSelect
}: AccountSelectionDialogProps) {
    const [accountSearch, setAccountSearch] = useState('');

    const filteredAccounts = useMemo(() => {
        const activeAccounts = accounts.filter(acc => (acc as any).status !== false && (acc as any).status !== 0);
        if (!accountSearch) return activeAccounts;
        const search = accountSearch.toLowerCase();
        return activeAccounts.filter(acc =>
            acc.title.toLowerCase().includes(search) ||
            (acc.code && acc.code.toLowerCase().includes(search)) ||
            (acc.account_type?.name && acc.account_type.name.toLowerCase().includes(search)) ||
            (acc.area?.name && acc.area.name.toLowerCase().includes(search)) ||
            (acc.subarea?.name && acc.subarea.name.toLowerCase().includes(search))
        );
    }, [accounts, accountSearch]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-xl bg-white max-h-[90dvh] flex flex-col">
                <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 bg-slate-900 text-white relative flex flex-col gap-0 border-none shadow-none shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <div>
                            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">Select Account</DialogTitle>
                            <p className="text-slate-400 text-xs mt-1 font-medium">Search and select an account to view its detailed ledger.</p>
                        </div>
                        <Badge variant="outline" className="w-fit text-[10px] border-slate-700 text-slate-400">
                            {accounts.length} Total Accounts
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Search by Title, Code, Type or Area..." 
                            className="h-10 pl-10 pr-4 bg-slate-800/50 border-slate-700 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 rounded-lg text-sm transition-all text-white placeholder:text-slate-500"
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </DialogHeader>
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
                                    {(accountSearch === '' || 'all accounts'.includes(accountSearch.toLowerCase())) && (
                                        <tr 
                                            key="all" 
                                            className={cn(
                                                "group cursor-pointer border-b border-slate-50 transition-colors hover:bg-indigo-50/50",
                                                selectedAccountId === 'ALL' && "bg-indigo-50"
                                            )}
                                            onClick={() => {
                                                onSelect('ALL');
                                                onOpenChange(false);
                                                setAccountSearch('');
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
                                                    onOpenChange(false);
                                                    setAccountSearch('');
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
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                                        <span className="text-xs font-medium text-slate-600 truncate">
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
                                            <td colSpan={4} className="h-[200px] text-center align-middle bg-white">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <Search className="h-10 w-10 mb-3 opacity-20" />
                                                    <p className="text-sm font-medium">No accounts found matching "{accountSearch}"</p>
                                                    <Button variant="link" onClick={() => setAccountSearch('')} className="text-xs text-indigo-500 font-bold mt-2">Clear search</Button>
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
