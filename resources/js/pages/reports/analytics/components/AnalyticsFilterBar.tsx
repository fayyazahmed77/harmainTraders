import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Filter, RefreshCcw, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface AnalyticsFilterBarProps {
    filters: any;
    onFilterChange: (newFilters: any) => void;
    companies: any[];
    customers: any[];
    suppliers: any[];
    categories: any[];
    firms: any[];
    items: any[];
    loading?: boolean;
}

const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
};

const formatLocalDate = (date: Date | undefined) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
    filters,
    onFilterChange,
    companies,
    customers,
    suppliers,
    categories,
    firms,
    items,
    loading = false
}) => {
    const [openFrom, setOpenFrom] = useState(false);
    const [openTo, setOpenTo] = useState(false);

    const updateFilter = (key: string, val: any) => {
        onFilterChange({ ...filters, [key]: val });
    };

    const applyPreset = (preset: string) => {
        const today = new Date();
        let from = today;
        let to = today;

        switch (preset) {
            case 'today':
                from = today;
                to = today;
                break;
            case 'yesterday':
                from = subDays(today, 1);
                to = subDays(today, 1);
                break;
            case 'last7':
                from = subDays(today, 6);
                to = today;
                break;
            case 'thisMonth':
                from = startOfMonth(today);
                to = today;
                break;
            case 'lastMonth':
                const lm = subMonths(today, 1);
                from = startOfMonth(lm);
                to = endOfMonth(lm);
                break;
        }

        onFilterChange({
            ...filters,
            fromDate: formatLocalDate(from),
            toDate: formatLocalDate(to),
        });
    };

    return (
        <Card className="p-3 bg-surface-1/60 border-border/40 shadow-sm rounded-xl backdrop-blur-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Date Range Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-widest mr-1">Period:</span>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => applyPreset('today')} 
                        className="h-7 text-[11px] font-bold rounded-lg hover:bg-surface-0"
                    >
                        Today
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => applyPreset('yesterday')} 
                        className="h-7 text-[11px] font-bold rounded-lg hover:bg-surface-0"
                    >
                        Yesterday
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => applyPreset('last7')} 
                        className="h-7 text-[11px] font-bold rounded-lg hover:bg-surface-0"
                    >
                        Last 7 Days
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => applyPreset('thisMonth')} 
                        className="h-7 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20"
                    >
                        This Month
                    </Button>
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => applyPreset('lastMonth')} 
                        className="h-7 text-[11px] font-bold rounded-lg hover:bg-surface-0"
                    >
                        Last Month
                    </Button>
                </div>

                {/* Calendar Date Picker Popovers */}
                <div className="flex items-center gap-2 bg-surface-0/60 p-1 rounded-lg border border-border/30">
                    <CalendarIcon className="h-4 w-4 text-emerald-600 ml-1" />
                    
                    <Popover open={openFrom} onOpenChange={setOpenFrom}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 px-2 text-[11px] font-bold text-text-primary hover:bg-surface-1 shadow-none rounded-md">
                                {format(parseLocalDate(filters.fromDate), "dd MMM yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden z-[100]" align="start">
                            <Calendar 
                                mode="single" 
                                selected={parseLocalDate(filters.fromDate)} 
                                onSelect={(d) => {
                                    if (d) {
                                        updateFilter('fromDate', formatLocalDate(d));
                                        setOpenFrom(false);
                                    }
                                }} 
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>

                    <span className="text-[10px] text-text-muted font-bold">to</span>

                    <Popover open={openTo} onOpenChange={setOpenTo}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" className="h-7 px-2 text-[11px] font-bold text-text-primary hover:bg-surface-1 shadow-none rounded-md">
                                {format(parseLocalDate(filters.toDate), "dd MMM yyyy")}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl overflow-hidden z-[100]" align="start">
                            <Calendar 
                                mode="single" 
                                selected={parseLocalDate(filters.toDate)} 
                                onSelect={(d) => {
                                    if (d) {
                                        updateFilter('toDate', formatLocalDate(d));
                                        setOpenTo(false);
                                    }
                                }} 
                                initialFocus 
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* Select Dropdown Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-border/20">
                {/* Firm Selection */}
                <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Firm</label>
                    <select
                        value={filters.firmId || 'ALL'}
                        onChange={(e) => updateFilter('firmId', e.target.value)}
                        className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">ALL Firms</option>
                        {firms.map((f: any) => (
                            <option key={f.id} value={f.id.toString()}>{f.title}</option>
                        ))}
                    </select>
                </div>

                {/* Company Selection */}
                <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Company</label>
                    <select
                        value={filters.companyId || 'ALL'}
                        onChange={(e) => updateFilter('companyId', e.target.value)}
                        className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">ALL Companies</option>
                        {companies.map((c: any) => (
                            <option key={c.id} value={c.id.toString()}>{c.title}</option>
                        ))}
                    </select>
                </div>

                {/* Category Selection */}
                <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Category</label>
                    <select
                        value={filters.categoryId || 'ALL'}
                        onChange={(e) => updateFilter('categoryId', e.target.value)}
                        className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">ALL Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id.toString()}>{cat.title}</option>
                        ))}
                    </select>
                </div>

                {/* Customer or Supplier Selection */}
                {filters.reportType === 'sales' ? (
                    <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Customer</label>
                        <select
                            value={filters.customerId || 'ALL'}
                            onChange={(e) => updateFilter('customerId', e.target.value)}
                            className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">ALL Customers</option>
                            {customers.map((cust: any) => (
                                <option key={cust.id} value={cust.id.toString()}>{cust.title}</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Supplier</label>
                        <select
                            value={filters.supplierId || 'ALL'}
                            onChange={(e) => updateFilter('supplierId', e.target.value)}
                            className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">ALL Suppliers</option>
                            {suppliers.map((sup: any) => (
                                <option key={sup.id} value={sup.id.toString()}>{sup.title}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Item Selection */}
                <div>
                    <label className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">Item / Product</label>
                    <select
                        value={filters.itemId || 'ALL'}
                        onChange={(e) => updateFilter('itemId', e.target.value)}
                        className="w-full h-8 text-xs font-semibold bg-surface-0 border border-border/30 rounded-lg px-2 text-text-primary focus:outline-none focus:border-emerald-500"
                    >
                        <option value="ALL">ALL Products</option>
                        {items.map((it: any) => (
                            <option key={it.id} value={it.id.toString()}>{it.code ? `[${it.code}] ` : ''}{it.title}</option>
                        ))}
                    </select>
                </div>
            </div>
        </Card>
    );
};
