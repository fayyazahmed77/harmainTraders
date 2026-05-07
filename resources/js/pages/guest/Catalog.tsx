import React, { useState, useEffect, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { 
    LayoutGrid, 
    List as ListIcon, 
    Box
} from "lucide-react";
import axios from "axios";

// UI Components
import { Badge } from '@/components/ui/badge';

// Domain Components
import { CatalogHeader } from './components/CatalogHeader';
import { CategoryCarousel, CategorySkeleton } from './components/CategoryCarousel';
import { ProductCard, ProductCardSkeleton } from './components/ProductCard';
import { ProductListItem } from './components/ProductListItem';
import { CartDrawer } from './components/CartDrawer';
import { BuyNowDialog } from './components/BuyNowDialog';
import { SuccessDialog } from './components/SuccessDialog';
import { CatalogFooter } from './components/CatalogFooter';
import { Item, Cart, Category } from './components/types';

interface CatalogProps {
    items: Item[];
    categories: Category[];
    account: { title: string };
    token: string;
}

const DEFAULT_IMAGE = "https://placehold.co/400x400/f8fafc/cbd5e1?text=No+Image";

export default function Catalog({ items, categories, account, token }: CatalogProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [cart, setCart] = useState<Cart>(() => {
        const saved = localStorage.getItem(`cart_${token}`);
        return saved ? JSON.parse(saved) : {};
    });
    
    const [buyItem, setBuyItem] = useState<Item | null>(null);
    const [buyOpen, setBuyOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successInvoice, setSuccessInvoice] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
    }, [selectedCategory]);

    useEffect(() => {
        localStorage.setItem(`cart_${token}`, JSON.stringify(cart));
    }, [cart, token]);

    const filteredItems = useMemo(() => {
        const query = search.toLowerCase();
        return items.filter(item => {
            const matchesSearch = (item.title?.toLowerCase() ?? '').includes(query) || 
                                (item.code?.toLowerCase() ?? '').includes(query) ||
                                (item.company?.toLowerCase() ?? '').includes(query);
            const matchesCategory = selectedCategory === 'all' || String(item.category_id) === String(selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [items, search, selectedCategory]);

    const cartCount = Object.keys(cart).length;
    const cartTotal = Object.values(cart).reduce((acc, item) => {
        return acc + (item.qty_carton * item.price_carton) + (item.qty_pcs * (item.price_piece || 0));
    }, 0);

    const updateCart = (item: Item, field: 'qty_carton' | 'qty_pcs', value: number) => {
        setCart(prev => {
            const currentItem = prev[item.id] || { ...item, qty_carton: 0, qty_pcs: 0 };
            const newQty = Math.max(0, value);
            
            const newCart = { ...prev };
            const updatedItem = { ...currentItem, [field]: newQty };

            if (updatedItem.qty_carton === 0 && updatedItem.qty_pcs === 0) {
                delete newCart[item.id];
            } else {
                newCart[item.id] = updatedItem;
            }
            
            return newCart;
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(value).replace('PKR', 'Rs');
    };

    const handleCheckout = async () => {
        setProcessing(true);
        try {
            const response = await axios.post(`/g/${token}/order`, {
                items: Object.values(cart).map(it => ({
                    id: it.id,
                    qty_carton: it.qty_carton,
                    qty_pcs: it.qty_pcs
                }))
            });

            if (response.data.success) {
                setSuccessInvoice(response.data.invoice);
                setCart({});
                setCheckoutOpen(false);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to place order");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
            <Head title="Product Catalog" />

            <CatalogHeader 
                search={search}
                setSearch={setSearch}
                cartCount={cartCount}
                cartTotal={cartTotal}
                formatCurrency={formatCurrency}
                setCheckoutOpen={setCheckoutOpen}
                account={account}
                token={token}
            />

            {loading ? (
                <div className="bg-white dark:bg-zinc-900 shadow-sm relative overflow-hidden group">
                    <div className="max-w-[1800px] mx-auto relative px-12 py-10">
                        <div className="flex gap-8 overflow-x-hidden px-2">
                            {[...Array(12)].map((_, i) => (
                                <CategorySkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <CategoryCarousel 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    DEFAULT_IMAGE={DEFAULT_IMAGE}
                />
            )}

            <main className="max-w-[1800px] mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-black italic uppercase text-slate-900 dark:text-zinc-100 tracking-tighter">
                            {selectedCategory === 'all' ? 'All Items' : categories.find(c => c.id === selectedCategory)?.name}
                        </h2>
                        <Badge className="bg-orange-600 text-white border-none font-black px-2 py-0.5 text-[10px]">
                            {filteredItems.length} ITEMS
                        </Badge>
                    </div>

                    <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                        {[...Array(12)].map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Box size={48} className="mb-4 text-slate-400" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 text-center">
                            No products found <br />
                            <span className="text-[9px] font-bold opacity-60 tracking-normal">Try adjusting your filters or search</span>
                        </p>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredItems.map((item) => (
                            <ProductListItem 
                                key={item.id}
                                item={item}
                                formatCurrency={formatCurrency}
                                setBuyItem={setBuyItem}
                                setBuyOpen={setBuyOpen}
                                DEFAULT_IMAGE={DEFAULT_IMAGE}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
                        {filteredItems.map((item) => (
                            <ProductCard 
                                key={item.id}
                                item={item}
                                formatCurrency={formatCurrency}
                                setBuyItem={setBuyItem}
                                setBuyOpen={setBuyOpen}
                                DEFAULT_IMAGE={DEFAULT_IMAGE}
                            />
                        ))}
                    </div>
                )}
            </main>

            <CartDrawer 
                checkoutOpen={checkoutOpen}
                setCheckoutOpen={setCheckoutOpen}
                cartCount={cartCount}
                cart={cart}
                setCart={setCart}
                updateCart={updateCart}
                cartTotal={cartTotal}
                formatCurrency={formatCurrency}
                processing={processing}
                handleCheckout={handleCheckout}
                DEFAULT_IMAGE={DEFAULT_IMAGE}
            />

            <BuyNowDialog 
                buyOpen={buyOpen}
                setBuyOpen={setBuyOpen}
                buyItem={buyItem}
                cart={cart}
                updateCart={updateCart}
                formatCurrency={formatCurrency}
                DEFAULT_IMAGE={DEFAULT_IMAGE}
            />

            <SuccessDialog 
                successInvoice={successInvoice}
                setSuccessInvoice={setSuccessInvoice}
                token={token}
            />

            <CatalogFooter token={token} />
        </div>
    );
}
