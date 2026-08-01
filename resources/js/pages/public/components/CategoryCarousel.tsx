import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface Category {
    id: number;
    name: string;
    image_url?: string | null;
}

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
        <div className="sticky top-[68px] z-30 bg-surface-0/95 backdrop-blur-md border-y border-border shadow-md relative overflow-hidden group transition-all">
            <div className="max-w-[1800px] mx-auto relative px-12 py-4">
                {/* Navigation Buttons */}
                <button 
                    onClick={() => scrollCategories('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-2 dark:bg-zinc-800 shadow-lg border border-border flex items-center justify-center text-text-primary hover:text-amber z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={() => scrollCategories('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface-2 dark:bg-zinc-800 shadow-lg border border-border flex items-center justify-center text-text-primary hover:text-amber z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
                >
                    <ChevronRight size={20} />
                </button>

                {/* Scrollable Container */}
                <div 
                    ref={scrollRef}
                    className="flex gap-8 overflow-x-auto no-scrollbar scroll-smooth px-2 py-2"
                >
                    <button 
                        onClick={() => setSelectedCategory('all')}
                        className="flex flex-col items-center gap-2 flex-shrink-0 group/item"
                    >
                        <div className={`w-16 h-16 rounded-full p-1 transition-all duration-300 border-2 ${selectedCategory === 'all' ? 'border-amber scale-110 shadow-lg shadow-amber/20' : 'border-transparent group-hover/item:border-border'}`}>
                            <div className="w-full h-full rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                                <ShoppingBag size={24} className={`${selectedCategory === 'all' ? 'text-amber' : 'text-text-muted'} transition-colors`} />
                            </div>
                        </div>
                        <span className={`text-[10px] font-mono-jet font-black uppercase tracking-[0.1em] ${selectedCategory === 'all' ? 'text-amber' : 'text-text-muted'} transition-colors`}>All Items</span>
                    </button>

                    {categories.map(cat => (
                        <button 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className="flex flex-col items-center gap-2 flex-shrink-0 group/item"
                        >
                            <div className={`w-16 h-16 rounded-full p-1 transition-all duration-300 border-2 ${selectedCategory === cat.id ? 'border-amber scale-110 shadow-lg shadow-amber/20' : 'border-transparent group-hover/item:border-border'}`}>
                                <div className="w-full h-full rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                                    {cat.image_url ? (
                                        <img 
                                            src={cat.image_url} 
                                            alt={cat.name} 
                                            className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-300" 
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                    ) : (
                                        <Package size={24} className={`${selectedCategory === cat.id ? 'text-amber' : 'text-text-muted'} transition-colors`} />
                                    )}
                                </div>
                            </div>
                            <span className={`text-[10px] font-mono-jet font-black uppercase tracking-[0.1em] ${selectedCategory === cat.id ? 'text-amber' : 'text-text-muted'} transition-colors`}>{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
