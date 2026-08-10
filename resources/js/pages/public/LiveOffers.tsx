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
    X,
    Filter,
    Check,
    RotateCcw,
    Home as HomeIcon,
    Layers,
    User,
    Settings,
    LogOut,
    KeyRound
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

export const toNum = (val: any): number => {
    if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
};

export const getOfferItemRates = (offerItem: any) => {
    if (!offerItem) return { cartonRate: 0, looseRate: 0, singleRate: 0 };
    const packCtn = toNum(offerItem.pack_ctn);
    const loosCtn = toNum(offerItem.loos_ctn);
    const price = toNum(offerItem.price);
    const packingQty = toNum(offerItem.items?.packing_size || offerItem.items?.packing_qty || 1);

    const cartonRate = packCtn > 0 ? packCtn : (price > 0 ? price : 0);
    const looseRate = loosCtn > 0 ? loosCtn : (price > 0 && packingQty > 0 ? price / packingQty : 0);
    const singleRate = price > 0 ? price : cartonRate;

    return { cartonRate, looseRate, singleRate };
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
    offertype?: string;
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

    // Mobile Sheet & Drawer states
    const [categorySheetOpen, setCategorySheetOpen] = useState(false);
    const [brandSheetOpen, setBrandSheetOpen] = useState(false);
    const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);

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
    const [successData, setSuccessData] = useState<{ invoice: string; customerCode: string; guestToken: string; amount?: number } | null>(null);

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

    // Auto-fix cart prices from localStorage if old zero-price items were stored
    useEffect(() => {
        if (allOfferItems.length === 0) return;
        setCart(prev => {
            let modified = false;
            const updatedCart: Record<number, any> = {};

            Object.entries(prev).forEach(([key, item]: [string, any]) => {
                const numericKey = Number(key);
                const offerItem = allOfferItems.find(it => it.id === numericKey);
                if (offerItem) {
                    const { cartonRate, looseRate, singleRate } = getOfferItemRates(offerItem);
                    const isGroupOffer = String(offerItem.offertype) === '1';
                    const packingQty = toNum(offerItem.items?.packing_size || offerItem.items?.packing_qty || 1);
                    const priceCarton = isGroupOffer && packingQty > 1 ? cartonRate : singleRate;
                    const pricePiece = isGroupOffer && packingQty > 1 ? looseRate : (singleRate && packingQty > 1 ? singleRate / packingQty : looseRate);
                    
                    const qtyCarton = toNum(item.qty_carton);
                    const qtyPcs = toNum(item.qty_pcs);
                    const subtotal = (qtyCarton * priceCarton) + (qtyPcs * pricePiece);

                    if (item.price_carton !== priceCarton || item.subtotal !== subtotal) {
                        modified = true;
                    }

                    updatedCart[numericKey] = {
                        ...item,
                        price_carton: priceCarton,
                        price_piece: pricePiece,
                        subtotal: subtotal
                    };
                } else {
                    updatedCart[numericKey] = item;
                }
            });

            return modified ? updatedCart : prev;
        });
    }, [allOfferItems]);

    // Cart Helper Actions
    const removeFromCart = (offerItemId: number | string) => {
        setCart(prev => {
            const next = { ...prev };
            delete next[Number(offerItemId)];
            return next;
        });
    };

    const updateCartQty = (offerItem: OfferItem, field: 'qty_carton' | 'qty_pcs' | 'total_pcs', value: number) => {
        setCart(prev => {
            const { cartonRate, looseRate, singleRate } = getOfferItemRates(offerItem);
            const isGroupOffer = String(offerItem.offertype) === '1';
            const packing = toNum(offerItem.items?.packing_size || offerItem.items?.packing_qty || 1);

            const existing = prev[offerItem.id] || {
                item_id: offerItem.item_id,
                title: offerItem.items?.title,
                code: offerItem.items?.code,
                company: offerItem.items?.companyAccount?.title,
                qty_carton: 0,
                qty_pcs: 0,
                price_carton: 0,
                price_piece: 0,
                scheme: offerItem.scheme,
                image: offerItem.items?.primary_image_url || DEFAULT_IMAGE,
            };

            let qtyCarton = existing.qty_carton || 0;
            let qtyPcs = existing.qty_pcs || 0;

            if (field === 'total_pcs') {
                const totalPcs = Math.max(0, value);
                if (isGroupOffer && packing > 1) {
                    qtyCarton = Math.floor(totalPcs / packing);
                    qtyPcs = totalPcs % packing;
                } else {
                    qtyCarton = totalPcs;
                    qtyPcs = 0;
                }
            } else if (field === 'qty_carton') {
                qtyCarton = Math.max(0, value);
            } else if (field === 'qty_pcs') {
                qtyPcs = Math.max(0, value);
                if (packing > 1 && qtyPcs >= packing) {
                    qtyCarton += Math.floor(qtyPcs / packing);
                    qtyPcs = qtyPcs % packing;
                }
            }

            let priceCarton = 0;
            let pricePiece = 0;
            let subtotal = 0;

            if (isGroupOffer && packing > 1) {
                const ctnRatePerPc = cartonRate > 0 ? cartonRate : (singleRate > 0 ? singleRate : 0);
                const looseRatePerPc = looseRate > 0 ? looseRate : (singleRate > 0 ? singleRate : 0);

                priceCarton = ctnRatePerPc * packing;
                pricePiece = looseRatePerPc;

                subtotal = (qtyCarton * priceCarton) + (qtyPcs * pricePiece);
            } else {
                priceCarton = singleRate > 0 ? singleRate : cartonRate;
                pricePiece = singleRate && packing > 1 ? singleRate / packing : priceCarton;

                subtotal = (qtyCarton * priceCarton) + (qtyPcs * pricePiece);
            }

            const updated = {
                ...existing,
                qty_carton: qtyCarton,
                qty_pcs: qtyPcs,
                price_carton: priceCarton,
                price_piece: pricePiece,
                subtotal: subtotal,
            };

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
        const finalAmount = cartTotal;
        setCheckoutOpen(false);
        setCartDrawerOpen(false);
        setCart({});
        setSuccessData({ invoice, customerCode, guestToken: token, amount: finalAmount });
    };

    const handleOpenItemModal = (offerItem: OfferItem) => {
        setSelectedOfferItem(offerItem);
        setItemDialogOpen(true);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedCompany('all');
    };

    const handleResetHome = () => {
        handleClearFilters();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-surface-0 text-text-primary selection:bg-amber/30 selection:text-amber-bright flex flex-col pb-20 sm:pb-24 antialiased">
            <Head title="Live Offers & Rates Catalog | Harmain Traders" />

            {/* Site Header */}
            <SiteHeader 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                customerId={customerId}
                setCustomerId={setCustomerId}
                accessLoading={accessLoading}
                setAccessLoading={setAccessLoading}
                accessError={accessError}
                setAccessError={setAccessError}
                appearance={appearance}
                updateAppearance={updateAppearance}
                cartCount={cartCount}
                onOpenCart={() => setCartDrawerOpen(true)}
                onOpenAccount={() => setAccountDrawerOpen(true)}
                sharedOfferId={sharedOfferId}
            />

            <main className="flex-1">
                {/* Category Carousel Bar (Desktop only) */}
                {categories && categories.length > 0 && (
                    <div className="hidden sm:block">
                        <CategoryCarousel 
                            categories={categories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            DEFAULT_IMAGE={DEFAULT_IMAGE}
                        />
                    </div>
                )}

                {/* Main Content Layout (Sidebar + Product Grid) */}
                <div className="max-w-[1800px] mx-auto px-2.5 sm:px-4 py-3 sm:py-6">
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                        {/* Sidebar: Shop By Brand (Visible on Desktop lg+) */}
                        <aside className="hidden lg:block lg:w-72 shrink-0">
                            <div className="bg-surface-1 rounded-2xl border border-border shadow-sm overflow-hidden sticky top-[130px]">
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
                            {/* Sub-Header Toolbar */}
                            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-6 px-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className="text-base sm:text-2xl font-display font-black uppercase text-text-primary tracking-tight truncate">
                                        {selectedCompany !== 'all' ? selectedCompany : (selectedCategory === 'all' ? 'All Live Offers' : categories.find(c => c.id === selectedCategory)?.name)}
                                    </h2>
                                    <Badge className="bg-amber/15 text-amber border-amber/30 font-black px-2 py-0.5 text-[9px] sm:text-[10px] shrink-0">
                                        {filteredOfferItems.length} ITEMS
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {(selectedCategory !== 'all' || selectedCompany !== 'all' || searchQuery !== '') && (
                                        <button
                                            onClick={handleClearFilters}
                                            className="text-[10px] font-mono-jet uppercase font-bold text-amber hover:text-amber-bright flex items-center gap-1 bg-amber/10 px-2 py-1 rounded-lg border border-amber/20 transition-all active:scale-95"
                                        >
                                            <RotateCcw size={10} />
                                            <span className="hidden sm:inline">Clear Filters</span>
                                        </button>
                                    )}

                                    <div className="flex bg-surface-2 p-1 rounded-xl border border-border">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                "p-1.5 sm:p-2 rounded-lg transition-all",
                                                viewMode === 'grid' ? "bg-amber text-surface-0 shadow-sm" : "text-text-muted hover:text-text-primary"
                                            )}
                                            title="Grid View"
                                        >
                                            <LayoutGrid size={15} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-1.5 sm:p-2 rounded-lg transition-all",
                                                viewMode === 'list' ? "bg-amber text-surface-0 shadow-sm" : "text-text-muted hover:text-text-primary"
                                            )}
                                            title="List View"
                                        >
                                            <LayoutList size={15} className="sm:w-[18px] sm:h-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Grid / List View Render */}
                            {filteredOfferItems.length === 0 ? (
                                <EmptyState onClear={handleClearFilters} />
                            ) : viewMode === 'grid' ? (
                                /* AliExpress Style 2-Column Mobile Grid */
                                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
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
                                <div className="flex flex-col gap-2 sm:gap-3">
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

            {/* Mobile Bottom Navigation Bar (Home, Category, Brand, Cart) */}
            <MobileBottomNav 
                cartCount={cartCount}
                activeCategory={selectedCategory !== 'all'}
                activeBrand={selectedCompany !== 'all'}
                onHomeClick={handleResetHome}
                onCategoryClick={() => setCategorySheetOpen(true)}
                onBrandClick={() => setBrandSheetOpen(true)}
                onCartClick={() => setCartDrawerOpen(true)}
            />

            {/* Category Bottom-to-Up Dialog Sheet */}
            <CategoryBottomDialog 
                open={categorySheetOpen}
                onClose={() => setCategorySheetOpen(false)}
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={(id) => {
                    setSelectedCategory(id);
                    setCategorySheetOpen(false);
                }}
                DEFAULT_IMAGE={DEFAULT_IMAGE}
            />

            {/* Brand Bottom-to-Up Dialog Sheet */}
            <BrandBottomDialog 
                open={brandSheetOpen}
                onClose={() => setBrandSheetOpen(false)}
                companies={companies}
                selectedCompany={selectedCompany}
                onSelectCompany={(name) => {
                    setSelectedCompany(name);
                    setBrandSheetOpen(false);
                }}
            />

            {/* Left-to-Right Mobile Account & Settings Drawer */}
            <AccountLeftDrawer 
                open={accountDrawerOpen}
                onClose={() => setAccountDrawerOpen(false)}
                customerId={customerId}
                setCustomerId={setCustomerId}
                loading={accessLoading}
                setLoading={setAccessLoading}
                error={accessError}
                setError={setAccessError}
                appearance={appearance}
                updateAppearance={updateAppearance}
            />

            {/* Cart Drawer (Right to Left) */}
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
                            <div className="p-4 sm:p-5 border-b border-border bg-surface-2 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-amber" />
                                    <h3 className="font-display font-black text-base sm:text-lg uppercase tracking-tight text-text-primary">
                                        Your Offer Order ({cartCount})
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setCartDrawerOpen(false)}
                                    className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary active:scale-95 transition-transform"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Cart List */}
                            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3">
                                {cartList.length === 0 ? (
                                    <div className="py-20 text-center text-text-muted space-y-3">
                                        <ShoppingCart className="w-12 h-12 mx-auto opacity-30" />
                                        <p className="font-mono-jet text-xs uppercase font-bold">Your cart is empty</p>
                                    </div>
                                ) : (
                                    Object.entries(cart).map(([offerItemId, item]) => (
                                        <div key={offerItemId} className="bg-surface-2 border border-border p-3 rounded-xl flex items-center gap-3 relative group">
                                            <img src={item.image || DEFAULT_IMAGE} alt={item.title} className="w-12 h-12 object-cover rounded-lg bg-surface-1 border shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-xs sm:text-sm text-text-primary truncate">{item.title}</h5>
                                                <p className="text-[9px] font-mono-jet text-text-muted uppercase truncate">{item.company}</p>
                                                <div className="text-xs font-bold text-amber mt-0.5">
                                                    {formatCurrency(item.subtotal)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => removeFromCart(offerItemId)}
                                                    title="Remove item"
                                                    className="w-6 h-6 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-all flex items-center justify-center border border-rose-500/20 active:scale-95"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                                <div className="text-right text-[10px] font-mono-jet space-y-0.5">
                                                    {item.qty_carton > 0 && <span className="block font-bold">{item.qty_carton} Ctn</span>}
                                                    {item.qty_pcs > 0 && <span className="block text-text-muted">{item.qty_pcs} Loose</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Drawer Footer */}
                            {cartList.length > 0 && (
                                <div className="p-4 sm:p-5 border-t border-border bg-surface-2 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="font-mono-jet text-xs font-black uppercase text-text-muted">Total Net Amount:</span>
                                        <span className="font-display font-black text-xl sm:text-2xl text-amber">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setCartDrawerOpen(false);
                                            setCheckoutOpen(true);
                                        }}
                                        className="w-full bg-amber hover:bg-amber-bright text-surface-0 font-display font-black text-xs sm:text-sm uppercase h-11 sm:h-12 rounded-xl shadow-lg shadow-amber/20 flex items-center justify-center gap-2 active:scale-98 transition-transform"
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
                amount={successData?.amount}
                formatCurrency={formatCurrency}
            />

            {/* Site Footer */}
            <SiteFooter />
        </div>
    );
}

// --- AliExpress Inspired Components ---

function SiteHeader({ searchQuery, setSearchQuery, customerId, setCustomerId, accessLoading, setAccessLoading, accessError, setAccessError, appearance, updateAppearance, cartCount, onOpenCart, onOpenAccount, sharedOfferId }: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    customerId: string;
    setCustomerId: (v: string) => void;
    accessLoading: boolean;
    setAccessLoading: (v: boolean) => void;
    accessError: string | null;
    setAccessError: (v: string | null) => void;
    appearance: string;
    updateAppearance: (v: any) => void;
    cartCount: number;
    onOpenCart: () => void;
    onOpenAccount: () => void;
    sharedOfferId?: string | number | null;
}) {
    const handleAccessRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerId.trim()) return;

        setAccessLoading(true);
        setAccessError(null);

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
                setAccessError(data.message);
                setAccessLoading(false);
            }
        } catch (err) {
            setAccessError("Communication failure. Please check your network.");
            setAccessLoading(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 bg-surface-0/95 backdrop-blur-md border-b border-border py-2 px-3 sm:px-5">
            <div className="max-w-[1800px] mx-auto space-y-2">
                {/* Row 1: Logo, Desktop Search & Controls */}
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Top Left: Logo */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex aspect-square size-7 sm:size-9 items-center justify-center rounded-lg sm:rounded-xl bg-surface-2 border border-border shrink-0">
                            <img src="/storage/img/favicon.png" className="size-4 sm:size-6 object-contain" alt="Favicon" />
                        </div>
                        <div className="grid text-left leading-tight">
                            <div className="flex items-center gap-1">
                                <span className="font-display font-black text-base sm:text-xl tracking-tight text-text-primary">Harmain</span> 
                                <span className="font-display font-black text-amber text-base sm:text-xl tracking-tight">Traders</span>
                            </div>
                            <span className="text-[8px] sm:text-[10px] font-mono-jet uppercase tracking-[0.12em] text-text-muted leading-none">Wholesale Catalog</span>
                        </div>
                    </div>

                    {/* Desktop Search Bar (Placed between Logo and Controls on Desktop & Laptop) */}
                    <div className="hidden sm:flex relative flex-1 max-w-xl mx-2 md:mx-4">
                        <div className="relative flex items-center w-full">
                            <Input 
                                placeholder="Search items by name, code or brand..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-9 sm:h-10 bg-surface-2 border-border/80 rounded-full pl-4 pr-12 font-sans text-xs text-text-primary focus:border-amber shadow-inner"
                            />
                            {searchQuery ? (
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-10 text-text-muted hover:text-text-primary p-1"
                                >
                                    <X size={14} />
                                </button>
                            ) : null}
                            
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-text-primary text-surface-0 flex items-center justify-center shrink-0 shadow-md">
                                <Search size={13} />
                            </div>
                        </div>
                    </div>

                    {/* Top Right: Desktop Form & Mobile Account Button ONLY */}
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                        {/* Desktop Customer ID Portal Form (Hidden on Mobile) */}
                        <form onSubmit={handleAccessRequest} className="hidden sm:flex items-center gap-2 max-w-xs">
                            <Input 
                                placeholder="Customer ID / Code"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="bg-surface-2 border-border rounded-xl h-[36px] font-mono-jet text-xs px-3 text-text-primary focus:border-amber"
                            />
                            <Button 
                                disabled={accessLoading}
                                className="bg-amber text-surface-0 font-display font-black text-xs uppercase h-[36px] px-3.5 rounded-xl hover:bg-amber-bright shrink-0"
                            >
                                {accessLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Portal'}
                            </Button>
                        </form>

                        {/* Desktop Cart Button (Hidden on Mobile) */}
                        <button
                            onClick={onOpenCart}
                            className="hidden sm:flex relative bg-surface-2 hover:bg-surface-3 border border-border text-text-primary h-[38px] px-3 rounded-xl items-center gap-1.5 shrink-0 active:scale-95"
                        >
                            <ShoppingCart className="w-4 h-4 text-amber" />
                            <span className="font-mono-jet font-bold text-xs">Cart</span>
                            {cartCount > 0 && (
                                <Badge className="bg-amber text-surface-0 font-mono-jet font-black text-[9px] px-1.5 py-0 rounded-full">
                                    {cartCount}
                                </Badge>
                            )}
                        </button>

                        {/* Desktop Theme Toggle (Hidden on Mobile) */}
                        <button
                            onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                            className="hidden sm:flex w-[38px] h-[38px] rounded-xl bg-surface-2 border border-border items-center justify-center hover:bg-surface-3 transition-colors shrink-0 active:scale-95"
                            title="Toggle Light/Dark Theme"
                        >
                            {appearance === 'dark' ? <Sun className="w-4 h-4 text-amber" /> : <Moon className="w-4 h-4 text-amber" />}
                        </button>

                        {/* Mobile ONLY: Single Account Button (Triggers Left Drawer) */}
                        <button
                            onClick={onOpenAccount}
                            className="sm:hidden bg-amber text-surface-0 font-display font-bold text-xs uppercase h-[34px] px-3 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0"
                        >
                            <User size={15} />
                            <span>Account</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: Mobile ONLY Full Width Search Bar */}
                <div className="relative w-full sm:hidden">
                    <div className="relative flex items-center w-full">
                        <Input 
                            placeholder="Search items by name, code or brand..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 bg-surface-2 border-border/80 rounded-full pl-4 pr-12 font-sans text-xs text-text-primary focus:border-amber shadow-inner"
                        />
                        {searchQuery ? (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-11 text-text-muted hover:text-text-primary p-1"
                            >
                                <X size={14} />
                            </button>
                        ) : null}
                        
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-text-primary text-surface-0 flex items-center justify-center shrink-0 shadow-md">
                            <Search size={14} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function MobileBottomNav({ cartCount, activeCategory, activeBrand, onHomeClick, onCategoryClick, onBrandClick, onCartClick }: {
    cartCount: number;
    activeCategory: boolean;
    activeBrand: boolean;
    onHomeClick: () => void;
    onCategoryClick: () => void;
    onBrandClick: () => void;
    onCartClick: () => void;
}) {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/95 backdrop-blur-xl border-t border-border py-1.5 px-2 flex justify-around items-center sm:hidden shadow-2xl select-none">
            {/* 1. Home */}
            <button 
                onClick={onHomeClick}
                className="flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all active:scale-95 text-amber"
            >
                <div className="w-7 h-7 rounded-xl bg-amber/15 text-amber flex items-center justify-center">
                    <HomeIcon size={16} />
                </div>
                <span className="leading-none text-[10px]">Home</span>
            </button>

            {/* 2. Category */}
            <button 
                onClick={onCategoryClick}
                className={cn(
                    "flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all active:scale-95 relative",
                    activeCategory ? "text-amber" : "text-text-muted hover:text-text-primary"
                )}
            >
                <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", activeCategory ? "bg-amber/15 text-amber" : "bg-surface-2 text-text-muted")}>
                    <Layers size={16} />
                </div>
                <span className="leading-none text-[10px]">Category</span>
            </button>

            {/* 3. Brand */}
            <button 
                onClick={onBrandClick}
                className={cn(
                    "flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all active:scale-95 relative",
                    activeBrand ? "text-amber" : "text-text-muted hover:text-text-primary"
                )}
            >
                <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center", activeBrand ? "bg-amber/15 text-amber" : "bg-surface-2 text-text-muted")}>
                    <Box size={16} />
                </div>
                <span className="leading-none text-[10px]">Brand</span>
            </button>

            {/* 4. Cart */}
            <button 
                onClick={onCartClick}
                className="flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all active:scale-95 text-text-muted hover:text-text-primary relative"
            >
                <div className="w-7 h-7 rounded-xl bg-surface-2 text-text-muted flex items-center justify-center relative">
                    <ShoppingCart size={16} />
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber text-surface-0 rounded-full font-mono-jet text-[9px] font-black flex items-center justify-center shadow-sm">
                            {cartCount}
                        </span>
                    )}
                </div>
                <span className="leading-none text-[10px]">Cart</span>
            </button>
        </nav>
    );
}

