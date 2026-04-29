import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Account {
    id: number;
    title: string;
    code?: string;
    area?: { name: string };
    subarea?: { name: string };
}

interface SalesAccountSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: Account[];
    selectedAccountId: string;
    onSelect: (accountId: string) => void;
}

export function SalesAccountSelectionDialog({
    open,
    onOpenChange,
    accounts,
    selectedAccountId,
    onSelect
}: SalesAccountSelectionDialogProps) {
    const [accountSearch, setAccountSearch] = useState('');

    const filteredAccounts = useMemo(() => {
        if (!accountSearch) return accounts;
        const search = accountSearch.toLowerCase();
        return accounts.filter(acc =>
            acc.title.toLowerCase().includes(search) ||
            (acc.code && acc.code.toLowerCase().includes(search)) ||
            (acc.area?.name && acc.area.name.toLowerCase().includes(search))
        );
    }, [accounts, accountSearch]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl p-0 overflow-hidden border-border/50 shadow-2xl rounded-sm bg-background w-[95vw]">
                <DialogHeader className="p-6 pb-4 bg-surface-1/50 text-text-primary relative flex flex-col gap-0 border-b border-border/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <DialogTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                                <Users className="h-5 w-5 text-indigo-600" />
                                Select <span className="text-indigo-600">Customer Account</span>
                            </DialogTitle>
                            <DialogDescription className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">
                                Search and select a customer to filter sales intelligence.
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="w-fit text-[9px] border-border text-text-muted font-black px-2 rounded-none">
                            {accounts.length} TOTAL CUSTOMERS
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                        <Input 
                            placeholder="Enter Customer Name, Code or Area..." 
                            className="h-9 pl-9 pr-4 bg-surface-0 border-border/50 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 rounded-sm text-[11px] transition-all text-text-primary placeholder:text-text-muted/30 font-bold"
                            value={accountSearch}
                            onChange={(e) => setAccountSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </DialogHeader>
                
                <div className="p-0">
                    <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-background">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-surface-1/30">
                                    <th className="sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest text-text-muted h-9 px-6 text-left align-middle bg-surface-1/50 backdrop-blur-sm border-b border-border/20 w-[120px]">Code</th>
                                    <th className="sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest text-text-muted h-9 px-6 text-left align-middle bg-surface-1/50 backdrop-blur-sm border-b border-border/20">Customer Details</th>
                                    <th className="sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest text-text-muted h-9 px-6 text-right align-middle bg-surface-1/50 backdrop-blur-sm border-b border-border/20 w-[150px]">Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(accountSearch === '' || 'all'.includes(accountSearch.toLowerCase())) && (
                                    <tr 
                                        className={cn(
                                            "group cursor-pointer transition-all hover:bg-indigo-500/5",
                                            selectedAccountId === 'ALL' && "bg-indigo-500/5"
                                        )}
                                        onClick={() => {
                                            onSelect('ALL');
                                            onOpenChange(false);
                                            setAccountSearch('');
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <Badge variant="outline" className="font-mono text-[9px] font-black bg-surface-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-none">
                                                ALL
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-black text-[11px] text-text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                All Active Customers / Consolidated
                                            </div>
                                        </td>
                                        <td></td>
                                    </tr>
                                )}
                                {filteredAccounts.length > 0 ? (
                                    filteredAccounts.map((acc) => (
                                        <tr 
                                            key={acc.id} 
                                            className={cn(
                                                "group cursor-pointer border-b border-border/10 transition-all hover:bg-surface-1",
                                                selectedAccountId === acc.id.toString() && "bg-indigo-500/5"
                                            )}
                                            onClick={() => {
                                                onSelect(acc.id.toString());
                                                onOpenChange(false);
                                                setAccountSearch('');
                                            }}
                                        >
                                            <td className="px-6 py-2.5">
                                                <Badge variant="outline" className="font-mono text-[9px] font-bold bg-surface-1/50 border-border/50 text-text-muted group-hover:border-indigo-500/30 group-hover:text-indigo-500 rounded-none">
                                                    {acc.code || "---"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <div className="font-bold text-[11px] text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {acc.title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-2.5 text-right">
                                                <span className="text-[10px] font-black text-text-muted/40 uppercase">
                                                    {acc.area?.name || "---"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="h-[200px] text-center align-middle">
                                            <div className="flex flex-col items-center justify-center text-text-muted/40">
                                                <Search className="h-10 w-10 mb-3 opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No matching customers found</p>
                                                <Button variant="link" onClick={() => setAccountSearch('')} className="text-[10px] text-indigo-500 font-black mt-2 uppercase tracking-tighter shadow-none">Clear search filters</Button>
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
