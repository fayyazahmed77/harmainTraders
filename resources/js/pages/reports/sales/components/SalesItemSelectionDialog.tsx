import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
    id: number;
    title: string;
    code?: string;
}

interface SalesItemSelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: Item[];
    selectedItemId: string;
    onSelect: (itemId: string) => void;
}

export function SalesItemSelectionDialog({
    open,
    onOpenChange,
    items,
    selectedItemId,
    onSelect
}: SalesItemSelectionDialogProps) {
    const [itemSearch, setItemSearch] = useState('');

    const filteredItems = useMemo(() => {
        if (!itemSearch) return items;
        const search = itemSearch.toLowerCase();
        return items.filter(item =>
            item.title.toLowerCase().includes(search) ||
            (item.code && item.code.toLowerCase().includes(search))
        );
    }, [items, itemSearch]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border-border/50 shadow-2xl rounded-sm bg-background w-[95vw]">
                <DialogHeader className="p-6 pb-4 bg-surface-1/50 text-text-primary relative flex flex-col gap-0 border-b border-border/20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <DialogTitle className="text-xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                                <Package className="h-5 w-5 text-indigo-600" />
                                Select <span className="text-indigo-600">Product Item</span>
                            </DialogTitle>
                            <DialogDescription className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">
                                Search and select a product to analyze its sales performance.
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="w-fit text-[9px] border-border text-text-muted font-black px-2 rounded-none">
                            {items.length} TOTAL PRODUCTS
                        </Badge>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                        <Input 
                            placeholder="Enter Product Title or Code..." 
                            className="h-9 pl-9 pr-4 bg-surface-0 border-border/50 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500 rounded-sm text-[11px] transition-all text-text-primary placeholder:text-text-muted/30 font-bold"
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
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
                                    <th className="sticky top-0 z-10 text-[9px] font-black uppercase tracking-widest text-text-muted h-9 px-6 text-left align-middle bg-surface-1/50 backdrop-blur-sm border-b border-border/20">Product Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(itemSearch === '' || 'all'.includes(itemSearch.toLowerCase())) && (
                                    <tr 
                                        className={cn(
                                            "group cursor-pointer transition-all hover:bg-indigo-500/5",
                                            selectedItemId === 'ALL' && "bg-indigo-500/5"
                                        )}
                                        onClick={() => {
                                            onSelect('ALL');
                                            onOpenChange(false);
                                            setItemSearch('');
                                        }}
                                    >
                                        <td className="px-6 py-3">
                                            <Badge variant="outline" className="font-mono text-[9px] font-black bg-surface-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-none">
                                                ALL
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-black text-[11px] text-text-secondary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                                                All Products / Consolidated Analysis
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <tr 
                                            key={item.id} 
                                            className={cn(
                                                "group cursor-pointer border-b border-border/10 transition-all hover:bg-surface-1",
                                                selectedItemId === item.id.toString() && "bg-indigo-500/5"
                                            )}
                                            onClick={() => {
                                                onSelect(item.id.toString());
                                                onOpenChange(false);
                                                setItemSearch('');
                                            }}
                                        >
                                            <td className="px-6 py-2.5">
                                                <Badge variant="outline" className="font-mono text-[9px] font-bold bg-surface-1/50 border-border/50 text-text-muted group-hover:border-indigo-500/30 group-hover:text-indigo-500 rounded-none">
                                                    {item.code || "---"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-2.5">
                                                <div className="font-bold text-[11px] text-text-primary group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {item.title}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="h-[200px] text-center align-middle">
                                            <div className="flex flex-col items-center justify-center text-text-muted/40">
                                                <Search className="h-10 w-10 mb-3 opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">No matching items found</p>
                                                <Button variant="link" onClick={() => setItemSearch('')} className="text-[10px] text-indigo-500 font-black mt-2 uppercase tracking-tighter shadow-none">Clear search filters</Button>
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
