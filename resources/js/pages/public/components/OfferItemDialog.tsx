import React, { useState, useEffect } from 'react';
import { X, Package, Minus, Plus, Sparkles, Layers } from 'lucide-react';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOfferItemRates, toNum } from '../LiveOffers';

const DEFAULT_IMAGE = "https://placehold.co/400x400/f8fafc/cbd5e1?text=No+Image";

interface OfferItemDialogProps {
    open: boolean;
    onOpenChange: (val: boolean) => void;
    offerItem: any | null;
    cartItem?: any | null;
    onUpdateCart: (offerItem: any, field: 'qty_carton' | 'qty_pcs' | 'total_pcs', value: number) => void;
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
    const [unitMode, setUnitMode] = useState<'pcs' | 'ctn'>('pcs');

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

    const isGroupOffer = String(offerItem.offertype) === '1';
    const { cartonRate, looseRate, singleRate } = getOfferItemRates(offerItem);
    const packingQty = toNum(item?.packing_qty || 1);

    const qtyCtn = toNum(cartItem?.qty_carton);
    const qtyPcs = toNum(cartItem?.qty_pcs);
    const totalPcs = (qtyCtn * packingQty) + qtyPcs;

    const subtotal = cartItem?.subtotal || (
        isGroupOffer && packingQty > 1
            ? (qtyCtn * cartonRate * packingQty) + (qtyPcs * looseRate)
            : (qtyCtn * singleRate) + (qtyPcs * (singleRate / (packingQty || 1)))
    );

    const handleQuantityChange = (val: number) => {
        const newVal = Math.max(0, val);
        if (unitMode === 'ctn') {
            onUpdateCart(offerItem, 'qty_carton', newVal);
        } else {
            onUpdateCart(offerItem, 'total_pcs', newVal);
        }
    };

