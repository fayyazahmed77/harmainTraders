import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    ShoppingBag, 
    Plus, 
    Minus, 
    ChevronLeft, 
    CheckCircle2, 
    Package, 
    Info,
    ArrowRight,
    Loader2,
    X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import axios from "axios";

interface Item {
    id: number;
    title: string;
    short_name: string;
    code: string;
    packing_qty: number;
    price: number;
    company: string;
    stock: number;
}

interface CartItem extends Item {
    qty_carton: number;
    qty_pcs: number;
}

interface GuestCatalogProps {
    account: {
        id: number;
        title: string;
    };
    items: Item[];
    token: string;
}

export default function GuestCatalog({ account, items, token }: GuestCatalogProps) {
    const [search, setSearch] = useState("");
    const [cart, setCart] = useState<Record<number, CartItem>>({});
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
    };

    const filteredItems = useMemo(() => {
        const q = search.toLowerCase();
        return items.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.code.toLowerCase().includes(q) ||
            item.company.toLowerCase().includes(q)
        );
    }, [items, search]);

    const cartTotal = useMemo(() => {
        return Object.values(cart).reduce((total, item) => {
            const packing = item.packing_qty || 1;
            const itemTotal = (item.qty_carton * item.price) + (item.qty_pcs * (item.price / packing));
            return total + itemTotal;
        }, 0);
    }, [cart]);

    const cartCount = Object.keys(cart).length;

    const updateCart = (item: Item, field: 'qty_carton' | 'qty_pcs', val: number) => {
        setCart(prev => {
            const current = prev[item.id] || { ...item, qty_carton: 0, qty_pcs: 0 };
            const next = { ...current, [field]: Math.max(0, val) };
            
            if (next.qty_carton === 0 && next.qty_pcs === 0) {
                const { [item.id]: removed, ...rest } = prev;
                return rest;
            }
            
            return { ...prev, [item.id]: next };
        });
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
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-32">
            <Head title="Product Catalog" />

            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-20">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                    <Link href={`/g/${token}`} className="flex items-center gap-2 text-slate-500 font-bold text-xs uppercase tracking-wider">
                        <ChevronLeft size={16} /> Dashboard
                    </Link>
                    <div className="flex-1 max-w-sm relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Find products..." 
                            className="pl-9 h-9 rounded-full bg-slate-100 dark:bg-zinc-800 border-none text-xs focus-visible:ring-orange-500"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xl font-black">All Items</h2>
                    <SignalBadge text={`${filteredItems.length} Products`} type="blue" />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="p-4 bg-white dark:bg-zinc-900 border-none shadow-md relative overflow-hidden group">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[8px] h-4 font-mono uppercase bg-slate-50 dark:bg-zinc-800 border-none">
                                            {item.code}
                                        </Badge>
                                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter truncate max-w-[120px]">
                                            {item.company}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-sm leading-tight group-hover:text-orange-600 transition-colors uppercase italic">{item.title}</h3>
                                    <div className="flex items-center gap-4 pt-1">
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Rate</p>
                                            <p className="font-black text-lg text-slate-900 dark:text-zinc-100">{formatCurrency(item.price)}</p>
                                        </div>
                                        <div className="h-8 w-[1px] bg-slate-100 dark:bg-zinc-800" />
                                        <div>
                                            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Packing</p>
                                            <p className="font-bold text-xs">{item.packing_qty} Pcs</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 min-w-[120px]">
                                    {/* Carton Qty */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-slate-500 font-bold text-center">Full CTN</span>
                                        <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                                            <button 
                                                onClick={() => updateCart(item, 'qty_carton', (cart[item.id]?.qty_carton || 0) - 1)}
                                                className="p-1 hover:text-orange-500"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <input 
                                                type="number"
                                                value={cart[item.id]?.qty_carton || 0}
                                                onChange={(e) => updateCart(item, 'qty_carton', parseInt(e.target.value) || 0)}
                                                className="w-8 bg-transparent text-center text-xs font-bold border-none focus:ring-0 p-0"
                                            />
                                            <button 
                                                onClick={() => updateCart(item, 'qty_carton', (cart[item.id]?.qty_carton || 0) + 1)}
                                                className="p-1 hover:text-orange-500"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Pcs Qty */}
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] text-slate-500 font-bold text-center">Loose PCS</span>
                                        <div className="flex items-center justify-between bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
                                            <button 
                                                onClick={() => updateCart(item, 'qty_pcs', (cart[item.id]?.qty_pcs || 0) - 1)}
                                                className="p-1 hover:text-orange-500"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <input 
                                                type="number"
                                                value={cart[item.id]?.qty_pcs || 0}
                                                onChange={(e) => updateCart(item, 'qty_pcs', parseInt(e.target.value) || 0)}
                                                className="w-8 bg-transparent text-center text-xs font-bold border-none focus:ring-0 p-0"
                                            />
                                            <button 
                                                onClick={() => updateCart(item, 'qty_pcs', (cart[item.id]?.qty_pcs || 0) + 1)}
                                                className="p-1 hover:text-orange-500"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Cart Sticky Footer */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.div 
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 z-30"
                    >
                        <Card className="max-w-4xl mx-auto p-4 bg-orange-600 dark:bg-orange-600 text-white border-none shadow-2xl rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center relative">
                                    <ShoppingBag size={24} />
                                    <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                                        {cartCount}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Total Amount</p>
                                    <h4 className="text-xl font-black">{formatCurrency(cartTotal)}</h4>
                                </div>
                            </div>
                            <Button 
                                onClick={() => setCheckoutOpen(true)}
                                className="bg-white text-orange-600 hover:bg-slate-50 font-black rounded-xl h-12 px-6 shadow-xl gap-2"
                            >
                                Checkout <ArrowRight size={18} />
                            </Button>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checkout Dialog */}
            <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="max-w-md w-[95%] rounded-2xl p-0 overflow-hidden border-none">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-2xl font-black text-slate-900">Review Order</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 italic">Please review your items before submitting.</DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 pt-4 max-h-[60vh] overflow-y-auto space-y-3">
                        {Object.values(cart).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                                <div>
                                    <h5 className="text-[11px] font-bold truncate max-w-[180px] uppercase italic">{item.title}</h5>
                                    <p className="text-[10px] text-slate-500">
                                        {item.qty_carton} CTN + {item.qty_pcs} PCS
                                    </p>
                                </div>
                                <p className="font-bold text-xs">
                                    {formatCurrency((item.qty_carton * item.price) + (item.qty_pcs * (item.price / (item.packing_qty || 1))))}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 pt-0 space-y-4">
                        <div className="py-4 border-t border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Total Payable</span>
                            <span className="text-2xl font-black text-orange-600">{formatCurrency(cartTotal)}</span>
                        </div>
                        <Button 
                            className="w-full h-14 bg-orange-500 hover:bg-orange-600 font-black text-lg rounded-xl shadow-xl shadow-orange-500/20 gap-3"
                            disabled={processing}
                            onClick={handleCheckout}
                        >
                            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                            {processing ? "Processing..." : "Place My Order"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Dialog */}
            <Dialog open={!!successInvoice} onOpenChange={() => setSuccessInvoice(null)}>
                <DialogContent className="max-w-sm w-[90%] rounded-3xl p-8 text-center border-none flex flex-col items-center">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/30"
                    >
                        <CheckCircle2 size={48} />
                    </motion.div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">Order Placed!</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Your order <span className="font-bold text-slate-900">#{successInvoice}</span> has been received and is pending confirmation.
                    </p>
                    <div className="flex flex-col w-full gap-3">
                        <Link href={`/g/${token}`} className="w-full">
                            <Button className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold h-11">Back to Dashboard</Button>
                        </Link>
                        <Button variant="outline" onClick={() => setSuccessInvoice(null)} className="h-12 rounded-xl border-slate-200 font-bold h-11">Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const SignalBadge = ({ text, type = 'blue' }: { text: string, type?: 'green' | 'red' | 'orange' | 'blue' }) => {
    const colors = {
        green: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        red: "bg-rose-500/10 text-rose-600 border-rose-500/20",
        orange: "bg-orange-500/10 text-orange-600 border-orange-500/20",
        blue: "bg-blue-500/10 text-blue-600 border-blue-500/20"
    };
    return (
        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${colors[type]}`}>
            {text}
        </span>
    );
};
