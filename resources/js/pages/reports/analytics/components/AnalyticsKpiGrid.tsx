import React from 'react';
import { Card } from '@/components/ui/card';
import { 
    TrendingUp, 
    TrendingDown, 
    DollarSign, 
    ShoppingCart, 
    Package, 
    Users, 
    Boxes, 
    AlertTriangle, 
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    Calendar,
    ArrowRightLeft
} from 'lucide-react';

interface AnalyticsKpiGridProps {
    reportType: string;
    kpis: any;
}

export const AnalyticsKpiGrid: React.FC<AnalyticsKpiGridProps> = ({ reportType, kpis }) => {
    if (!kpis) return null;

    const fmtNum = (val: number) => {
        if (!val && val !== 0) return '0';
        return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const renderGrowthBadge = (growth: number, label: string = "vs prev period") => {
        const isPositive = growth >= 0;
        return (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-tight ${
                isPositive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{isPositive ? '+' : ''}{growth}%</span>
                <span className="text-[9px] font-normal opacity-75">{label}</span>
            </div>
        );
    };

    if (reportType === 'sales') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales Revenue */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Sales Revenue</span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black font-mono tracking-tight text-text-primary">
                            Rs {fmtNum(kpis.total_sales)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            {renderGrowthBadge(kpis.revenue_growth)}
                            <span className="text-[10px] font-semibold text-text-muted">Prev: Rs {fmtNum(kpis.total_sales_prev)}</span>
                        </div>
                    </div>
                </Card>

                {/* Total Sales Orders */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Sales Orders</span>
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black font-mono tracking-tight text-text-primary">
                            {fmtNum(kpis.total_orders)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            {renderGrowthBadge(kpis.orders_growth)}
                            <span className="text-[10px] font-semibold text-text-muted">Avg: Rs {fmtNum(kpis.avg_order_value)}</span>
                        </div>
                    </div>
                </Card>

                {/* Top Customer */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Top Customer</span>
                        <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-black tracking-tight text-text-primary truncate" title={kpis.top_customer}>
                            {kpis.top_customer}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-emerald-600">Rs {fmtNum(kpis.top_customer_value)}</span>
                            <span className="text-[10px] font-semibold text-text-muted">Top Contributor</span>
                        </div>
                    </div>
                </Card>

                {/* Top Selling Product */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Top Product</span>
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                            <Package className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-black tracking-tight text-text-primary truncate" title={kpis.top_product}>
                            {kpis.top_product}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-amber-600">Rs {fmtNum(kpis.top_product_value)}</span>
                            <span className="text-[10px] font-semibold text-text-muted">Top Volume</span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (reportType === 'purchase') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Purchase Expense */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Purchases</span>
                        <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black font-mono tracking-tight text-text-primary">
                            Rs {fmtNum(kpis.total_purchases)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            {renderGrowthBadge(kpis.cost_growth)}
                            <span className="text-[10px] font-semibold text-text-muted">Prev: Rs {fmtNum(kpis.total_purchases_prev)}</span>
                        </div>
                    </div>
                </Card>

                {/* Purchase Records */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Purchase Invoices</span>
                        <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                            <ShoppingCart className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-black font-mono tracking-tight text-text-primary">
                            {fmtNum(kpis.total_orders)}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            {renderGrowthBadge(kpis.orders_growth)}
                            <span className="text-[10px] font-semibold text-text-muted">Avg: Rs {fmtNum(kpis.avg_order_value)}</span>
                        </div>
                    </div>
                </Card>

                {/* Top Supplier */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Top Supplier</span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <Building2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-black tracking-tight text-text-primary truncate" title={kpis.top_supplier}>
                            {kpis.top_supplier}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-orange-600">Rs {fmtNum(kpis.top_supplier_value)}</span>
                            <span className="text-[10px] font-semibold text-text-muted">Key Vendor</span>
                        </div>
                    </div>
                </Card>

                {/* Top Purchased Item */}
                <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Top Purchased Item</span>
                        <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600">
                            <Package className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="text-lg font-black tracking-tight text-text-primary truncate" title={kpis.top_product}>
                            {kpis.top_product}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-cyan-600">Rs {fmtNum(kpis.top_product_value)}</span>
                            <span className="text-[10px] font-semibold text-text-muted">High Influx</span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // Stock Analytics KPI
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Stock Valuation */}
            <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Total Stock Value (TP)</span>
                    <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                        <DollarSign className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                        Rs {fmtNum(kpis.total_valuation)}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
                        <span>Total Items: {fmtNum(kpis.total_items)}</span>
                        <span>{fmtNum(kpis.total_stock_pcs)} Pcs</span>
                    </div>
                </div>
            </Card>

            {/* Stock Movement IN vs OUT */}
            <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Period Stock Movement</span>
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                        <ArrowRightLeft className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-3">
                    <div className="flex items-center justify-between text-base font-black font-mono tracking-tight">
                        <span className="text-emerald-600">IN: +{fmtNum(kpis.stock_in_qty)}</span>
                        <span className="text-rose-600">OUT: -{fmtNum(kpis.stock_out_qty)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
                        <span>Net Flow: {fmtNum(kpis.stock_in_qty - kpis.stock_out_qty)} Units</span>
                    </div>
                </div>
            </Card>

            {/* Low Stock Alert */}
            <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Low Stock Items</span>
                    <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-2xl font-black font-mono tracking-tight text-amber-600">
                        {kpis.low_stock_count} Items
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
                        <span>Below Reorder Threshold</span>
                    </div>
                </div>
            </Card>

            {/* Out of Stock Alert */}
            <Card className="p-4 bg-surface-1/60 border-border/40 shadow-sm hover:shadow-md transition-all rounded-xl relative overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Out of Stock Items</span>
                    <div className="h-9 w-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                        <XCircle className="h-4 w-4" />
                    </div>
                </div>
                <div className="mt-3">
                    <div className="text-2xl font-black font-mono tracking-tight text-rose-600">
                        {kpis.out_of_stock_count} Items
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-text-muted">
                        <span>Immediate Replenishment Required</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};
