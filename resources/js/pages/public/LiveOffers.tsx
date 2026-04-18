import React, { useState, useMemo } from 'react';
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
    Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import { useAppearance } from '@/hooks/use-appearance';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Interfaces ---

interface Item {
    id: number;
    title: string;
    company_account?: { title: string };
    category?: { name: string };
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
}

// --- Main Page Component ---

export default function LiveOffers({ customerOffer, marketOffer, sharedOfferId }: Props) {
    const { appearance, updateAppearance } = useAppearance();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [customerId, setCustomerId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'category' | 'company' | 'alphabetical'>('category');

    // Filtering & Sorting Logic
    const processItems = (offer: Offer | null) => {
        if (!offer) return [];
        let items = [...offer.items];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(it => 
                it.items.title.toLowerCase().includes(q) || 
                it.items.company_account?.title?.toLowerCase().includes(q) ||
                it.items.category?.name?.toLowerCase().includes(q)
            );
        }

        if (filterType === 'alphabetical') {
            items.sort((a, b) => a.items.title.localeCompare(b.items.title));
        }

        return items;
    };

    const customerItems = useMemo(() => processItems(customerOffer), [customerOffer, searchQuery, filterType]);
    const marketItems = useMemo(() => processItems(marketOffer), [marketOffer, searchQuery, filterType]);

    // Grouping Logic
    const groupItems = (items: OfferItem[]) => {
        const groups: Record<string, OfferItem[]> = {};
        
        items.forEach(it => {
            let key = 'All Items';
            if (filterType === 'category') {
                key = it.items.category?.name || 'Uncategorized';
            } else if (filterType === 'company') {
                key = it.items.company_account?.title || 'Unknown Brand';
            }
            
            if (!groups[key]) groups[key] = [];
            groups[key].push(it);
        });

        return Object.keys(groups).sort().map(key => ({
            name: key,
            items: groups[key]
        }));
    };

    return (
        <div className="min-h-screen bg-surface-0 text-text-primary selection:bg-amber/30 selection:text-amber-bright">
            <Head title="Live Offers | Harmain Traders" />

            <SiteHeader 
                customerId={customerId} 
                setCustomerId={setCustomerId} 
                loading={loading} 
                setLoading={setLoading}
                error={error} 
                setError={setError}
                appearance={appearance}
                updateAppearance={updateAppearance}
            />

            <main>
                <HeroSection 
                    searchQuery={searchQuery} 
                    setSearchQuery={setSearchQuery} 
                    filterType={filterType} 
                    setFilterType={setFilterType} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    sharedOfferId={sharedOfferId}
                />



                <div className="max-w-7xl mx-auto px-5 pb-20 mt-12">
                    <AnimatePresence mode="wait">
                        {(customerItems.length > 0 || marketItems.length > 0) ? (
                            <motion.div
                                key="content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-24"
                            >
                                {customerItems.length > 0 && (
                                    <TierSection 
                                        title="Group Offers" 
                                        tier="Tier 01" 
                                        items={customerItems} 
                                        variant="group" 
                                        groupItems={groupItems}
                                        viewMode={viewMode}
                                    />
                                )}

                                {marketItems.length > 0 && (
                                    <TierSection 
                                        title="Market Offers" 
                                        tier="Tier 02" 
                                        items={marketItems} 
                                        variant="market" 
                                        groupItems={groupItems}
                                        viewMode={viewMode}
                                    />
                                )}
                            </motion.div>
                        ) : (
                            <EmptyState key="empty" />
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}

// --- Sub-Components ---

function SiteHeader({ customerId, setCustomerId, loading, setLoading, error, setError, appearance, updateAppearance }: {
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
        <header className="sticky top-0 z-50  bg-surface-0/85 backdrop-blur-xl border-b border-border min-h-[68px] py-3 sm:py-0">
            <div className="max-w-7xl mx-auto px-5 h-full py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Brand */}
                <div
                          
                          className="data-[state=open]:bg-sidebar-accent flex gap-2 data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent hover:text-sidebar-foreground focus-visible:ring-0"
                        >
                          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                            <img src="/storage/img/favicon.png" className="size-8 object-contain" alt="Favicon" />
                          </div>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xl">Harmain</span> <span className="font-semibold text-sidebar-primary text-xl">Traders</span>
                            </div>
                            <span className="text-xs">Wholesale <span className="text-sidebar-primary">&</span> Supply Chain</span>
                          </div>
                        </div>
              

                {/* Access Form & Theme Toggle */}
                <div className="flex items-center gap-4 flex-1 justify-end max-w-[500px]">
                    <form onSubmit={handleAccessRequest} className="relative flex items-center gap-2 flex-1">
                        <div className="relative flex-1">
                            <Input 
                                placeholder="Customer ID (e.g. C-001)"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="bg-surface-3 border-border rounded-lg h-[42px] font-mono-jet text-[12px] px-4 text-text-primary focus:border-amber outline-none transition-all placeholder:text-text-muted"
                            />
                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="absolute -bottom-6 left-0 right-0 bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-md shadow-lg z-10 flex items-center gap-1.5"
                                    >
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <Button 
                            disabled={loading}
                            className="bg-amber text-surface-0 font-display font-black text-[13px] tracking-[0.08em] uppercase h-[42px] px-5 rounded-lg hover:bg-amber-bright active:scale-95 transition-all relative overflow-hidden shrink-0"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Access My Offer</span>
                                    <span className="sm:hidden">Access</span>
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    <button
                        onClick={() => updateAppearance(appearance === 'dark' ? 'light' : 'dark')}
                        className="w-[42px] h-[42px] rounded-lg bg-surface-2 border border-border flex items-center justify-center hover:bg-surface-3 transition-colors shrink-0"
                    >
                        {appearance === 'dark' ? (
                            <Sun className="w-4 h-4 text-amber" />
                        ) : (
                            <Moon className="w-4 h-4 text-amber" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}



function HeroSection({ searchQuery, setSearchQuery, filterType, setFilterType, viewMode, setViewMode, sharedOfferId }: {
    searchQuery: string;
    setSearchQuery: (v: string) => void;
    filterType: string;
    setFilterType: (v: any) => void;
    viewMode: 'grid' | 'list';
    setViewMode: (v: 'grid' | 'list') => void;
    sharedOfferId?: string | number | null;
}) {
    return (
        <section className="relative w-full overflow-hidden">
            <div className="absolute inset-0 z-0 bg-cover bg-center opacity-50 dark:opacity-30 transition-opacity pointer-events-none mix-blend-multiply dark:mix-blend-screen" style={{ backgroundImage: "url('/storage/img/hero_bg.png')" }} />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-surface-0/10 via-surface-0/60 to-surface-0 pointer-events-none" />
            <div className="relative z-10 max-w-7xl mx-auto px-5 pt-12 pb-9">
          
            <div className="flex flex-col lg:flex-row justify-between items-end gap-10">
                {/* Left: Text */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-2 bg-amber/8 border border-amber/20 rounded-full px-3 py-1 mb-6">
                        <div className="w-[6px] h-[6px] bg-emerald-500 rounded-full animate-pulse-dot" />
                        <span className="font-mono-jet text-[10px] tracking-[0.15em] uppercase text-amber">
                            Public Gateway · Updated Today
                        </span>
                    </div>

                    <h2 className="font-display font-black text-[clamp(42px,8vw,86px)] uppercase tracking-tight leading-[0.88] text-text-primary">
                        Live <br />
                        <span className="italic text-amber">Public</span> <br />
                        Offers
                    </h2>

                    <p className="text-[13px] text-text-secondary mt-6 font-medium tracking-wide uppercase max-w-sm">
                        Real-time market rates and group discounts synchronized across 12,000+ active items.
                    </p>
                </motion.div>

                {/* Right: Controls */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
                    className="w-full lg:w-[380px] flex flex-col gap-3"
                >
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-amber transition-colors" />
                        <Input 
                            placeholder="Instant item search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-[48px] bg-surface-2 border-border rounded-2xl pl-11 pr-4 font-sans text-[14px] text-text-primary focus:border-amber focus:bg-surface-3 transition-all placeholder:text-text-muted"
                        />
                    </div>

                    <div className="flex bg-surface-2 border border-border rounded-2xl p-1 gap-1">
                        {[
                            { id: 'category', label: 'Category', icon: LayoutList },
                            { id: 'company', label: 'Brand', icon: Building2 },
                            { id: 'alphabetical', label: 'A–Z', icon: ArrowDownAZ },
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setFilterType(btn.id)}
                                className={cn(
                                    "flex-1 h-[36px] rounded-xl flex items-center justify-center gap-1.5 font-display font-bold text-[11px] tracking-[0.08em] uppercase transition-all",
                                    filterType === btn.id 
                                        ? "bg-amber text-surface-0 shadow-lg shadow-amber/20" 
                                        : "text-text-secondary hover:bg-surface-4 hover:text-text-primary"
                                )}
                            >
                                <btn.icon className="w-3.5 h-3.5" />
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-surface-1 border border-border rounded-2xl p-1 gap-1 w-full lg:w-fit ml-auto">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "flex-1 lg:w-10 h-[36px] rounded-xl flex items-center justify-center transition-all",
                                viewMode === 'grid' 
                                    ? "bg-amber text-surface-0" 
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex-1 lg:w-10 h-[36px] rounded-xl flex items-center justify-center transition-all",
                                viewMode === 'list' 
                                    ? "bg-amber text-surface-0" 
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <LayoutList className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            </div>
            </div>
        </section>
    );
}


function TierSection({ title, tier, items, variant, groupItems, viewMode }: {
    title: string;
    tier: string;
    items: OfferItem[];
    variant: 'group' | 'market';
    groupItems: (it: OfferItem[]) => { name: string; items: OfferItem[] }[];
    viewMode: 'grid' | 'list';
}) {
    const isGroup = variant === 'group';

    return (
        <div className="space-y-12">


            {/* Groups */}
            <div className="space-y-16">
                {groupItems(items).map((group) => (
                    <div key={group.name}>
                        <div className="flex items-center gap-3 mb-6 px-1">
                            <div className={cn(
                                "w-[7px] h-[7px] rounded-full",
                                isGroup 
                                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" 
                                    : "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                            )} />
                            <h4 className="font-mono-jet text-[11px] tracking-[0.2em] uppercase text-text-muted font-bold">
                                {group.name}
                            </h4>
                            <span className="font-mono-jet text-[10px] text-text-muted/60 ml-auto border border-border px-2 py-0.5 rounded-full">
                                {group.items.length} items
                            </span>
                        </div>

                        <div className={cn(
                            viewMode === 'grid' 
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
                                : "flex flex-col gap-2"
                        )}>
                            {group.items.map((it) => (
                                viewMode === 'grid' 
                                    ? <OfferCard key={it.id} item={it} variant={variant} />
                                    : <OfferRow key={it.id} item={it} variant={variant} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function OfferCard({ item, variant }: { item: OfferItem, variant: 'group' | 'market' }) {
    const isGroup = variant === 'group';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="group"
        >
            <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden hover:border-amber/25 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-500 flex flex-col h-full">
                {/* Top Accent */}
                <div className={cn(
                    "h-[3px] w-full shrink-0",
                    isGroup 
                        ? "bg-gradient-to-r from-emerald-500 via-emerald-500/50 to-emerald-500/10" 
                        : "bg-gradient-to-r from-blue-500 via-blue-500/50 to-blue-500/10"
                )} />

                <div className="p-5 flex flex-col flex-1">
                    {/* Section 1: Title & Badge */}
                    <div className="flex justify-between items-start gap-4 mb-5">
                        <div className="min-w-0">
                            <h5 className="font-display font-black text-[17px] uppercase tracking-[0.02em] text-text-primary leading-tight group-hover:text-amber transition-colors">
                                {item.items.title}
                            </h5>
                            <div className="flex items-center gap-1.5 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <Building2 className="w-3 h-3 text-text-muted shrink-0" />
                                <span className="font-mono-jet text-[9px] tracking-[0.15em] uppercase text-text-muted truncate">
                                    {item.items.company_account?.title || "Harmain Direct"}
                                </span>
                            </div>
                        </div>

                    </div>

                    {/* Section 2: Price Grid */}
                    <div className={cn("grid gap-2 mt-auto", isGroup ? "grid-cols-2" : "grid-cols-1")}>
                        <div className="bg-surface-2/50 border border-border rounded-xl p-3 text-center group-hover:bg-surface-2 transition-colors">
                            <span className="font-mono-jet text-[8px] tracking-[0.2em] uppercase text-text-muted block mb-1.5 font-bold">
                                {isGroup ? "Ctn Price" : "Rate"}
                            </span>
                            <div className="font-mono-jet font-bold text-text-primary leading-none flex items-center justify-center">
                                <span className="text-[10px] text-text-muted font-normal mr-1">Rs.</span>
                                <span className="text-[18px]">{item.pack_ctn.toLocaleString()}</span>
                            </div>
                        </div>
                        {isGroup && (
                            <div className="bg-surface-2/50 border border-border rounded-xl p-3 text-center group-hover:bg-surface-2 transition-colors">
                                <span className="font-mono-jet text-[8px] tracking-[0.2em] uppercase text-text-muted block mb-1.5 font-bold">
                                    Loose Rate
                                </span>
                                <div className="font-mono-jet font-bold text-text-primary leading-none flex items-center justify-center">
                                    <span className="text-[10px] text-text-muted font-normal mr-1">Rs.</span>
                                    <span className="text-[18px]">{item.loos_ctn.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: MRP & Scheme */}
                    <div className="mt-4 pt-4  space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="font-mono-jet text-[9px] tracking-[0.2em] uppercase text-text-muted font-bold">
                                M.R.P
                            </span>
                            <span className="font-mono-jet font-bold text-text-primary text-[15px]">
                                Rs.{item.mrp.toLocaleString()}
                            </span>
                        </div>

                        {item.scheme && (
                            <div className="bg-amber/7 border border-amber/15 rounded-xl p-2.5 flex items-center gap-2 group-hover:bg-amber/10 transition-colors">
                                <Sparkles className="w-3.5 h-3.5 text-amber animate-pulse shrink-0" />
                                <p className="font-display font-bold italic text-[12px] text-amber tracking-[0.01em] leading-tight truncate">
                                    {item.scheme}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function OfferRow({ item, variant }: { item: OfferItem, variant: 'group' | 'market' }) {
    const isGroup = variant === 'group';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="group"
        >
            <div className="bg-surface-1 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-amber/25 transition-all shadow-sm hover:shadow-md dark:shadow-none transition-all">
                <div className={cn(
                    "w-1 h-10 rounded-full shrink-0 hidden sm:block",
                    isGroup ? "bg-emerald-500" : "bg-blue-500"
                )} />
                
                <div className="flex-1 min-w-0">
                    <h5 className="font-display font-black text-[15px] uppercase tracking-[0.02em] text-text-primary truncate">
                        {item.items.title}
                    </h5>
                    <p className="font-mono-jet text-[9px] tracking-[0.1em] uppercase text-text-muted mt-0.5">
                        {item.items.company_account?.title || "Harmain Direct"}
                    </p>
                </div>

                <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex flex-col items-end">
                        <span className="font-mono-jet text-[8px] tracking-[0.1em] uppercase text-text-muted font-bold">
                            {isGroup ? "Ctn Rate" : "Rate"}
                        </span>
                        <span className="font-mono-jet font-bold text-text-primary text-[15px]">Rs.{item.pack_ctn.toLocaleString()}</span>
                    </div>
                    {isGroup && (
                        <div className="flex flex-col items-end">
                            <span className="font-mono-jet text-[8px] tracking-[0.1em] uppercase text-text-muted font-bold">Loose Rate</span>
                            <span className="font-mono-jet font-bold text-text-primary text-[15px]">Rs.{item.loos_ctn.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="flex flex-col items-end">
                        <span className="font-mono-jet text-[8px] tracking-[0.1em] uppercase text-text-muted font-bold">M.R.P</span>
                        <span className="font-mono-jet font-bold text-text-primary text-[15px]">Rs.{item.mrp.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {item.scheme && (
                            <Badge className="bg-amber/10 text-amber border-amber/20 h-7 hidden md:flex items-center">
                                <Sparkles className="w-3 h-3 mr-1.5" />
                                <span className="text-[10px] font-bold">{item.scheme}</span>
                            </Badge>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function EmptyState() {
    return (
        <div className="py-24 flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 bg-surface-2 border border-border rounded-3xl flex items-center justify-center shadow-inner group">
                <Search className="w-8 h-8 text-text-muted animate-pulse" />
            </div>
            <div>
                <h3 className="font-display font-black text-[22px] uppercase tracking-[0.1em] text-text-secondary">
                    No Offers Match
                </h3>
                <p className="text-[13px] text-text-muted mt-2 max-w-xs mx-auto font-medium">
                    Try adjusting your search criteria or explore other categories.
                </p>
            </div>
        </div>
    );
}

function SiteFooter() {
    return (
        <footer className="bg-surface-1 border-t border-border pt-16 pb-8 px-5 relative overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber/[0.03] rounded-full blur-[120px] -z-10" />
            
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <div className="flex gap-2 items-center">
                            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-surface-2 border border-border">
                                <img src="/storage/img/favicon.png" className="size-6 object-contain" alt="Favicon" />
                            </div>
                            <div className="grid flex-1 text-left leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-display font-black text-xl tracking-tight">Harmain</span> 
                                    <span className="font-display font-black text-amber text-xl tracking-tight">Traders</span>
                                </div>
                                <span className="text-[10px] font-mono-jet uppercase tracking-[0.2em] text-text-muted leading-none">Wholesale & Supply Chain</span>
                            </div>
                        </div>
                        <p className="text-[13px] text-text-muted leading-relaxed max-w-xs font-medium">
                            Premium procurement engine for retail giants and independent traders across Pakistan.
                        </p>
                        <div className="flex items-center gap-3">
                            {[
                                { icon: Facebook, href: "#" },
                                { icon: Instagram, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Linkedin, href: "#" }
                            ].map((social, i) => (
                                <a 
                                    key={i} 
                                    href={social.href} 
                                    className="w-9 h-9 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text-muted hover:text-amber hover:border-amber/30 hover:scale-110 transition-all duration-300"
                                >
                                    <social.icon className="w-4.5 h-4.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Reach Us Section */}
                    <div>
                        <h5 className="font-display font-black text-[12px] uppercase tracking-[0.15em] text-text-primary mb-7 flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-amber" /> Reach Us
                        </h5>
                        <div className="space-y-5">
                            <div className="group cursor-pointer">
                                <p className="text-[10px] font-mono-jet uppercase text-text-muted mb-1 tracking-wider">Mobile Support</p>
                                <span className="text-sm font-bold text-text-secondary group-hover:text-amber transition-colors">0332 3218684</span>
                            </div>
                            <div className="group cursor-pointer">
                                <p className="text-[10px] font-mono-jet uppercase text-text-muted mb-1 tracking-wider">Head Office</p>
                                <span className="text-sm font-bold text-text-secondary group-hover:text-amber transition-colors">021 32401607</span>
                            </div>
                            <div className="group cursor-pointer">
                                <p className="text-[10px] font-mono-jet uppercase text-text-muted mb-1 tracking-wider">Email Support</p>
                                <span className="text-sm font-bold text-text-secondary group-hover:text-amber transition-colors flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" /> info@harmaintraders.com
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Logistics Section */}
                    <div>
                        <h5 className="font-display font-black text-[12px] uppercase tracking-[0.15em] text-text-primary mb-7 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-amber" /> Logistics
                        </h5>
                        <div className="space-y-4">
                            <p className="text-[13px] text-text-muted leading-relaxed font-medium bg-surface-2/50 border border-border/50 p-4 rounded-2xl italic">
                                1st Floor, Marvi Market, <br />
                                Katchi Gali No.1 Denso Hall, <br />
                                Karachi, Pakistan
                            </p>
                            <div className="flex items-center gap-3 text-[11px] font-bold text-amber/80 uppercase tracking-widest">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                                Hub Center Karachi
                            </div>
                        </div>
                    </div>

                    {/* Navigation Section */}
                    <div>
                        <h5 className="font-display font-black text-[12px] uppercase tracking-[0.15em] text-text-primary mb-7 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber" /> System
                        </h5>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            {['Offers', 'Catalog', 'Logistics', 'Support', 'Firms', 'Taxes'].map((link) => (
                                <a key={link} href="#" className="text-[13px] text-text-muted hover:text-amber transition-colors font-medium flex items-center gap-1.5 group">
                                    <div className="w-1.5 h-[1px] bg-border group-hover:bg-amber group-hover:w-3 transition-all" />
                                    {link}
                                </a>
                            ))}
                        </div>
                        <div className="mt-8 p-3 rounded-xl bg-surface-2 border border-dashed border-border flex items-center justify-center gap-3">
                             <div className="text-right">
                                <p className="text-[10px] font-mono-jet uppercase font-black text-text-primary">Server Status</p>
                                <p className="text-[8px] font-mono-jet uppercase text-emerald-500 font-bold">Systems Operational</p>
                             </div>
                             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="font-mono-jet text-[10px] text-text-muted tracking-[0.1em] font-black uppercase">
                            © 2026 HARMAIN TRADERS <span className="mx-2 opacity-20 hidden md:inline">·</span> ALL RIGHTS RESERVED
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-2 border border-border">
                            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            <p className="font-mono-jet text-[9px] text-text-secondary tracking-[0.1em] font-black uppercase flex items-center gap-1.5">
                                Hand crafted with 
                                <img src="/images/favicon.png" className="w-3.5 h-3.5 object-contain grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Aishtycoons" />
                                <span className="text-amber">Aishtycoons</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
