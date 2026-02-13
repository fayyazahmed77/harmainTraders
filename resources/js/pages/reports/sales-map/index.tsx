import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import * as React from "react"
import { Head } from "@inertiajs/react"
import {
    Map as MapIcon,
    Maximize2,
    Minimize2,
    LocateFixed,
    Search,
    ChevronRight,
    TrendingUp,
    MapPin,
    Database
} from "lucide-react"

// Dynamic import for the Map component to avoid SSR/Lifecycle issues
const SalesMap = React.lazy(() => import('./SalesMap'));

interface LocationData {
    id: number;
    name: string;
    latitude: string | null;
    longitude: string | null;
    sales_count: number;
    total_amount: string | number;
    province_id?: number;
    city_id?: number;
    area_id?: number;
}

interface PageProps {
    provinces: any[];
    cities: any[];
}

export default function SalesMapReport({ provinces, cities }: PageProps) {
    const [level, setLevel] = React.useState<'country' | 'province' | 'city' | 'area' | 'subarea'>('country');
    const [data, setData] = React.useState<LocationData[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [center, setCenter] = React.useState<[number, number]>([30.3753, 69.3451]); // Pakistan center
    const [zoom, setZoom] = React.useState(6);
    const [isClient, setIsClient] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const fetchData = async (currentLevel: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/reports/sales-map/data?level=${currentLevel}`);
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error("Error fetching map data:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData(level);
    }, [level]);

    const formatCurrency = (amount: string | number) => {
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleLocationClick = (loc: LocationData) => {
        if (loc.latitude && loc.longitude) {
            setCenter([parseFloat(loc.latitude), parseFloat(loc.longitude)]);
            setZoom(level === 'province' ? 10 : level === 'city' ? 13 : 15);

            // Optional: Auto drill down
            // if (level === 'province') setLevel('city');
        }
    };

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalSales = data.reduce((acc, curr) => acc + curr.sales_count, 0);
    const totalRevenue = data.reduce((acc, curr) => acc + (typeof curr.total_amount === 'string' ? parseFloat(curr.total_amount) : curr.total_amount), 0);

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <Head title="Sales Map Report" />

                <div className="flex flex-col h-[calc(100vh-theme(spacing.12))] overflow-hidden bg-gray-50 dark:bg-gray-950">
                    {/* Header Controls */}
                    <div className="p-4 border-b bg-white dark:bg-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl shadow-sm border border-orange-100 dark:border-orange-800">
                                <MapIcon className="w-5 h-5 text-[#F54A00]" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">Geo-Sales Intelligence</h1>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Real-time geographic performance monitoring</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="hidden lg:flex items-center gap-6 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Sales</p>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{totalSales}</p>
                                </div>
                                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                                <div className="text-center">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Revenue</p>
                                    <p className="text-sm font-black text-[#F54A00]">{formatCurrency(totalRevenue)}</p>
                                </div>
                            </div>

                            <div className="flex bg-gray-200 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-300 dark:border-gray-700 shadow-inner w-full md:w-auto">
                                {(['country', 'province', 'city', 'area', 'subarea'] as const).map((lvl) => (
                                    <Button
                                        key={lvl}
                                        variant={level === lvl ? "default" : "ghost"}
                                        size="sm"
                                        style={level === lvl ? { backgroundColor: '#F54A00' } : {}}
                                        className={`capitalize h-8 px-4 text-xs font-bold transition-all duration-200 ${level === lvl ? 'hover:bg-[#D43F00] text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                                        onClick={() => setLevel(lvl)}
                                    >
                                        {lvl}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-1 overflow-hidden relative">
                        {/* Left Sidebar - Sales List */}
                        <div className="w-80 border-r bg-white dark:bg-gray-900 flex flex-col shadow-2xl z-10">
                            <div className="p-4 border-b space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={`Filter ${level}s...`}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none bg-gray-50/50 dark:bg-gray-800/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                                {loading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : filteredData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-center space-y-2 opacity-50">
                                        <Database className="w-8 h-8 text-gray-400" />
                                        <p className="text-sm font-bold text-gray-500 italic">No data matched your criteria</p>
                                    </div>
                                ) : filteredData.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleLocationClick(item)}
                                        className={`group p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${center[0] === parseFloat(item.latitude || '0') && center[1] === parseFloat(item.longitude || '0') ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 ring-1 ring-orange-500/20' : 'border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-orange-50/30 dark:hover:bg-orange-900/5 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md'}`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-[#F54A00] transition-colors">{item.name}</h3>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 border-none">
                                                        {item.sales_count} Transactions
                                                    </Badge>
                                                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Active
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-gray-900 dark:text-white">{formatCurrency(item.total_amount)}</p>
                                                <ChevronRight className={`w-4 h-4 mt-2 ml-auto text-gray-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-orange-500 ${center[0] === parseFloat(item.latitude || '0') ? 'text-orange-500 translate-x-1' : ''}`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Content - Map */}
                        <div className="flex-1 relative z-0">
                            {isClient ? (
                                <React.Suspense fallback={<div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center font-bold text-gray-400">Initializing Core Map...</div>}>
                                    <SalesMap
                                        data={data}
                                        center={center}
                                        zoom={zoom}
                                        level={level}
                                        formatCurrency={formatCurrency}
                                        onLocationClick={handleLocationClick}
                                    />
                                </React.Suspense>
                            ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center font-bold text-gray-400">Loading Geospatial Engine...</div>
                            )}

                            {/* Custom Overlays on Map */}
                            <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-3">
                                <Card className="p-1.5 shadow-2xl border border-white/50 bg-white/80 backdrop-blur-xl dark:bg-gray-900/80 dark:border-gray-800/50 rounded-2xl overflow-hidden">
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30 transition-all active:scale-90" onClick={() => setZoom(z => z + 1)}>
                                            <Maximize2 className="h-5 w-5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30 transition-all active:scale-90" onClick={() => setZoom(z => z - 1)}>
                                            <Minimize2 className="h-5 w-5" />
                                        </Button>
                                        <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 mx-2 my-1" />
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/30 transition-all active:scale-90" onClick={() => { setCenter([30.3753, 69.3451]); setZoom(6); }}>
                                            <LocateFixed className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </Card>
                            </div>

                            {/* Legend / Info Overlay */}
                            <div className="absolute bottom-6 left-6 z-[1000]">
                                <Card className="px-4 py-3 shadow-2xl border-none bg-white/90 backdrop-blur-md dark:bg-gray-900/90 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">
                                            Current Focus: <span className="text-[#F54A00]">{level} level distribution</span>
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Global CSS for Leaflet Popups */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .leaflet-popup-content-wrapper {
                        border-radius: 16px !important;
                        padding: 0 !important;
                        overflow: hidden !important;
                        box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                    }
                    .leaflet-popup-content {
                        margin: 0 !important;
                    }
                    .leaflet-popup-tip {
                        box-shadow: none !important;
                    }
                `}} />
            </SidebarInset>
        </SidebarProvider>
    )
}
