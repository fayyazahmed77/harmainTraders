import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Item } from './types';

interface ProductListItemProps {
    item: Item;
    formatCurrency: (val: number) => string;
    setBuyItem: (item: Item) => void;
    setBuyOpen: (val: boolean) => void;
    DEFAULT_IMAGE: string;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
    item,
    formatCurrency,
    setBuyItem,
    setBuyOpen,
    DEFAULT_IMAGE
}) => {
    return (
        <Card className="p-0 bg-white dark:bg-zinc-900 border-none shadow-md relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row h-auto sm:h-[120px]">
                {/* Left: Large Image */}
                <div className="w-full sm:w-[120px] h-[120px] bg-slate-50 dark:bg-zinc-800 flex-shrink-0 relative overflow-hidden">
                    <img
                        src={item.image || DEFAULT_IMAGE} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                        }}
                    />
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-orange-600 text-white border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shadow-lg">
                            {item.code}
                        </Badge>
                    </div>
                </div>

                {/* Middle: Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-orange-500 font-black uppercase tracking-widest">
                                {item.company}
                            </span>
                            <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                                Packing: {item.packing_qty} Pcs
                            </span>
                        </div>
                        <h3 className="font-black text-lg leading-none italic uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                            {item.title}
                        </h3>
                    </div>

                    <div className="flex items-center gap-8 mt-2">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Full CTN</span>
                            <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                                {formatCurrency(item.price_carton || item.price * item.packing_qty)}
                            </span>
                        </div>
                        <div className="h-8 w-px bg-slate-100 dark:bg-zinc-800" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Loose CTN</span>
                            <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                                {formatCurrency(item.price_loose_carton || item.price * item.packing_qty)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="p-4 flex items-end sm:items-center justify-end sm:border-l sm:border-slate-50 sm:dark:border-zinc-800/50 bg-slate-50/30 dark:bg-zinc-800/20 sm:min-w-[140px]">
                    <Button 
                        onClick={() => {
                            setBuyItem(item);
                            setBuyOpen(true);
                        }}
                        className="w-full sm:w-auto px-8 bg-orange-600 hover:bg-orange-700 text-white font-black uppercase italic tracking-widest rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all group"
                    >
                        <ShoppingBag size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                        Buy
                    </Button>
                </div>
            </div>
        </Card>
    );
};
