import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Item } from './types';

interface ProductCardProps {
    item: Item;
    formatCurrency: (val: number) => string;
    setBuyItem: (item: Item) => void;
    setBuyOpen: (val: boolean) => void;
    DEFAULT_IMAGE: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    item,
    formatCurrency,
    setBuyItem,
    setBuyOpen,
    DEFAULT_IMAGE
}) => {
    return (
        <Card className="bg-white dark:bg-zinc-900 py-0 border-none shadow-sm hover:shadow-md overflow-hidden flex flex-col group transition-all duration-200 cursor-pointer rounded-lg">
            <div className="aspect-square relative overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                <img
                    src={item.image || DEFAULT_IMAGE} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                />
                {/* Floating Add to Cart - AliExpress Style */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setBuyItem(item);
                        setBuyOpen(true);
                    }}
                    className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-zinc-900 hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
                >
                    <Plus size={18} strokeWidth={3} />
                </button>

                {(item as any).stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                        <Badge variant="destructive" className="font-black italic uppercase tracking-widest px-2 py-0.5 text-[8px] shadow-lg">Out of Stock</Badge>
                    </div>
                )}
            </div>

            <div className="p-2 space-y-1.5 flex-1 flex flex-col">
                {/* Brand & Stats */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase truncate tracking-tighter">
                        {item.company}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-medium text-[11px] leading-tight text-zinc-800 dark:text-zinc-200 line-clamp-2 h-7 group-hover:text-orange-500 transition-colors">
                    {item.title}
                </h3>

                {/* Price & Shipping */}
                <div className="mt-auto">
                    <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-black uppercase text-orange-500">PKR</span>
                        <span className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tighter">
                            {formatCurrency(item.price).replace('Rs ', '')}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-md font-bold uppercase tracking-widest">
                            {item.packing_qty} Pcs
                        </span>
                        {/* <span className="text-[8px] font-bold text-emerald-500 uppercase">Free Shipping</span> */}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export const ProductCardSkeleton = () => (
    <Card className="bg-white dark:bg-zinc-900 py-0 border-none shadow-sm overflow-hidden flex flex-col rounded-lg">
        <div className="aspect-square relative bg-zinc-100 dark:bg-zinc-800 animate-pulse">
            <Skeleton className="w-full h-full rounded-none" />
        </div>
        <div className="p-2 space-y-1.5 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
                <Skeleton className="h-2 w-16" />
            </div>
            <Skeleton className="h-7 w-full" />
            <div className="mt-auto space-y-2">
                <div className="flex items-baseline gap-1">
                    <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </div>
    </Card>
);