// --- Left-to-Right Mobile Account & Settings Drawer ---

function AccountLeftDrawer({ open, onClose, customerId, setCustomerId, loading, setLoading, error, setError, appearance, updateAppearance }: {
    open: boolean;
    onClose: () => void;
    customerId: string;
    setCustomerId: (v: string) => void;
    loading: boolean;
    setLoading: (v: boolean) => void;
    error: string | null;
    setError: (v: string | null) => void;
    appearance: string;
    updateAppearance: (v: any) => void;
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
        <AnimatePresence>
            {open && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start"
                    onClick={onClose}
                >
                    {/* Left-to-Right Sliding Panel */}
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                        className="w-full max-w-xs sm:max-w-sm bg-surface-1 h-full shadow-2xl flex flex-col border-r border-border overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Top Header */}
                        <div className="p-4 border-b border-border bg-surface-2 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-amber text-surface-0 flex items-center justify-center font-bold">
                                    <User size={18} />
                                </div>
                                <div>
                                    <h3 className="font-display font-black text-base uppercase text-text-primary leading-tight">Account & Portal</h3>
                                    <span className="text-[10px] font-mono-jet text-text-muted uppercase">Harmain Traders</span>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-muted hover:text-text-primary active:scale-95 transition-transform"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-6 flex-1">
                            {/* Section 1: Customer Portal Access */}
                            <div className="bg-surface-2/70 p-4 rounded-xl border border-border/70 space-y-3">
                                <div className="flex items-center gap-2">
                                    <KeyRound className="w-4 h-4 text-amber" />
                                    <h4 className="font-display font-black text-xs uppercase text-text-primary tracking-wider">Customer Portal Login</h4>
                                </div>
                                <p className="text-[11px] text-text-muted">Enter your Customer ID or Code to access personalized wholesale rates.</p>

                                <form onSubmit={handleAccessRequest} className="space-y-2.5">
                                    <Input 
                                        placeholder="Enter Customer ID / Code"
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        className="bg-surface-1 border-border rounded-xl h-10 font-mono-jet text-xs px-3 text-text-primary focus:border-amber"
                                    />
                                    {error && <p className="text-[10px] text-rose-500 font-bold">{error}</p>}
                                    <Button 
                                        disabled={loading}
                                        className="w-full bg-amber text-surface-0 font-display font-black text-xs uppercase h-10 rounded-xl hover:bg-amber-bright shadow-md shadow-amber/20"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Login to Portal'}
                                    </Button>
                                </form>
                            </div>

                            {/* Section 2: Appearance & Theme Switcher */}
                            <div className="bg-surface-2/70 p-4 rounded-xl border border-border/70 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-amber" />
                                    <h4 className="font-display font-black text-xs uppercase text-text-primary tracking-wider">Appearance Theme</h4>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => updateAppearance('light')}
                                        className={cn(
                                            "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold active:scale-95",
                                            appearance === 'light'
                                                ? "bg-amber text-surface-0 border-amber shadow-sm"
                                                : "bg-surface-1 border-border text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <Sun size={18} />
                                        <span>Light Mode</span>
                                    </button>

                                    <button
                                        onClick={() => updateAppearance('dark')}
                                        className={cn(
                                            "p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold active:scale-95",
                                            appearance === 'dark'
                                                ? "bg-amber text-surface-0 border-amber shadow-sm"
                                                : "bg-surface-1 border-border text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        <Moon size={18} />
                                        <span>Dark Mode</span>
                                    </button>
                                </div>
                            </div>

                            {/* Section 3: Wholesale Info Badge */}
                            <div className="p-3 bg-amber/10 border border-amber/20 rounded-xl text-center space-y-1">
                                <span className="font-mono-jet text-[10px] uppercase font-bold text-amber block">Harmain Traders · Wholesale</span>
                                <p className="text-[10px] text-text-muted">Live rates catalog & direct order booking system.</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// --- Bottom-to-Up Dialog Sheets ---

function CategoryBottomDialog({ open, onClose, categories, selectedCategory, onSelectCategory, DEFAULT_IMAGE }: {
    open: boolean;
    onClose: () => void;
    categories: Category[];
    selectedCategory: string | number;
    onSelectCategory: (id: string | number) => void;
    DEFAULT_IMAGE: string;
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        className="w-full max-w-lg bg-surface-1 rounded-t-2xl shadow-2xl border-t border-border overflow-hidden max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Drag Handle */}
                        <div className="pt-3 pb-2 flex flex-col items-center border-b border-border/60 bg-surface-2/50 shrink-0">
                            <div className="w-12 h-1 bg-border rounded-full mb-2" />
                            <div className="w-full px-4 flex items-center justify-between">
                                <h3 className="font-display font-black text-lg uppercase tracking-tight text-text-primary">Select Category</h3>
                                <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Category List / Grid */}
                        <div className="p-4 overflow-y-auto space-y-2 flex-1">
                            <button
                                onClick={() => onSelectCategory('all')}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98",
                                    selectedCategory === 'all'
                                        ? "bg-amber text-surface-0 border-amber shadow-md font-bold"
                                        : "bg-surface-2 border-border text-text-primary hover:bg-surface-3"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface-0/20 flex items-center justify-center shrink-0">
                                        <ShoppingBag size={18} />
                                    </div>
                                    <span className="text-sm font-bold">All Categories</span>
                                </div>
                                {selectedCategory === 'all' && <Check size={16} />}
                            </button>

                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => onSelectCategory(cat.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98",
                                        selectedCategory === cat.id
                                            ? "bg-amber text-surface-0 border-amber shadow-md font-bold"
                                            : "bg-surface-2 border-border text-text-primary hover:bg-surface-3"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-0/20 flex items-center justify-center shrink-0 border border-border">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag size={16} />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold truncate">{cat.name}</span>
                                    </div>
                                    {selectedCategory === cat.id && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function BrandBottomDialog({ open, onClose, companies, selectedCompany, onSelectCompany }: {
    open: boolean;
    onClose: () => void;
    companies: Array<{ name: string; count: number; image: string | null }>;
    selectedCompany: string;
    onSelectCompany: (name: string) => void;
}) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return companies;
        return companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
    }, [companies, search]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        className="w-full max-w-lg bg-surface-1 rounded-t-2xl shadow-2xl border-t border-border overflow-hidden max-h-[85vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Drag Handle */}
                        <div className="pt-3 pb-2 flex flex-col items-center border-b border-border/60 bg-surface-2/50 shrink-0">
                            <div className="w-12 h-1 bg-border rounded-full mb-2" />
                            <div className="w-full px-4 flex items-center justify-between">
                                <h3 className="font-display font-black text-lg uppercase tracking-tight text-text-primary">Select Brand</h3>
                                <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Search Brand Inside Sheet */}
                        <div className="p-3 border-b border-border/60 shrink-0">
                            <Input 
                                placeholder="Search brand..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-surface-2 border-border rounded-xl h-9 text-xs"
                            />
                        </div>

                        {/* Brand List */}
                        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
                            <button
                                onClick={() => onSelectCompany('all')}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98",
                                    selectedCompany === 'all'
                                        ? "bg-amber text-surface-0 border-amber shadow-md font-bold"
                                        : "bg-surface-2 border-border text-text-primary hover:bg-surface-3"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface-0/20 flex items-center justify-center shrink-0">
                                        <Box size={16} />
                                    </div>
                                    <span className="text-sm font-bold">All Brands</span>
                                </div>
                                {selectedCompany === 'all' && <Check size={16} />}
                            </button>

                            {filtered.map((company) => (
                                <button
                                    key={company.name}
                                    onClick={() => onSelectCompany(company.name)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-98",
                                        selectedCompany === company.name
                                            ? "bg-amber text-surface-0 border-amber shadow-md font-bold"
                                            : "bg-surface-2 border-border text-text-primary hover:bg-surface-3"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface-0/20 flex items-center justify-center shrink-0 border border-border">
                                            {company.image ? (
                                                <img src={company.image} alt={company.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-black">{company.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <span className="text-sm font-bold truncate">{company.name}</span>
                                    </div>
                                    <span className="text-xs font-bold opacity-80">{company.count}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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

    const { cartonRate, looseRate, singleRate } = getOfferItemRates(offerItem);
    const qtyCtn = toNum(cartItem?.qty_carton);
    const qtyPcs = toNum(cartItem?.qty_pcs);
    const hasCartQty = qtyCtn > 0 || qtyPcs > 0;

    const isGroupOffer = String((offerItem as any).offertype) === '1';
    const packingQty = toNum(item?.packing_size || item?.packing_qty || 1);
    const showCartonAndLoose = isGroupOffer && packingQty > 1;
    const brandName = getItemBrandName(item) || 'Harmain Direct';

    return (
        <motion.div 
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpenModal(offerItem)}
            className={cn(
                "bg-surface-1 border rounded-xl sm:rounded-2xl overflow-hidden transition-all flex flex-col justify-between group cursor-pointer h-full relative select-none",
                hasCartQty 
                    ? "border-amber/60 shadow-md ring-1 ring-amber/30" 
                    : "border-border hover:border-amber/40 hover:shadow-lg"
            )}
        >
            {/* Top Badges */}
            <div className="absolute top-1.5 left-1.5 right-1.5 z-10 flex items-center justify-between pointer-events-none">
                {offerItem.scheme ? (
                    <Badge className="bg-amber text-surface-0 font-display font-black text-[8px] sm:text-[9px] uppercase px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-0.5 truncate max-w-[85%]">
                        <Sparkles className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{offerItem.scheme}</span>
                    </Badge>
                ) : (
                    <div />
                )}

                {hasCartQty && (
                    <Badge className="bg-emerald-600 text-white font-mono-jet font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-0.5 ml-auto">
                        <Check className="w-2.5 h-2.5" />
                        <span>{qtyCtn > 0 ? `${qtyCtn}C` : ''}{qtyCtn > 0 && qtyPcs > 0 ? '+' : ''}{qtyPcs > 0 ? `${qtyPcs}L` : ''}</span>
                    </Badge>
                )}
            </div>

            {/* Product Image Container (1:1 Aspect Ratio) */}
            <div className="relative aspect-square bg-surface-2/80 overflow-hidden flex items-center justify-center p-2">
                <img 
                    src={primaryImg} 
                    alt={item?.title} 
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg"
                    onError={(e) => (e.target as HTMLImageElement).src = DEFAULT_IMAGE}
                    loading="lazy"
                />
            </div>

            {/* Card Content Area */}
            <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                <div>
                    {/* Category & Brand Header */}
                    <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono-jet uppercase text-text-muted font-bold tracking-wider truncate mb-0.5">
                        <span className="truncate">{brandName}</span>
                    </div>

                    {/* Product Name (Max 2 lines ellipsis) */}
                    <h6 className="font-display font-black text-xs sm:text-sm uppercase tracking-tight text-text-primary group-hover:text-amber transition-colors line-clamp-2 leading-snug min-h-[30px]">
                        {item?.title}
                    </h6>
                </div>

                {/* Pricing & CTA Section */}
                <div className="mt-2 pt-2 border-t border-border/60">
                    {showCartonAndLoose ? (
                        <div className="grid grid-cols-2 gap-1 mb-2 bg-surface-2/70 p-1.5 rounded-lg border border-border/50 text-center">
                            <div>
                                <span className="text-[8px] font-mono-jet uppercase text-text-muted font-bold block leading-none">Carton</span>
                                <span className="font-mono-jet font-bold text-xs sm:text-sm text-text-primary block mt-0.5">{formatCurrency(cartonRate)}</span>
                            </div>
                            <div className="border-l border-border/60">
                                <span className="text-[8px] font-mono-jet uppercase text-text-muted font-bold block leading-none">Loose</span>
                                <span className="font-mono-jet font-bold text-xs sm:text-sm text-text-primary block mt-0.5">{formatCurrency(looseRate)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-2 bg-surface-2/70 p-1.5 rounded-lg border border-border/50 flex justify-between items-center px-2">
                            <span className="text-[8px] font-mono-jet uppercase text-text-muted font-bold">Pcs Rate</span>
                            <span className="font-mono-jet font-black text-xs sm:text-sm text-amber">{formatCurrency(looseRate || singleRate || cartonRate)}</span>
                        </div>
                    )}

                    {/* MRP & Action Footer */}
                    <div className="flex justify-between items-center gap-1">
                        <div className="text-[9px] sm:text-[10px] font-mono-jet leading-none">
                            <span className="text-text-muted block text-[8px] uppercase">M.R.P</span>
                            <span className="font-bold text-text-muted line-through">{formatCurrency(offerItem.mrp)}</span>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal(offerItem);
                            }}
                            className={cn(
                                "h-7 sm:h-8 px-2.5 sm:px-3 rounded-lg font-display font-black text-[10px] sm:text-xs uppercase flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95 shrink-0",
                                hasCartQty
                                    ? "bg-amber text-surface-0 hover:bg-amber-bright"
                                    : "bg-surface-2 hover:bg-amber hover:text-surface-0 text-text-primary border border-border"
                            )}
                        >
                            <Plus size={12} strokeWidth={3} />
                            <span>{hasCartQty ? 'Edit' : 'Cart'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
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
    const { cartonRate, looseRate, singleRate } = getOfferItemRates(offerItem);
    const isGroupOffer = String((offerItem as any).offertype) === '1';
    const packingQty = toNum(item?.packing_size || item?.packing_qty || 1);
    const showCartonAndLoose = isGroupOffer && packingQty > 1;

    const qtyCtn = toNum(cartItem?.qty_carton);
    const qtyPcs = toNum(cartItem?.qty_pcs);
    const hasCartQty = qtyCtn > 0 || qtyPcs > 0;

    return (
        <div 
            onClick={() => onOpenModal(offerItem)}
            className={cn(
                "bg-surface-1 border rounded-xl p-2.5 sm:p-4 flex items-center gap-3 hover:border-amber/30 transition-all cursor-pointer select-none",
                hasCartQty ? "border-amber/60 shadow-sm" : "border-border"
            )}
        >
            <img src={primaryImg} alt={item?.title} className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-lg bg-surface-2 p-1 border border-border shrink-0" />

            <div className="flex-1 min-w-0">
                <span className="text-[8px] sm:text-[10px] font-mono-jet uppercase text-text-muted font-bold truncate block">
                    {getItemBrandName(item) || 'Harmain Direct'}
                </span>
                <h6 className="font-display font-black text-xs sm:text-base uppercase text-text-primary truncate">
                    {item?.title}
                </h6>
                {offerItem.scheme && (
                    <Badge className="bg-amber/15 text-amber border-none text-[8px] sm:text-[9px] font-bold mt-0.5 px-1.5 py-0">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5 inline" />
                        {offerItem.scheme}
                    </Badge>
                )}
            </div>

            <div className="flex items-center gap-2 sm:gap-6 text-right shrink-0">
                {showCartonAndLoose ? (
                    <div className="text-[10px] sm:text-xs font-mono-jet space-y-0.5">
                        <div className="text-text-primary font-bold"><span className="text-text-muted font-normal text-[8px] uppercase mr-1">Ctn:</span>{formatCurrency(cartonRate)}</div>
                        <div className="text-text-primary"><span className="text-text-muted font-normal text-[8px] uppercase mr-1">Loose:</span>{formatCurrency(looseRate)}</div>
                    </div>
                ) : (
                    <div>
                        <span className="text-[8px] font-mono-jet uppercase text-text-muted font-bold block">Pcs Rate</span>
                        <span className="font-mono-jet font-black text-xs sm:text-base text-amber">{formatCurrency(looseRate || singleRate || cartonRate)}</span>
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenModal(offerItem);
                    }}
                    className={cn(
                        "h-8 px-2.5 sm:px-3 rounded-lg font-display font-bold text-xs uppercase shadow-sm transition-all flex items-center gap-1 active:scale-95",
                        hasCartQty ? "bg-amber text-surface-0" : "bg-surface-2 hover:bg-amber hover:text-surface-0 border border-border"
                    )}
                >
                    <Plus size={14} strokeWidth={3} />
                    <span className="hidden sm:inline">Cart</span>
                </button>
            </div>
        </div>
    );
}

function EmptyState({ onClear }: { onClear: () => void }) {
    return (
        <div className="py-12 sm:py-20 flex flex-col items-center gap-3 text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-surface-2 border border-border rounded-2xl flex items-center justify-center text-text-muted shadow-inner">
                <Search className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
                <h3 className="font-display font-black text-base sm:text-lg uppercase text-text-secondary">No Matching Offers</h3>
                <p className="text-xs text-text-muted mt-0.5 max-w-xs">We couldn't find any items matching your selected search or filters.</p>
            </div>
            <Button
                onClick={onClear}
                className="mt-2 bg-amber text-surface-0 font-display font-bold text-xs uppercase px-4 h-9 rounded-xl hover:bg-amber-bright active:scale-95"
            >
                Clear Filters & Search
            </Button>
        </div>
    );
}

function SiteFooter() {
    return (
        <footer className="bg-surface-1 border-t border-border py-6 px-4 mt-auto">
            <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] sm:text-xs font-mono-jet text-text-muted text-center sm:text-left">
                <p>© 2026 HARMAIN TRADERS · WHOLESALE & SUPPLY CHAIN</p>
                <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Powered by Aishtycoons</span>
                </div>
            </div>
        </footer>
    );
}
