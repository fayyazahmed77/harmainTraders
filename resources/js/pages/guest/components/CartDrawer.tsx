import React from 'react';
import { ShoppingBag, Trash2, Plus, Minus, PackageOpen, Loader2 } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cart, Item } from './types';

interface CartDrawerProps {
    checkoutOpen: boolean;
    setCheckoutOpen: (val: boolean) => void;
    cartCount: number;
    cart: Cart;
    setCart: (cart: Cart) => void;
    updateCart: (item: Item, field: 'qty_carton' | 'qty_pcs', value: number) => void;
    cartTotal: number;
    formatCurrency: (val: number) => string;
    processing: boolean;
    handleCheckout: (email?: string) => void;
    DEFAULT_IMAGE: string;
    customerCategory?: string | number;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    checkoutOpen,
    setCheckoutOpen,
    cartCount,
    cart,
    setCart,
    updateCart,
    cartTotal,
    formatCurrency,
    processing,
    handleCheckout,
    DEFAULT_IMAGE,
    customerCategory
}) => {
    const [email, setEmail] = React.useState('');
    return (
        <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none shadow-2xl bg-white dark:bg-zinc-900">
                <SheetHeader className="p-6 bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-2xl font-black italic uppercase text-slate-900 dark:text-zinc-100">Review Order</SheetTitle>
                            <SheetDescription className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none">
                                {cartCount} Items in your cart
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Cart Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cartCount === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400">
                            <ShoppingBag size={64} className="mb-4" />
                            <p className="font-black uppercase tracking-widest">Cart is empty</p>
                        </div>
                    ) : (
                        Object.values(cart).map(item => (
                            <div key={item.id} className="relative bg-white dark:bg-zinc-900 rounded-[2rem] p-5 border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden group">
                                {/* Subtle Background Glow */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-orange-500/10 transition-colors" />

                                <div className="flex gap-5">
                                    {/* Image Section */}
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-800 shrink-0 shadow-inner">
                                        <img
                                            src={item.image || DEFAULT_IMAGE}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                                            }}
                                        />
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <Badge variant="outline" className="text-[8px] font-black uppercase border-orange-200 dark:border-orange-500/20 text-orange-600 bg-orange-50 dark:bg-orange-500/5 px-2 h-5">
                                                {item.code}
                                            </Badge>
                                            <button 
                                                onClick={() => {
                                                    const newCart = { ...cart };
                                                    delete newCart[item.id];
                                                    setCart(newCart);
                                                }}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <h5 className="text-sm font-black italic uppercase leading-none mb-1 truncate text-slate-900 dark:text-zinc-100">
                                            {item.title}
                                        </h5>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            {item.company}
                                        </p>

                                        {/* Quantitative Section */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {/* Full CTN */}
                                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                                                    {(customerCategory === 1 || customerCategory === '1') ? 'Pack CTN' : 'Full CTN'}
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-900 dark:text-zinc-100">{item.qty_carton}</span>
                                                    <div className="flex gap-1.5">
                                                        <button 
                                                            onClick={() => updateCart(item, 'qty_carton', Math.max(0, item.qty_carton - 1))} 
                                                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => updateCart(item, 'qty_carton', item.qty_carton + 1)} 
                                                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Loose PCS */}
                                            <div className="bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/50">
                                                <span className="text-[9px] font-black uppercase text-slate-400 block mb-2 tracking-widest">
                                                    {(customerCategory === 1 || customerCategory === '1') ? 'Loose Packs' : 'Loose PCS'}
                                                </span>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-black text-slate-900 dark:text-zinc-100">{item.qty_pcs}</span>
                                                    <div className="flex gap-1.5">
                                                        <button 
                                                            onClick={() => updateCart(item, 'qty_pcs', Math.max(0, item.qty_pcs - 1))} 
                                                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={() => updateCart(item, 'qty_pcs', item.qty_pcs + 1)} 
                                                            className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-700 shadow-sm border border-slate-200 dark:border-zinc-600 flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subtotal per item */}
                                        <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Subtotal</span>
                                            <span className="text-sm font-black text-slate-900 dark:text-zinc-100">
                                                {formatCurrency(
                                                    (customerCategory === 1 || customerCategory === '1')
                                                        ? (item.qty_carton * item.price_carton) + Math.floor(item.qty_pcs / Math.max(1, item.packing_size || 1)) * item.price_carton + ((item.qty_pcs % Math.max(1, item.packing_size || 1)) * (item.price_piece || 0))
                                                        : Math.round((item.qty_carton * item.price_carton) + (item.qty_pcs * (item.price_carton / Math.max(1, item.packing_qty || 1))))
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary Footer */}
                <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grand Total</span>
                            <p className="text-3xl font-black text-orange-600 leading-none">{formatCurrency(cartTotal)}</p>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Email Address (to receive confirmation)</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="guest@example.com"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <Button
                        className="w-full h-14 bg-orange-600 hover:bg-orange-700 font-black text-lg rounded-2xl shadow-xl shadow-orange-600/20 gap-3 group transition-all"
                        disabled={processing || cartCount === 0}
                        onClick={() => handleCheckout(email)}
                    >
                        {processing ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <PackageOpen className="group-hover:translate-y-[-2px] transition-transform" />
                        )}
                        {processing ? "Processing..." : "Place My Order"}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
