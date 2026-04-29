import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
    CalendarIcon, 
    Search, 
    Printer, 
    Wallet, 
    LayoutDashboard, 
    ChevronRight, 
    Filter, 
    Package,
    Building2,
    Check,
    ChevronDown,
    MapPin,
    Map,
    UserCheck,
    User
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ItemSelectionDialog } from './ItemSelectionDialog';
import { AccountSelectionDialog } from '../../accounts/components/AccountSelectionDialog';
import { PurchaseReportSectionDialog } from './PurchaseReportSectionDialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { purchaseReports } from '../constants/purchaseReports';

interface PurchaseParameterFormProps {
    data: any;
    setData: (data: any) => void;
    bootstrap: {
        accounts: any[];
        items: any[];
        firms: any[];
        areas: any[];
        sub_areas: any[];
        categories: any[];
        salesmen: any[];
        users: any[];
    };
    onExecute: () => void;
}

const SearchableSelect = ({ value, onValueChange, options, placeholder, emptyMessage }: any) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    
    const filteredOptions = options.filter((opt: any) => 
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedOption = options.find((opt: any) => opt.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={open}
                    className="h-10 w-full bg-surface-0/60 border-border/20 rounded-sm text-[11px] font-bold uppercase tracking-tight justify-between hover:bg-surface-0/80 transition-all group"
                >
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                    <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", open && "rotate-180")} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 bg-surface-1 border-border/40 shadow-2xl z-[100]" align="start">
                <div className="flex flex-col">
                    <div className="p-2 border-b border-border/10 flex items-center gap-2 bg-surface-0/40">
                        <Search className="h-3.5 w-3.5 text-emerald-500/50" />
                        <Input 
                            placeholder="Filter..." 
                            className="h-7 border-none bg-transparent text-[10px] uppercase font-black focus-visible:ring-0 p-0" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
                        {filteredOptions.length === 0 && (
                            <div className="p-4 text-[9px] font-black text-text-muted text-center uppercase tracking-widest opacity-40">No results found</div>
                        )}
                        {filteredOptions.map((opt: any) => (
                            <button
                                key={opt.value}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded-sm flex items-center justify-between hover:bg-emerald-500/10 hover:text-emerald-500 transition-all group/item",
                                    value === opt.value ? "bg-emerald-500/10 text-emerald-500" : "text-text-muted"
                                )}
                                onClick={() => {
                                    onValueChange(opt.value);
                                    setOpen(false);
                                    setSearch('');
                                }}
                            >
                                <span className="truncate pr-4">{opt.label}</span>
                                {value === opt.value && <Check className="h-3 w-3 shrink-0" />}
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export function PurchaseParameterForm({ data, setData, bootstrap, onExecute }: PurchaseParameterFormProps) {
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const selectedAccountData = data.accountId !== 'ALL' 
        ? bootstrap.accounts.find(acc => acc.id.toString() === data.accountId) 
        : null;
    const selectedItemData = data.itemId !== 'ALL'
        ? bootstrap.items.find(item => item.id.toString() === data.itemId)
        : null;
    const selectedReportData = purchaseReports.find(rep => rep.id === data.reportId);

    return (
        <div className="space-y-4">
            {/* Header Command Bar */}
            <Card className="p-2 bg-card/40 backdrop-blur-3xl border-border/50 shadow-xl rounded-sm overflow-visible ring-1 ring-border/5">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
                    
                    {/* Compact Inline Date Range */}
                    <div className="flex items-center gap-1 bg-surface-1/50 p-1 rounded-sm border border-border/40 flex-1 min-w-[320px]">
                        <div className="flex items-center gap-2 px-3 border-r border-border/40">
                             <CalendarIcon className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex flex-1 items-center gap-0.5 justify-center">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-9 px-3 text-[11px] font-bold text-text-primary hover:bg-surface-0 shadow-none rounded-sm">
                                        {format(data.fromDate, "dd MMM yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-sm overflow-hidden" align="start">
                                    <Calendar mode="single" selected={data.fromDate} onSelect={(date) => handleChange('fromDate', date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <div className="h-px w-2 bg-border/40" />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-9 px-3 text-[11px] font-bold text-text-primary hover:bg-surface-0 shadow-none rounded-sm">
                                        {format(data.toDate, "dd MMM yyyy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-sm overflow-hidden" align="start">
                                    <Calendar mode="single" selected={data.toDate} onSelect={(date) => handleChange('toDate', date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Account Selector (Supplier) */}
                    <button 
                        onClick={() => setIsAccountDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-surface-1/30 border border-border/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 p-1.5 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-emerald-500/10 transition-all border border-border/10">
                            <Wallet className="h-4 w-4 text-text-muted group-hover:text-emerald-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Supplier Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {data.accountId === 'ALL' ? 'All Active Suppliers' : (selectedAccountData ? selectedAccountData.title : 'All Active Suppliers')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/30 mr-1 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Item Selector */}
                    <button 
                        onClick={() => setIsItemDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-surface-1/30 border border-border/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 p-1.5 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-emerald-500/10 transition-all border border-border/10">
                            <Package className="h-4 w-4 text-text-muted group-hover:text-emerald-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Item Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                {data.itemId === 'ALL' ? 'All Products' : (selectedItemData ? selectedItemData.title : 'All Products')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/30 mr-1 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Report Selection Trigger */}
                    <button 
                        onClick={() => setIsReportDialogOpen(true)}
                        className="flex-1 min-w-[240px] group flex items-center gap-3 bg-text-primary border border-text-primary/10 hover:opacity-90 p-1.5 rounded-sm transition-all text-left shadow-lg"
                    >
                        <div className="h-9 w-9 bg-background/20 rounded-sm flex items-center justify-center border border-background/10">
                            <LayoutDashboard className="h-3.5 w-3.5 text-background" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-background/40 leading-none mb-1 whitespace-nowrap">Report Module</span>
                             <span className="text-[11px] font-bold text-background truncate">
                                {selectedReportData ? selectedReportData.title : 'Purchase Analysis'}
                             </span>
                        </div>
                        <Filter className="h-3.5 w-3.5 text-background/20 mr-2" />
                    </button>

                    {/* Execute Primary Button */}
                    <Button 
                        onClick={onExecute}
                        className="h-14 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm flex items-center gap-3 group transition-all duration-300 shadow-lg shadow-emerald-500/20 active:scale-[0.98] border border-white/10 relative overflow-hidden shrink-0"
                    >
                        <Search className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="font-black uppercase tracking-widest relative z-10 text-xs">Execute</span>
                    </Button>
                </div>
            </Card>

            {/* Advance Filters Toggle */}
            <div className="flex justify-center -mb-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="h-6 gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-emerald-500 hover:bg-transparent"
                >
                    <div className="h-px w-8 bg-border/40" />
                    {showAdvanced ? 'Collapse Parameters' : 'Advanced Parameters'}
                    <div className="h-px w-8 bg-border/40" />
                </Button>
            </div>

            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card className="p-8 bg-surface-1/60 border-border/40 shadow-2xl mt-4 rounded-sm backdrop-blur-3xl ring-1 ring-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/40" />
                            
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
                                
                                {/* Entity & Region */}
                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-emerald-500/10 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-emerald-500" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Entity & Region</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest ml-1">Business Firm</Label>
                                            <SearchableSelect 
                                                value={data.firmId} 
                                                onValueChange={(v: string) => handleChange('firmId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL FIRMS' },
                                                    ...(bootstrap.firms || []).map(f => ({ value: f.id.toString(), label: f.name || f.title }))
                                                ]}
                                                placeholder="Select Firm"
                                                emptyMessage="No firms found"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest ml-1">Region / Area</Label>
                                            <SearchableSelect 
                                                value={data.areaId} 
                                                onValueChange={(v: string) => handleChange('areaId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL AREAS' },
                                                    ...(bootstrap.areas || []).map(a => ({ value: a.id.toString(), label: a.name }))
                                                ]}
                                                placeholder="Select Area"
                                                emptyMessage="No areas found"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest ml-1">Sub Area</Label>
                                            <SearchableSelect 
                                                value={data.subAreaId} 
                                                onValueChange={(v: string) => handleChange('subAreaId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL SUB AREAS' },
                                                    ...(bootstrap.sub_areas || []).map(a => ({ value: a.id.toString(), label: a.name }))
                                                ]}
                                                placeholder="Select Sub Area"
                                                emptyMessage="No sub areas found"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Personnel & Product */}
                                <div className="space-y-6 lg:col-span-3">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-indigo-500/10 flex items-center justify-center">
                                            <Package className="h-4 w-4 text-indigo-500" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Product & Personnel</h4>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Item Category</Label>
                                            <SearchableSelect 
                                                value={data.categoryId} 
                                                onValueChange={(v: string) => handleChange('categoryId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL CATEGORIES' },
                                                    ...(bootstrap.categories || []).map(c => ({ value: c.id.toString(), label: c.title || c.name }))
                                                ]}
                                                placeholder="Select Category"
                                                emptyMessage="No categories found"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Purchasing Agent</Label>
                                            <SearchableSelect 
                                                value={data.salesmanId} 
                                                onValueChange={(v: string) => handleChange('salesmanId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL AGENTS' },
                                                    ...(bootstrap.salesmen || []).map(s => ({ value: s.id.toString(), label: s.name }))
                                                ]}
                                                placeholder="Select Agent"
                                                emptyMessage="No agents found"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest ml-1">Input By (User)</Label>
                                            <SearchableSelect 
                                                value={data.userId} 
                                                onValueChange={(v: string) => handleChange('userId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL USERS' },
                                                    ...(bootstrap.users || []).map(u => ({ value: u.id.toString(), label: u.name }))
                                                ]}
                                                placeholder="Select User"
                                                emptyMessage="No users found"
                                            />
                                        </div>
                                    </div>
                                </div>
                             </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selection Dialogs */}
            <AccountSelectionDialog 
                open={isAccountDialogOpen}
                onOpenChange={setIsAccountDialogOpen}
                accounts={bootstrap.accounts}
                selectedAccountId={data.accountId}
                onSelect={(id) => handleChange('accountId', id)}
            />

            <ItemSelectionDialog
                open={isItemDialogOpen}
                onOpenChange={setIsItemDialogOpen}
                items={bootstrap.items}
                selectedItemId={data.itemId}
                onSelect={(id) => handleChange('itemId', id)}
            />

            <PurchaseReportSectionDialog 
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                onSelect={(id) => handleChange('reportId', id)}
                currentReportId={data.reportId}
            />
        </div>
    );
}
