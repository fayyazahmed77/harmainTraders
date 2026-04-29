import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Package, Check, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockItemSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: any[];
    selectedItemId: string;
    onSelect: (id: string) => void;
}

export function StockItemSelectionDialog({ 
    open, 
    onOpenChange, 
    items, 
    selectedItemId, 
    onSelect 
}: StockItemSelectionDialogProps) {
    const [search, setSearch] = useState("");

    const filteredItems = items.filter(item => 
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toString().includes(search)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl bg-surface-1/95 backdrop-blur-xl border-border/40 p-0 overflow-hidden rounded-sm">
                <DialogHeader className="p-6 border-b border-border/10 bg-surface-1">
                    <DialogTitle className="text-xl font-black text-text-primary uppercase tracking-tighter italic">
                        Inventory <span className="text-emerald-600">Matrix</span>
                    </DialogTitle>
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted/40" />
                        <Input 
                            placeholder="SEARCH BY PRODUCT NAME OR CODE..." 
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
                            selectedItemId === 'ALL' 
                                ? "bg-emerald-500/10 border-emerald-500/50" 
                                : "bg-surface-1 border-transparent hover:border-emerald-500/30"
                        )}
                    >
                        <div className="h-8 w-8 rounded-sm bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
                            <Package className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-[11px] font-black uppercase text-text-primary">All Inventory Items</span>
                        {selectedItemId === 'ALL' && <Check className="h-4 w-4 text-emerald-600 ml-auto" />}
                    </button>

                    {filteredItems.map((item) => {
                        const isActive = selectedItemId === item.id.toString();
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSelect(item.id.toString());
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
                                    <Tag className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] font-black uppercase text-text-primary leading-tight">{item.title}</span>
                                    <span className="text-[9px] font-bold text-text-muted opacity-60">SKU-ID: {item.id}</span>
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
