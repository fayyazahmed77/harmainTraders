import React, { useState, useEffect } from 'react';
import { X, Package, Minus, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cart, Item } from './types';

interface BuyNowDialogProps {
    buyOpen: boolean;
    setBuyOpen: (val: boolean) => void;
    buyItem: Item | null;
    cart: Cart;
    updateCart: (item: Item, field: 'qty_carton' | 'qty_pcs', value: number) => void;
    formatCurrency: (val: number) => string;
    DEFAULT_IMAGE: string;
}

export const BuyNowDialog: React.FC<BuyNowDialogProps> = ({
    buyOpen,
    setBuyOpen,
    buyItem,
    cart,
    updateCart,
    formatCurrency,
    DEFAULT_IMAGE
}) => {
    const [currentImg, setCurrentImg] = useState(0);
    const images = buyItem?.images || [];

    useEffect(() => {
        if (!buyOpen || images.length <= 1) return;
        
        const timer = setInterval(() => {
            setCurrentImg(prev => (prev + 1) % images.length);
        }, 3000);
        
        return () => clearInterval(timer);
    }, [buyOpen, images.length]);

    useEffect(() => {
        if (buyOpen) setCurrentImg(0);
    }, [buyOpen, buyItem?.id]);

    return (
        <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
            <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden">
                {buyItem && (
                    <div className="flex flex-col">
                        <div className="aspect-video relative overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                            {images.length > 0 ? (
                                <div className="w-full h-full relative">
                                    {images.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img}
                                            alt={`${buyItem.title} - ${idx + 1}`}
                                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`}
                                        />
                                    ))}
                                    
                                    {images.length > 1 && (
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                            {images.map((_, idx) => (
                                                <div 
                                                    key={idx}
                                                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentImg ? 'w-4 bg-orange-500' : 'w-1.5 bg-white/50'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <img
                                    src={buyItem.image ? `/images/items/${buyItem.image.split('/').pop()}` : DEFAULT_IMAGE}
                                    alt={buyItem.title}
                                    className="w-full h-full object-cover"
                                />
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent flex flex-col justify-end p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className="bg-orange-500 text-white font-black text-[9px] h-5">{buyItem.code}</Badge>
                                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{buyItem.company}</span>
                                </div>
                                <h3 className="text-xl font-black text-white italic uppercase leading-none">{buyItem.title}</h3>
                            </div>
                            
                            <button
                                onClick={() => setBuyOpen(false)}
                                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/40 transition-all z-20"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 bg-white dark:bg-zinc-900">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Full Carton</span>
                                    <span className="text-xl font-black text-orange-600">{formatCurrency(buyItem.price_carton)}</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Rate per CTN</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Loose Carton</span>
                                    <span className="text-xl font-black text-zinc-700 dark:text-zinc-200">{formatCurrency(buyItem.price_loose_carton)}</span>
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase mt-1">Rate per CTN</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Add to Cart</span>
                                        <span className="text-[9px] font-bold text-orange-500 uppercase italic">Configure your quantity</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-full border border-orange-100 dark:border-orange-500/20">
                                        <Package size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-tighter">{buyItem.packing_qty} Pcs / CTN</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-orange-500/50 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Full Cartons</span>
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Ordering in Bulk</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => updateCart(buyItem, 'qty_carton', (cart[buyItem.id]?.qty_carton || 0) - 1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-orange-500 transition-colors"><Minus size={18} /></button>
                                            <input 
                                                type="number" 
                                                value={cart[buyItem.id]?.qty_carton || 0}
                                                onChange={(e) => updateCart(buyItem, 'qty_carton', parseInt(e.target.value) || 0)}
                                                className="w-16 bg-transparent text-center text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button onClick={() => updateCart(buyItem, 'qty_carton', (cart[buyItem.id]?.qty_carton || 0) + 1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"><Plus size={18} /></button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-orange-500/50 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loose Pieces</span>
                                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">Smaller Quantity</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => updateCart(buyItem, 'qty_pcs', (cart[buyItem.id]?.qty_pcs || 0) - 1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:text-orange-500 transition-colors"><Minus size={18} /></button>
                                            <input 
                                                type="number" 
                                                value={cart[buyItem.id]?.qty_pcs || 0}
                                                onChange={(e) => updateCart(buyItem, 'qty_pcs', parseInt(e.target.value) || 0)}
                                                className="w-16 bg-transparent text-center text-xl font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button onClick={() => updateCart(buyItem, 'qty_pcs', (cart[buyItem.id]?.qty_pcs || 0) + 1)} className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all"><Plus size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setBuyOpen(false)}
                                className="w-full h-14 rounded-2xl bg-zinc-900 dark:bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all"
                            >
                                Done {((cart[buyItem.id]?.qty_carton || 0) > 0 || (cart[buyItem.id]?.qty_pcs || 0) > 0) && (
                                    <span className="ml-2 opacity-80">
                                        ({formatCurrency((cart[buyItem.id]?.qty_carton || 0) * buyItem.price_carton + (cart[buyItem.id]?.qty_pcs || 0) * (buyItem.price_piece || 0))})
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
