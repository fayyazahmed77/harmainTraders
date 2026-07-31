import React, { useState, useEffect } from 'react';
import { X, Package, Minus, Plus, Sparkles } from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const DEFAULT_IMAGE = "https://placehold.co/400x400/f8fafc/cbd5e1?text=No+Image";

interface OfferItemDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    offerItem: any | null;
    cartItem?: any | null;
    onUpdateCart: (offerItem: any, field: 'qty_carton' | 'qty_pcs', value: number) => void;
    formatCurrency: (val: number) => string;
}

export const OfferItemDialog: React.FC<OfferItemDialogProps> = ({
    open,
    onOpenChange,
    offerItem,
    cartItem,
    onUpdateCart,
    formatCurrency,
}) => {
    const item = offerItem?.items;
    const images = item?.images?.map((img: any) => assetUrl(img.image_path)) || [];
    const primaryImg = item?.primary_image_url || DEFAULT_IMAGE;
    
    const [currentImg, setCurrentImg] = useState(0);

    function assetUrl(path: string) {
        if (!path) return DEFAULT_IMAGE;
        if (path.startsWith('http')) return path;
        return `/${path.replace(/^\//, '')}`;
    }

    useEffect(() => {
        if (!open || images.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentImg(prev => (prev + 1) % images.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [open, images.length]);

    useEffect(() => {
        if (open) setCurrentImg(0);
    }, [open, offerItem?.id]);

    if (!offerItem || !item) return null;

    const isGroupOffer = offerItem.offertype === '1';
    const cartonRate = offerItem.pack_ctn || offerItem.price || 0;
    const looseRate = offerItem.loos_ctn || (offerItem.price && item?.packing_qty ? offerItem.price / item.packing_qty : 0);
    const singleRate = offerItem.price || cartonRate;
    const packingQty = item?.packing_qty || 1;

    const qtyCtn = cartItem?.qty_carton || 0;
    const qtyPcs = cartItem?.qty_pcs || 0;

    const subtotal = isGroupOffer 
        ? (qtyCtn * cartonRate) + (qtyPcs * looseRate)
        : (qtyCtn * singleRate) + (qtyPcs * singleRate);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-[95%] rounded-3xl p-0 overflow-hidden border-none shadow-2xl [&>button]:hidden bg-surface-1">
                <div className="flex flex-col">
                    {/* Header Image Area */}
                    <div className="aspect-video relative overflow-hidden bg-surface-2">
                        {images.length > 0 ? (
                            <div className="w-full h-full relative">
                                {images.map((img: string, idx: number) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${item.title} - ${idx + 1}`}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === currentImg ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                ))}
                                {images.length > 1 && (
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                        {images.map((_: any, idx: number) => (
                                            <div 
                                                key={idx}
                                                className={`h-1 rounded-full transition-all duration-300 ${idx === currentImg ? 'w-4 bg-amber' : 'w-1.5 bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <img
                                src={primaryImg} 
                                alt={item.title} 
                                className="w-full h-full object-cover" 
                                onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_IMAGE}
                            />
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent flex flex-col justify-end p-6">
                            <div className="flex items-center gap-2 mb-2">
                                {item.code && (
                                    <Badge className="bg-amber text-surface-0 font-mono-jet font-black text-[9px] h-5 uppercase">
                                        {item.code}
                                    </Badge>
                                )}
                                <span className="text-[10px] text-white/80 font-mono-jet font-bold uppercase tracking-widest truncate">
                                    {item.companyAccount?.title || item.company_account?.title || 'Harmain Direct'}
                                </span>
                            </div>
                            <h3 className="text-xl font-display font-black text-white uppercase leading-none truncate">
                                {item.title}
                            </h3>
                        </div>
                        
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all z-20"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 bg-surface-1">
                        {/* Rate Card */}
                        {isGroupOffer ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-surface-2 border border-border flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-mono-jet font-black uppercase tracking-widest text-text-muted">Carton Rate</span>
                                    <span className="text-2xl font-display font-black text-amber">{formatCurrency(cartonRate)}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface-2 border border-border flex flex-col items-center justify-center text-center">
                                    <span className="text-[9px] font-mono-jet font-black uppercase tracking-widest text-text-muted">Loose Rate</span>
                                    <span className="text-2xl font-display font-black text-text-primary">{formatCurrency(looseRate)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-2xl bg-surface-2 border border-border flex flex-col items-center justify-center gap-1 text-center">
                                <span className="text-[9px] font-mono-jet font-black uppercase tracking-[0.2em] text-text-muted">
                                    Special Rate
                                </span>
                                <span className="text-3xl font-display font-black text-amber">
                                    {formatCurrency(singleRate)}
                                </span>
                                <span className="text-[9px] font-mono-jet font-bold text-text-muted uppercase mt-0.5">
                                    Offer Price per Unit
                                </span>
                            </div>
                        )}

                        {/* Quantity Configuration Header */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono-jet font-black uppercase tracking-widest text-text-muted">
                                        Add to Cart
                                    </span>
                                    <span className="text-[9px] font-mono-jet font-bold text-amber uppercase">
                                        Configure Your Quantity
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {offerItem.mrp > 0 && (
                                        <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-mono-jet font-black uppercase">
                                            Retail: {formatCurrency(offerItem.mrp)}
                                        </Badge>
                                    )}
                                    <Badge className="bg-amber/10 text-amber border border-amber/20 text-[9px] font-mono-jet font-black uppercase flex items-center gap-1">
                                        <Package size={12} />
                                        {packingQty} PCS / CTN
                                    </Badge>
                                </div>
                            </div>

                            {/* Quantity Inputs */}
                            <div className="grid grid-cols-1 gap-3">
                                {/* Main Quantity / Cartons */}
                                <div className="flex items-center justify-between p-4 bg-surface-2/60 rounded-2xl border border-border hover:border-amber/40 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-mono-jet font-black uppercase tracking-widest text-text-muted">
                                            {isGroupOffer ? 'Full Cartons' : 'Quantity / Cartons'}
                                        </span>
                                        <span className="text-xs font-bold text-text-secondary">
                                            Ordering in Bulk
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => onUpdateCart(offerItem, 'qty_carton', Math.max(0, qtyCtn - 1))}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-1 border border-border hover:text-amber transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <input 
                                            type="number" 
                                            value={qtyCtn}
                                            onChange={(e) => onUpdateCart(offerItem, 'qty_carton', Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-14 bg-transparent text-center text-xl font-mono-jet font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <button 
                                            onClick={() => onUpdateCart(offerItem, 'qty_carton', qtyCtn + 1)}
                                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber text-surface-0 shadow-lg shadow-amber/20 hover:bg-amber-bright transition-all"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Loose Pieces (Only for Group Offer) */}
                                {isGroupOffer && (
                                    <div className="flex items-center justify-between p-4 bg-surface-2/60 rounded-2xl border border-border hover:border-amber/40 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-mono-jet font-black uppercase tracking-widest text-text-muted">
                                                Loose Pieces
                                            </span>
                                            <span className="text-xs font-bold text-text-secondary">
                                                Smaller Quantity
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => onUpdateCart(offerItem, 'qty_pcs', Math.max(0, qtyPcs - 1))}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-1 border border-border hover:text-amber transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <input 
                                                type="number" 
                                                value={qtyPcs}
                                                onChange={(e) => onUpdateCart(offerItem, 'qty_pcs', Math.max(0, parseInt(e.target.value) || 0))}
                                                className="w-14 bg-transparent text-center text-xl font-mono-jet font-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <button 
                                                onClick={() => onUpdateCart(offerItem, 'qty_pcs', qtyPcs + 1)}
                                                className="h-10 w-10 flex items-center justify-center rounded-xl bg-amber text-surface-0 shadow-lg shadow-amber/20 hover:bg-amber-bright transition-all"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Done Button */}
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="w-full h-14 rounded-2xl bg-amber hover:bg-amber-bright text-surface-0 font-display font-black uppercase tracking-[0.15em] text-xs shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            DONE {subtotal > 0 && `(${formatCurrency(subtotal)})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
