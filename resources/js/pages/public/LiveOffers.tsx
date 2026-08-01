import React, { useState, useMemo, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Search, 
    ArrowRight, 
    ShieldCheck, 
    Tag, 
    Mail,
    Phone,
    MapPin,
    Heart,
    Facebook,
    Instagram,
    Twitter,
    Linkedin,
    Trash2,
    CheckCircle2,
    XCircle,
    Copy,
    Share2,
    Building2, 
    LayoutList,
    ArrowDownAZ,
    Sparkles,
    Loader2,
    Zap,
    LayoutGrid,
    Sun,
    Moon,
    ShoppingBag,
    ShoppingCart,
    Plus,
    Minus,
    Box,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryCarousel, Category } from './components/CategoryCarousel';
import { OfferCheckoutDialog } from './components/OfferCheckoutDialog';
import { OfferSuccessDialog } from './components/OfferSuccessDialog';
import { OfferItemDialog } from './components/OfferItemDialog';

const DEFAULT_IMAGE = "https://placehold.co/400x400/f8fafc/cbd5e1?text=No+Image";

// Helper functions to extract brand name and image
export const getItemBrandName = (item: any) => {
    if (!item) return null;
    return item.companyAccount?.title || item.company_account?.title || (typeof item.company === 'string' && item.company ? item.company : null);
};

export const getItemBrandImage = (item: any) => {
    if (!item) return null;
    return item.companyAccount?.image_url || item.company_account?.image_url || (item.company_account?.image ? `/storage/${item.company_account.image}` : null);
};

// --- Interfaces ---

interface ItemImage {
    id: number;
    image_path: string;
    is_primary: boolean;
}

interface Item {
    id: number;
    title: string;
    code?: string;
    packing_qty?: number;
    packing_size?: number;
    primary_image_url?: string;
    images?: ItemImage[];
    companyAccount?: { title: string; image_url?: string };
    category?: { id: number; name: string };
}

interface OfferItem {
    id: number;
    item_id: number;
    pack_ctn: number;
    loos_ctn: number;
    mrp: number;
    price: number;
    scheme: string;
    items: Item;
}

interface Offer {
    id: number;
    date: string;
    offertype: string;
    items: OfferItem[];
    firm?: { name: string; business: string };
}

interface Props {
    customerOffer: Offer | null;
    marketOffer: Offer | null;
    sharedOfferId?: string | number | null;
    categories?: Category[];
}

