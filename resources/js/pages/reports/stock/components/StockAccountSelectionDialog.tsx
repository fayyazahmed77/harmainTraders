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

    const filteredAccounts = accounts.filter(acc => 
        acc.title.toLowerCase().includes(search.toLowerCase()) ||
        acc.id.toString().includes(search)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-surface-1/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden rounded-sm">
                <DialogHeader className="p-6 border-b border-border/10 bg-surface-1">
                    <DialogTitle className="text-xl font-black text-text-primary uppercase tracking-tighter italic">
                        Supplier <span className="text-emerald-600">Database</span>
                    </DialogTitle>
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
                        <span className="text-[11px] font-black uppercase text-text-primary">All Active Suppliers</span>
                        {selectedAccountId === 'ALL' && <Check className="h-4 w-4 text-emerald-600 ml-auto" />}
                    </button>

                    {filteredAccounts.map((acc) => {
                        const isActive = selectedAccountId === acc.id.toString();
                        return (
                            <button
                                key={acc.id}
                                onClick={() => {
                                    onSelect(acc.id.toString());
                                    onOpenChange(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-4 p-3 rounded-sm transition-all text-left border mb-1 group",
                                    isActive 
                                        ? "bg-emerald-500/10 border-emerald-500/50" 
                                        : "bg-surface-1 border-transparent hover:border-emerald-500/30"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-sm flex items-center justify-center border transition-all",
                                    isActive ? "bg-emerald-600 border-emerald-400 text-white" : "bg-surface-1 border-border/10 text-text-muted group-hover:text-emerald-600"
                                )}>
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-text-primary leading-tight">{acc.title}</span>
                                    <span className="text-[9px] font-bold text-text-muted opacity-60">CODE: {acc.id}</span>
                                </div>
                                {isActive && <Check className="h-4 w-4 text-emerald-600 ml-auto" />}
                            </button>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
}
