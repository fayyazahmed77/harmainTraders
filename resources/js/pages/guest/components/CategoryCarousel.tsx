import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Category } from './types';

interface CategoryCarouselProps {
    categories: Category[];
    selectedCategory: string | number;
    setSelectedCategory: (val: string | number) => void;
    DEFAULT_IMAGE: string;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
    categories,
    selectedCategory,
    setSelectedCategory,
    DEFAULT_IMAGE
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollCategories = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 300;
            scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden group">
            <div className="max-w-[1800px] mx-auto relative px-12 py-6">
                {/* Navigation Buttons */}
                <button 
                    onClick={() => scrollCategories('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 hover:text-orange-600 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={() => scrollCategories('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-600 hover:text-orange-600 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Scrollable Container */}
                <div 
                    ref={scrollRef}
                    className="flex gap-8 overflow-x-auto no-scrollbar scroll-smooth px-2 py-4"
                >
                    <button 
                        onClick={() => setSelectedCategory('all')}
                        className="flex flex-col items-center gap-3 flex-shrink-0 group/item"
                    >
                        <div className={`w-20 h-20 rounded-full p-1 transition-all duration-500 border-2 ${selectedCategory === 'all' ? 'border-orange-500 scale-110 shadow-xl shadow-orange-500/20' : 'border-transparent group-hover/item:border-slate-300 dark:group-hover/item:border-zinc-600'}`}>
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                <ShoppingBag size={32} className={`${selectedCategory === 'all' ? 'text-orange-500' : 'text-slate-400'} transition-colors`} />
                            </div>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${selectedCategory === 'all' ? 'text-orange-600' : 'text-slate-500'} transition-colors`}>All Items</span>
                    </button>

                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="flex flex-col items-center gap-3 flex-shrink-0 group/item"
                        >
                            <div className={`w-20 h-20 rounded-full p-1 transition-all duration-500 border-2 ${selectedCategory === cat.id ? 'border-orange-500 scale-110 shadow-xl shadow-orange-500/20' : 'border-transparent group-hover/item:border-slate-300 dark:group-hover/item:border-zinc-600'}`}>
                                <div className="w-full h-full rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                    {cat.image ? (
                                        <img 
                                            src={`/images/${cat.image.split('/').pop()}`} 
                                            alt={cat.name} 
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                    ) : (
                                        <Package size={32} className={`${selectedCategory === cat.id ? 'text-orange-500' : 'text-slate-400'} transition-colors`} />
                                    )}
                                </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${selectedCategory === cat.id ? 'text-orange-600' : 'text-slate-500'} transition-colors`}>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CategorySkeleton = () => (
    <div className="flex flex-col items-center gap-3 flex-shrink-0 animate-pulse">
        <div className="w-20 h-20 rounded-full border-2 border-transparent p-1">
            <Skeleton className="w-full h-full rounded-full" />
        </div>
        <Skeleton className="h-3 w-16 rounded-full" />
    </div>
);