export default function LiveOffers({ customerOffer, marketOffer, sharedOfferId, categories = [] }: Props) {
    const { appearance, updateAppearance } = useAppearance();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | number>('all');
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    
    // Header customer login state
    const [customerId, setCustomerId] = useState('');
    const [accessLoading, setAccessLoading] = useState(false);
    const [accessError, setAccessError] = useState<string | null>(null);

    // Cart state
    const [cart, setCart] = useState<Record<number, any>>(() => {
        try {
            const saved = localStorage.getItem('offer_cart');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [successData, setSuccessData] = useState<{ invoice: string; customerCode: string; guestToken: string } | null>(null);

    // Item Quantity Modal state
    const [selectedOfferItem, setSelectedOfferItem] = useState<OfferItem | null>(null);
    const [itemDialogOpen, setItemDialogOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('offer_cart', JSON.stringify(cart));
    }, [cart]);

    // Consolidate Active Offer Items
    const activeOffer = useMemo(() => {
        return customerOffer || marketOffer || null;
    }, [customerOffer, marketOffer]);

    const allOfferItems = useMemo(() => {
        let items: OfferItem[] = [];
        if (customerOffer) {
            items = items.concat(customerOffer.items.map(it => ({ ...it, offertype: customerOffer.offertype || '1' })));
        }
        if (marketOffer) {
            items = items.concat(marketOffer.items.map(it => ({ ...it, offertype: marketOffer.offertype || '2' })));
        }
        return items;
    }, [customerOffer, marketOffer]);

    // Brands / Companies list
    const companies = useMemo(() => {
        const counts: Record<string, { count: number; image: string | null }> = {};
        allOfferItems.forEach(it => {
            const name = getItemBrandName(it.items);
            if (!name) return;
            if (!counts[name]) {
                counts[name] = { count: 0, image: getItemBrandImage(it.items) };
            }
            counts[name].count++;
        });

        return Object.entries(counts).map(([name, data]) => ({
            name,
            count: data.count,
            image: data.image
        })).sort((a, b) => b.count - a.count);
    }, [allOfferItems]);

    // Filtered Items
    const filteredOfferItems = useMemo(() => {
        const q = searchQuery.toLowerCase();
        return allOfferItems.filter(it => {
            const item = it.items;
            const title = item?.title?.toLowerCase() ?? '';
            const code = item?.code?.toLowerCase() ?? '';
            const brand = (getItemBrandName(item) ?? '').toLowerCase();
            const matchesSearch = title.includes(q) || code.includes(q) || brand.includes(q);

            const catId = item?.category?.id || item?.category;
            const matchesCategory = selectedCategory === 'all' || String(catId) === String(selectedCategory);

            const matchesCompany = selectedCompany === 'all' || getItemBrandName(item) === selectedCompany;

            return matchesSearch && matchesCategory && matchesCompany;
        });
    }, [allOfferItems, searchQuery, selectedCategory, selectedCompany]);

    // Cart Helper Actions
    const updateCartQty = (offerItem: OfferItem, field: 'qty_carton' | 'qty_pcs', value: number) => {
        setCart(prev => {
            const existing = prev[offerItem.id] || {
                item_id: offerItem.item_id,
                title: offerItem.items?.title,
                code: offerItem.items?.code,
                company: offerItem.items?.companyAccount?.title,
                qty_carton: 0,
                qty_pcs: 0,
                price_carton: offerItem.pack_ctn || offerItem.price || 0,
                price_piece: offerItem.loos_ctn || (offerItem.price && offerItem.items?.packing_qty ? offerItem.price / offerItem.items.packing_qty : 0),
                scheme: offerItem.scheme,
                image: offerItem.items?.primary_image_url || DEFAULT_IMAGE,
            };

            const updated = { ...existing, [field]: Math.max(0, value) };

            // Packing normalization for loose items
            const packing = offerItem.items?.packing_qty || 1;
            if (packing > 1 && updated.qty_pcs >= packing) {
                const extraCartons = Math.floor(updated.qty_pcs / packing);
                updated.qty_carton = (updated.qty_carton || 0) + extraCartons;
                updated.qty_pcs = updated.qty_pcs % packing;
            }

            const priceCarton = updated.price_carton || 0;
            const pricePiece = updated.price_piece || 0;
            updated.subtotal = (updated.qty_carton * priceCarton) + (updated.qty_pcs * pricePiece);

            const newCart = { ...prev };
            if (updated.qty_carton === 0 && updated.qty_pcs === 0) {
                delete newCart[offerItem.id];
            } else {
                newCart[offerItem.id] = updated;
            }

            return newCart;
        });
    };

    const cartList = Object.values(cart);
    const cartCount = cartList.length;
    const cartTotal = cartList.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(value).replace('PKR', 'Rs');
    };

    const handleSuccess = (invoice: string, customerCode: string, token: string) => {
        setCart({});
        setCheckoutOpen(false);
        setCartDrawerOpen(false);
        setSuccessData({ invoice, customerCode, guestToken: token });
    };

    const handleOpenItemModal = (offerItem: OfferItem) => {
        setSelectedOfferItem(offerItem);
        setItemDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-surface-0 text-text-primary selection:bg-amber/30 selection:text-amber-bright flex flex-col pb-24">
            <Head title="Live Offers & Rates Catalog | Harmain Traders" />

            {/* Site Header */}
            <SiteHeader 
                customerId={customerId} 
                setCustomerId={setCustomerId} 
                loading={accessLoading} 
                setLoading={setAccessLoading}
                error={accessError} 
                setError={setAccessError}
                appearance={appearance}
                updateAppearance={updateAppearance}
                cartCount={cartCount}
                onOpenCart={() => setCartDrawerOpen(true)}
            />

            <main className="flex-1">
                {/* Hero Search Section */}
                <HeroSection 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    sharedOfferId={sharedOfferId}
                />

                {/* Category Carousel Bar */}
                {categories && categories.length > 0 && (
                    <CategoryCarousel 
                        categories={categories}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        DEFAULT_IMAGE={DEFAULT_IMAGE}
                    />
                )}

                {/* Main Content Layout (Sidebar + Product Grid) */}
                <div className="max-w-[1800px] mx-auto px-4 py-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar: Shop By Brand */}
                        <aside className="w-full lg:w-72 shrink-0">
                            <div className="bg-surface-1 rounded-2xl border border-border shadow-sm overflow-hidden sticky top-[190px]">
                                <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/50">
                                    <h3 className="text-[11px] font-mono-jet font-black uppercase tracking-wider text-text-muted">Shop by Brand</h3>
                                    <Badge className="bg-amber/15 text-amber border-none text-[9px] font-black">{companies.length}</Badge>
                                </div>
                                
                                <div className="p-2 max-h-[550px] overflow-y-auto custom-scrollbar space-y-1">
                                    <button
                                        onClick={() => setSelectedCompany('all')}
                                        className={cn(
                                            "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                            selectedCompany === 'all' 
                                                ? "bg-amber text-surface-0 shadow-lg shadow-amber/20 font-bold" 
                                                : "hover:bg-surface-2 text-text-secondary"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                selectedCompany === 'all' ? "bg-surface-0/20" : "bg-surface-2"
                                            )}>
                                                <Box size={14} />
                                            </div>
                                            <span className="text-xs font-bold">All Brands</span>
                                        </div>
                                        <span className={cn("text-[10px] font-black", selectedCompany === 'all' ? "text-surface-0/80" : "text-text-muted")}>
                                            {allOfferItems.length}
                                        </span>
                                    </button>

                                    {companies.map((company) => (
                                        <button
                                            key={company.name}
                                            onClick={() => setSelectedCompany(company.name)}
                                            className={cn(
                                                "w-full flex items-center justify-between p-3 rounded-xl transition-all",
                                                selectedCompany === company.name 
                                                    ? "bg-amber text-surface-0 shadow-lg shadow-amber/20 font-bold" 
                                                    : "hover:bg-surface-2 text-text-secondary"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 text-left min-w-0">
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                                    {company.image ? (
                                                        <img src={company.image} alt={company.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-[10px] font-black text-text-muted">{company.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <span className="text-xs font-bold truncate">{company.name}</span>
                                            </div>
                                            <span className={cn("text-[10px] font-black shrink-0 ml-2", selectedCompany === company.name ? "text-surface-0/80" : "text-text-muted")}>
                                                {company.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        {/* Main Product Grid */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-text-primary tracking-tight">
                                        {selectedCompany !== 'all' ? selectedCompany : (selectedCategory === 'all' ? 'All Live Offers' : categories.find(c => c.id === selectedCategory)?.name)}
                                    </h2>
                                    <Badge className="bg-amber/15 text-amber border-amber/30 font-black px-2.5 py-0.5 text-[10px]">
                                        {filteredOfferItems.length} ITEMS
                                    </Badge>
                                </div>

                                <div className="flex bg-surface-2 p-1 rounded-xl border border-border w-fit">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'grid' ? "bg-amber text-surface-0 shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            viewMode === 'list' ? "bg-amber text-surface-0 shadow-sm" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <LayoutList size={18} />
                                    </button>
                                </div>
                            </div>

                            {filteredOfferItems.length === 0 ? (
                                <EmptyState />
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredOfferItems.map(it => (
                                        <OfferProductCard 
                                            key={it.id} 
                                            offerItem={it}
                                            cartItem={cart[it.id]}
                                            onOpenModal={handleOpenItemModal}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {filteredOfferItems.map(it => (
                                        <OfferProductRow 
                                            key={it.id} 
                                            offerItem={it}
                                            cartItem={cart[it.id]}
                                            onOpenModal={handleOpenItemModal}
                                            formatCurrency={formatCurrency}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Sticky Bottom Bar when items are selected */}
            <AnimatePresence>
                {cartCount > 0 && (
                    <motion.div 
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-surface-1/95 backdrop-blur-xl border border-amber/40 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber text-surface-0 flex items-center justify-center font-bold shadow-lg shadow-amber/20">
                                <ShoppingCart className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="font-mono-jet font-bold text-xs text-text-primary block">
                                    {cartCount} {cartCount === 1 ? 'Item' : 'Items'} Selected
                                </span>
                                <span className="font-display font-black text-xl text-amber leading-none block">
                                    {formatCurrency(cartTotal)}
                                </span>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setCartDrawerOpen(true)}
                            className="bg-amber hover:bg-amber-bright text-surface-0 font-display font-black text-xs uppercase h-11 px-5 rounded-xl shadow-lg flex items-center gap-2"
                        >
                            View Cart & Checkout
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart Drawer */}
            <AnimatePresence>
                {cartDrawerOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
                    >
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="w-full max-w-md bg-surface-1 h-full shadow-2xl flex flex-col border-l border-border"
                        >
                            {/* Drawer Header */}
                            <div className="p-5 border-b border-border bg-surface-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-amber" />
                                    <h3 className="font-display font-black text-lg uppercase tracking-tight text-text-primary">
                                        Your Offer Order ({cartCount})
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setCartDrawerOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Cart List */}
                            <div className="flex-1 p-5 overflow-y-auto space-y-4">
                                {cartList.length === 0 ? (
                                    <div className="py-20 text-center text-text-muted space-y-3">
                                        <ShoppingCart className="w-12 h-12 mx-auto opacity-30" />
                                        <p className="font-mono-jet text-xs uppercase font-bold">Your cart is empty</p>
                                    </div>
                                ) : (
                                    cartList.map(item => (
                                        <div key={item.item_id} className="bg-surface-2 border border-border p-4 rounded-xl flex items-center gap-4">
                                            <img src={item.image || DEFAULT_IMAGE} alt={item.title} className="w-14 h-14 object-cover rounded-lg bg-surface-1 border" />
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-sm text-text-primary truncate">{item.title}</h5>
                                                <p className="text-[10px] font-mono-jet text-text-muted uppercase">{item.company}</p>
                                                <div className="text-xs font-bold text-amber mt-1">
                                                    {formatCurrency(item.subtotal)}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs font-mono-jet space-y-1">
                                                {item.qty_carton > 0 && <span className="block font-bold">{item.qty_carton} Ctn</span>}
                                                {item.qty_pcs > 0 && <span className="block text-text-muted">{item.qty_pcs} Loose</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {cartList.length > 0 && (
                                <div className="p-5 border-t border-border bg-surface-2 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono-jet text-xs font-black uppercase text-text-muted">Total Net Amount:</span>
                                        <span className="font-display font-black text-2xl text-amber">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setCartDrawerOpen(false);
                                            setCheckoutOpen(true);
                                        }}
                                        className="w-full bg-amber hover:bg-amber-bright text-surface-0 font-display font-black text-sm uppercase h-12 rounded-xl shadow-lg shadow-amber/20 flex items-center justify-center gap-2"
                                    >
                                        Proceed Order & Checkout
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offer Item Quantity Modal */}
            <OfferItemDialog 
                open={itemDialogOpen}
                onOpenChange={setItemDialogOpen}
                offerItem={selectedOfferItem}
                cartItem={selectedOfferItem ? cart[selectedOfferItem.id] : null}
                onUpdateCart={updateCartQty}
                formatCurrency={formatCurrency}
            />

            {/* Offer Checkout Dialog */}
            <OfferCheckoutDialog 
                open={checkoutOpen}
                onOpenChange={setCheckoutOpen}
                cart={cart}
                cartTotal={cartTotal}
                offerId={activeOffer?.id}
                formatCurrency={formatCurrency}
                onSuccess={handleSuccess}
            />

            {/* Offer Success Dialog */}
            <OfferSuccessDialog 
                open={!!successData}
                onOpenChange={(open) => !open && setSuccessData(null)}
                invoice={successData?.invoice || null}
                customerCode={successData?.customerCode || null}
                guestToken={successData?.guestToken || null}
            />

            {/* Site Footer */}
            <SiteFooter />
        </div>
    );
}

// --- Product Cards & Rows ---

function OfferProductCard({ offerItem, cartItem, onOpenModal, formatCurrency }: {
    offerItem: OfferItem;
    cartItem?: any;
    onOpenModal: (it: OfferItem) => void;
    formatCurrency: (val: number) => string;
}) {
    const item = offerItem.items;
    const primaryImg = item?.primary_image_url || DEFAULT_IMAGE;

    const cartonRate = offerItem.pack_ctn || offerItem.price || 0;
    const looseRate = offerItem.loos_ctn || (offerItem.price && item?.packing_qty ? offerItem.price / item.packing_qty : 0);

    const qtyCtn = cartItem?.qty_carton || 0;
    const qtyPcs = cartItem?.qty_pcs || 0;

    const isGroupOffer = (offerItem as any).offertype === '1';

    return (
        <div 
            onClick={() => onOpenModal(offerItem)}
            className="bg-surface-1 border border-border rounded-2xl overflow-hidden hover:border-amber/40 hover:shadow-xl transition-all flex flex-col group cursor-pointer"
        >
            {/* Image Container */}
            <div className="relative aspect-square bg-surface-2 overflow-hidden">
                <img 
                    src={primaryImg} 
                    alt={item?.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_IMAGE}
                />
                {offerItem.scheme && (
                    <Badge className="absolute top-3 left-3 bg-amber text-surface-0 font-display font-black text-[10px] uppercase shadow-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {offerItem.scheme}
                    </Badge>
                )}

                {/* Floating Add to Cart Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal(offerItem);
                    }}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-surface-1/90 backdrop-blur-md shadow-lg flex items-center justify-center text-text-primary hover:bg-amber hover:text-surface-0 transition-all transform hover:scale-110 border border-border"
                >
                    <Plus size={18} strokeWidth={3} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <span className="text-[10px] font-mono-jet uppercase text-text-muted font-bold truncate">
                    {getItemBrandName(item) || 'Harmain Direct'}
                </span>
                <h6 className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-amber transition-colors line-clamp-2 mt-0.5">
                    {item?.title}
                </h6>

                {/* Rates Grid */}
                {isGroupOffer ? (
                    <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-2 text-center">
                        <div className="bg-surface-2 p-2 rounded-xl border border-border">
                            <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">Carton Rate</span>
                            <span className="font-mono-jet font-bold text-sm text-text-primary">{formatCurrency(cartonRate)}</span>
                        </div>
                        <div className="bg-surface-2 p-2 rounded-xl border border-border">
                            <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">Loose Rate</span>
                            <span className="font-mono-jet font-bold text-sm text-text-primary">{formatCurrency(looseRate)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 pt-3 border-t border-border grid grid-cols-1 text-center">
                        <div className="bg-surface-2 p-2.5 rounded-xl border border-border flex justify-between items-center px-4">
                            <span className="text-[10px] font-mono-jet uppercase text-text-muted font-bold block">Rate</span>
                            <span className="font-mono-jet font-black text-base text-amber">{formatCurrency(offerItem.price || cartonRate)}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mt-3 text-xs font-mono-jet">
                    <span className="text-text-muted">M.R.P:</span>
                    <span className="font-bold text-text-primary">{formatCurrency(offerItem.mrp)}</span>
                </div>
            </div>
        </div>
    );
}

function OfferProductRow({ offerItem, cartItem, onOpenModal, formatCurrency }: {
    offerItem: OfferItem;
    cartItem?: any;
    onOpenModal: (it: OfferItem) => void;
    formatCurrency: (val: number) => string;
}) {
    const item = offerItem.items;
    const primaryImg = item?.primary_image_url || DEFAULT_IMAGE;
    const cartonRate = offerItem.pack_ctn || offerItem.price || 0;
    const looseRate = offerItem.loos_ctn || (offerItem.price && item?.packing_qty ? offerItem.price / item.packing_qty : 0);
    const isGroupOffer = (offerItem as any).offertype === '1';

    return (
        <div 
            onClick={() => onOpenModal(offerItem)}
            className="bg-surface-1 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-amber/30 transition-all cursor-pointer"
        >
            <img src={primaryImg} alt={item?.title} className="w-16 h-16 object-contain rounded-lg bg-surface-2 p-1 border shrink-0" />

            <div className="flex-1 min-w-0 text-center sm:text-left">
                <span className="text-[10px] font-mono-jet uppercase text-text-muted font-bold truncate block">
                    {getItemBrandName(item) || 'Harmain Direct'}
                </span>
                <h6 className="font-display font-black text-base uppercase text-text-primary truncate">
                    {item?.title}
                </h6>
                {offerItem.scheme && (
                    <Badge className="bg-amber/15 text-amber border-none text-[9px] font-bold mt-1">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {offerItem.scheme}
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-6 text-center shrink-0">
                {isGroupOffer ? (
                    <>
                        <div>
                            <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">Carton Rate</span>
                            <span className="font-mono-jet font-bold text-sm text-text-primary">{formatCurrency(cartonRate)}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">Loose Rate</span>
                            <span className="font-mono-jet font-bold text-sm text-text-primary">{formatCurrency(looseRate)}</span>
                        </div>
                    </>
                ) : (
                    <div>
                        <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">Rate</span>
                        <span className="font-mono-jet font-black text-base text-amber">{formatCurrency(offerItem.price || cartonRate)}</span>
                    </div>
                )}
                <div>
                    <span className="text-[9px] font-mono-jet uppercase text-text-muted font-bold block">M.R.P</span>
                    <span className="font-mono-jet font-bold text-sm text-text-primary">{formatCurrency(offerItem.mrp)}</span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal(offerItem);
                    }}
                    className="h-9 px-3 rounded-xl bg-amber text-surface-0 font-display font-bold text-xs uppercase shadow-md hover:bg-amber-bright transition-all flex items-center gap-1.5"
                >
                    <Plus size={14} strokeWidth={3} />
                    Cart
                </button>
            </div>
        </div>
    );
}

function SiteHeader({ customerId, setCustomerId, loading, setLoading, error, setError, appearance, updateAppearance, cartCount, onOpenCart }: {
    customerId: string;
    setCustomerId: (v: string) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (v: string | null) => void;
    appearance: string;
    updateAppearance: (v: any) => void;
    cartCount: number;
    onOpenCart: () => void;
}) {
    const handleAccessRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/access-my-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ customer_id: customerId }),
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                setError(data.message);
                setLoading(false);
            }
        } catch (err) {
            setError("Communication failure. Please check your network.");
            setLoading(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-surface-0/90 backdrop-blur-md border-b border-border min-h-[68px] py-3">
            <div className="max-w-[1800px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Brand */}
                <div className="flex gap-2.5 items-center">
                    <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-surface-2 border border-border">
                        <img src="/storage/img/favicon.png" className="size-6 object-contain" alt="Favicon" />
                    </div>
                    <div className="grid text-left leading-tight">
                        <div className="flex items-center gap-1">
                            <span className="font-display font-black text-xl tracking-tight">Harmain</span> 
                            <span className="font-display font-black text-amber text-xl tracking-tight">Traders</span>
                        </div>
                        <span className="text-[10px] font-mono-jet uppercase tracking-[0.15em] text-text-muted leading-none">Wholesale & Supply Chain</span>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <form onSubmit={handleAccessRequest} className="relative flex items-center gap-2 max-w-sm flex-1">
                        <Input 
                            placeholder="Customer ID / Code"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="bg-surface-2 border-border rounded-xl h-[40px] font-mono-jet text-xs px-3 text-text-primary focus:border-amber"
                        />
                        <Button 
                            disabled={loading}
                            className="bg-amber text-surface-0 font-display font-black text-xs uppercase h-[40px] px-4 rounded-xl hover:bg-amber-bright shrink-0"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Portal'}
                        </Button>
                    </form>

                    <Button 
                        onClick={onOpenCart}
                        className="relative bg-surface-2 border border-border hover:bg-surface-3 text-text-primary h-[40px] px-4 rounded-xl flex items-center gap-2 shrink-0"
                    >
                        <ShoppingCart className="w-4 h-4 text-amber" />
                        <span className="font-mono-jet font-bold text-xs hidden sm:inline">Cart</span>
                        {cartCount > 0 && (
                            <Badge className="bg-amber text-surface-0 font-mono-jet font-black text-[10px] px-1.5 py-0.5 rounded-full">
                                {cartCount}
                            </Badge>
                        )}
                    </Button>

                    <button
                        onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                        className="w-[40px] h-[40px] rounded-xl bg-surface-2 border border-border flex items-center justify-center hover:bg-surface-3 transition-colors shrink-0"
                    >
                        {appearance === 'dark' ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-amber" />}
                    </button>
                </div>
            </div>
        </header>
    );
}

function HeroSection({ searchQuery, setSearchQuery, viewMode, setViewMode, sharedOfferId }: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (v: 'grid' | 'list') => void;
    sharedOfferId?: string | number | null;
}) {
    return (
        <section className="relative w-full overflow-hidden bg-surface-1/50 border-b border-border py-8">
            <div className="max-w-[1800px] mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 bg-amber/10 border border-amber/20 rounded-full px-3 py-1 mb-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="font-mono-jet text-[10px] tracking-wider uppercase text-amber font-bold">
                            Live Wholesale Rates {sharedOfferId ? `(Offer #${sharedOfferId})` : ''}
                        </span>
                    </div>
                    <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-text-primary">
                        Public <span className="text-amber italic">Offer</span> Catalog
                    </h1>
                </div>

                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <Input 
                        placeholder="Search items by name, code or brand..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 bg-surface-2 border-border rounded-xl pl-10 pr-4 font-sans text-xs text-text-primary focus:border-amber"
                    />
                </div>
            </div>
        </section>
    );
}

function EmptyState() {
    return (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-surface-2 border border-border rounded-2xl flex items-center justify-center">
                <Search className="w-8 h-8 text-text-muted" />
            </div>
            <div>
                <h3 className="font-display font-black text-lg uppercase text-text-secondary">No Offers Found</h3>
                <p className="text-xs text-text-muted mt-1">Try clearing your filters or searching for another keyword.</p>
            </div>
        </div>
    );
}

function SiteFooter() {
    return (
        <footer className="bg-surface-1 border-t border-border py-8 px-5 mt-auto">
            <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono-jet text-text-muted">
                <p>© 2026 HARMAIN TRADERS · WHOLESALE & SUPPLY CHAIN</p>
                <div className="flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Powered by Aishtycoons</span>
                </div>
            </div>
        </footer>
    );
}
