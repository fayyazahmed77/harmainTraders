import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User, Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockAccountSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accounts: any[];
    selectedAccountId: string;
    onSelect: (id: string) => void;
}

export function StockAccountSelectionDialog({ 
    open, 
    onOpenChange, 
    accounts, 
    selectedAccountId, 
    onSelect 
}: StockAccountSelectionDialogProps) {
    const [search, setSearch] = useState("");

    const filteredAccounts = accounts
        .filter(acc => {
            const typeName = (acc.type_name || '').toLowerCase();
            const isCompany = typeName.includes('company') || Number(acc.type) === 5;
            const isSpecial = ['cheque', 'bank', 'cash', 'expense', 'capital', 'drawing', 'taxation', 'loan', 'asset'].some(k => typeName.includes(k));
            if (isCompany || isSpecial) return false;
            return true;
        })
        .filter(acc => 
            acc.title.toLowerCase().includes(search.toLowerCase()) ||
            acc.id.toString().includes(search)
        );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-surface-1/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden rounded-sm">
                <DialogHeader className="p-6 border-b border-border/10 bg-surface-1">
                    <DialogTitle className="text-xl font-black text-text-primary uppercase tracking-tighter italic">
                        Supplier & Customer <span className="text-emerald-600">Database</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Select a supplier or customer account
                    </DialogDescription>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" />
                        <Input 
                            placeholder="SEARCH BY NAME OR CODE..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-surface-0 border-border/20 rounded-none h-11 text-[11px] font-black uppercase tracking-widest focus-visible:ring-emerald-600/20"
                        />
                    </div>
                </DialogHeader>
                
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 bg-surface-0/50">
                    <button
                        onClick={() => {
                            onSelect('ALL');
                            onOpenChange(false);
                        }}
                        className={cn(
                            "w-full flex items-center gap-4 p-3 rounded-sm transition-all text-left border mb-1",
                            selectedAccountId === 'ALL' 
                                ? "bg-emerald-500/10 border-emerald-500/50" 
                                : "bg-surface-1 border-transparent hover:border-emerald-500/30"
                        )}
                    >
                        <div className="h-8 w-8 rounded-sm bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-black uppercase text-text-primary">All Active Parties</span>
                        {selectedAccountId === 'ALL' && <Check className="h-4 w-4 text-emerald-600 ml-auto" />}
                    </button>

                    {filteredAccounts.map((acc) => {
                        const isActive = selectedAccountId === acc.id.toString();
                        const isCustomer = acc.type === 3 || (acc.type_name || '').toLowerCase().includes('cust');
                        const codeDisplay = acc.code || acc.id;

                        return (
                            <button
                                key={acc.id}
                                onClick={() => {
                                    onSelect(acc.id.toString());
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "w-full flex items-center justify-between gap-3 p-3 rounded-md transition-all text-left border mb-1.5 group cursor-pointer",
                                    isActive 
                                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-sm" 
                                        : "bg-surface-1/90 border-border/30 hover:border-emerald-500/30 hover:bg-surface-0/60"
                                )}
                            >
                                {/* Left Side: Icon + Code + Name */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {/* Icon */}
                                    <div className={cn(
                                        "h-8 w-8 shrink-0 rounded-md flex items-center justify-center border transition-all",
                                        isActive ? "bg-emerald-600 border-emerald-400 text-white" : "bg-surface-0 border-border/20 text-text-muted group-hover:text-emerald-600 group-hover:border-emerald-500/30"
                                    )}>
                                        <User className="h-4 w-4" />
                                    </div>

                                    {/* Code Badge */}
                                    <span className="shrink-0 text-[9px] font-black font-mono text-text-muted bg-surface-0/90 px-2 py-1 rounded border border-border/40 tracking-wider">
                                        CODE: {codeDisplay}
                                    </span>

                                    {/* Name / Title */}
                                    <span className="text-[12px] font-black text-text-primary uppercase leading-tight truncate">
                                        {acc.title}
                                    </span>
                                </div>

                                {/* Right Side: Type Badge + Checkmark */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {acc.type_name && (
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-2.5 py-1 rounded border tracking-widest leading-none",
                                            isCustomer
                                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                        )}>
                                            {acc.type_name}
                                        </span>
                                    )}
                                    {isActive && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