    const displayQty = unitMode === 'ctn' ? qtyCtn : totalPcs;

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
                            />
                        )}

                        <button 
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-surface-0/80 backdrop-blur-md border border-white/10 text-text-primary flex items-center justify-center hover:bg-surface-0 transition-colors z-20"
                        >
                            <X size={18} />
                        </button>

                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-surface-1 via-surface-1/80 to-transparent p-4 pt-10">
                            <span className="text-[10px] font-mono-jet font-black tracking-widest text-amber uppercase bg-amber/10 px-2 py-0.5 rounded border border-amber/20">
                                {item.companyAccount?.title || 'Harmain Direct'}
                            </span>
                            <h3 className="font-display font-black text-xl text-text-primary uppercase tracking-tight mt-1 line-clamp-1">
                                {item.title}
                            </h3>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 space-y-6">
                        {/* Price Cards */}
                        {isGroupOffer ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3.5 rounded-2xl border transition-all ${totalPcs >= packingQty ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-surface-2/60 border-border'}`}>
                                    <span className="text-[9px] font-mono-jet font-bold text-text-muted uppercase">
                                        Carton Rate (Full Ctn)
                                    </span>
                                    <div className="text-xl font-display font-black text-amber mt-0.5">
                                        {formatCurrency(cartonRate)} <span className="text-xs font-normal text-text-muted">/ pc</span>
                                    </div>
                                    <span className="text-[9px] font-mono-jet font-bold text-emerald-400 uppercase block mt-0.5">
                                        {formatCurrency(cartonRate * packingQty)} / CTN
                                    </span>
                                </div>

                                <div className={`p-3.5 rounded-2xl border transition-all ${totalPcs > 0 && totalPcs < packingQty ? 'bg-amber/10 border-amber/30' : 'bg-surface-2/60 border-border'}`}>
                                    <span className="text-[9px] font-mono-jet font-bold text-text-muted uppercase">
                                        Loose Rate (&lt; 1 Ctn)
                                    </span>
                                    <div className="text-xl font-display font-black text-text-primary mt-0.5">
                                        {formatCurrency(looseRate)} <span className="text-xs font-normal text-text-muted">/ pc</span>
                                    </div>
                                    <span className="text-[9px] font-mono-jet font-bold text-text-muted uppercase block mt-0.5">
                                        Single Piece Rate
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-surface-2/60 rounded-2xl border border-border text-center">
                                <span className="text-[10px] font-mono-jet font-bold text-amber uppercase">
                                    Special Offer Rate
                                </span>
                                <div className="text-2xl font-display font-black text-text-primary mt-1">
                                    {formatCurrency(singleRate)}
                                </div>
                                <span className="text-[9px] font-mono-jet font-bold text-text-muted uppercase mt-0.5">
                                    Offer Price per Unit
                                </span>
                            </div>
                        )}

                        {/* Quantity Configuration */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono-jet font-black uppercase tracking-widest text-text-muted">
                                        Add to Cart
                                    </span>
                                    <span className="text-[9px] font-mono-jet font-bold text-amber uppercase">
                                        Configure Quantity
                                    </span>
                                </div>

                                {/* Unit Switcher */}
                                {packingQty > 1 && (
                                    <div className="flex items-center p-1 bg-surface-2 rounded-xl border border-border">
                                        <button
                                            onClick={() => setUnitMode('pcs')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-mono-jet font-bold uppercase transition-all ${unitMode === 'pcs' ? 'bg-amber text-surface-0 shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            Pieces (PCS)
                                        </button>
                                        <button
                                            onClick={() => setUnitMode('ctn')}
                                            className={`px-3 py-1 rounded-lg text-[10px] font-mono-jet font-bold uppercase transition-all ${unitMode === 'ctn' ? 'bg-amber text-surface-0 shadow-md' : 'text-text-muted hover:text-text-primary'}`}
                                        >
                                            Cartons (CTN)
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Single Wide Quantity Input Box */}
                            <div className="flex items-center justify-between p-4 bg-surface-2/60 rounded-2xl border border-border hover:border-amber/40 transition-all">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono-jet font-black uppercase tracking-widest text-text-muted">
                                        Order Quantity
                                    </span>
                                    <span className="text-xs font-bold text-text-secondary">
                                        {unitMode === 'ctn' ? `Full Cartons (${packingQty} pcs/ctn)` : `Total Pieces (${packingQty} pcs/ctn)`}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => handleQuantityChange(displayQty - 1)}
                                        className="h-11 w-11 flex items-center justify-center rounded-xl bg-surface-1 border border-border hover:text-amber active:scale-95 transition-all"
                                    >
                                        <Minus size={18} />
                                    </button>
                                    <input 
                                        type="number" 
                                        value={displayQty}
                                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                                        className="w-28 h-11 bg-surface-1 border border-border rounded-xl text-center text-xl font-mono-jet font-black text-amber focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all"
                                    />
                                    <button 
                                        onClick={() => handleQuantityChange(displayQty + 1)}
                                        className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber text-surface-0 shadow-lg shadow-amber/20 hover:bg-amber-bright active:scale-95 transition-all"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Live Pricing Breakdown Card */}
                            {isGroupOffer && totalPcs > 0 && (
                                <div className="p-3.5 bg-surface-2/80 rounded-2xl border border-border text-xs space-y-2 font-mono-jet shadow-inner">
                                    <div className="flex justify-between items-center text-text-muted font-bold text-[10px] uppercase">
                                        <span className="flex items-center gap-1">
                                            <Layers size={12} className="text-amber" /> Applied Pricing Tier:
                                        </span>
                                        <span className="text-amber font-black">
                                            {qtyCtn > 0 && qtyPcs === 0 ? 'Full Carton Rate' : qtyCtn === 0 && qtyPcs > 0 ? 'Loose Piece Rate' : 'Mixed Tier Rate'}
                                        </span>
                                    </div>
                                    {qtyCtn > 0 && (
                                        <div className="flex justify-between items-center text-text-primary text-[11px]">
                                            <span>📦 {qtyCtn} Full Ctn ({qtyCtn * packingQty} Pcs @ {formatCurrency(cartonRate)}/pc):</span>
                                            <span className="font-bold text-emerald-400">{formatCurrency(qtyCtn * cartonRate * packingQty)}</span>
                                        </div>
                                    )}
                                    {qtyPcs > 0 && (
                                        <div className="flex justify-between items-center text-text-primary text-[11px]">
                                            <span>🛍️ {qtyPcs} Loose Pcs (@ {formatCurrency(looseRate)}/pc):</span>
                                            <span className="font-bold text-amber">{formatCurrency(qtyPcs * looseRate)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
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
