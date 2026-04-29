import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { 
    ChevronDown, 
    Filter, 
    Play, 
    Calendar as CalendarIcon, 
    Layers,
    Warehouse,
    Tag,
    Calculator,
    Eye,
    ChevronRight,
    Package,
    Building2,
    Search,
    Check,
    Loader2,
    Settings
} from 'lucide-react';
import { 
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { 
    Dialog, 
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogHeader
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { stockReports } from '../constants/stockReports';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from 'framer-motion';
import { StockReportSectionDialog } from './StockReportSectionDialog';
import { StockAccountSelectionDialog } from './StockAccountSelectionDialog';
import { StockItemSelectionDialog } from './StockItemSelectionDialog';

interface ParameterFormProps {
    params: any;
    setParams: (params: any) => void;
    onSearch: () => void;
    loading: boolean;
    items: any[];
    companies: any[];
    categories: any[];
    firms: any[];
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
                        <Search className="h-3.5 w-3.5 text-emerald-600/50" />
                        <Input 
                            placeholder="Filter..." 
                            className="h-7 border-none bg-transparent text-[10px] uppercase font-black focus-visible:ring-0 p-0" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-emerald-600/20">
                        {filteredOptions.length === 0 && (
                            <div className="p-4 text-[9px] font-black text-text-muted text-center uppercase tracking-widest opacity-40">No results found</div>
                        )}
                        {filteredOptions.map((opt: any) => (
                            <button
                                key={opt.value}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-[10px] font-bold uppercase rounded-sm flex items-center justify-between hover:bg-emerald-600/10 hover:text-emerald-600 transition-all group/item",
                                    value === opt.value ? "bg-emerald-600/10 text-emerald-600" : "text-text-muted"
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

const ProcessingDialog = ({ open, reportName }: { open: boolean; reportName: string }) => (
    <Dialog open={open}>
        <DialogContent className="sm:max-w-[400px] p-0 border-none bg-transparent shadow-none outline-none overflow-hidden select-none">
            <div className="relative p-12 bg-surface-1/90 backdrop-blur-3xl border border-white/5 rounded-sm flex flex-col items-center justify-center text-center space-y-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Ambient Background Glow */}
                <div className="absolute inset-0 bg-emerald-600/5 animate-pulse rounded-sm" />
                
                <DialogHeader className="sr-only">
                    <DialogTitle>Compiling Stock Matrix</DialogTitle>
                    <DialogDescription>
                        Intelligence Aggregation in Progress for {reportName}
                    </DialogDescription>
                </DialogHeader>

                {/* Industrial Gear Iconography */}
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-600/20 blur-[40px] animate-pulse rounded-full" />
                    <div className="h-24 w-24 bg-emerald-600/10 border border-emerald-600/20 rounded-full flex items-center justify-center relative shadow-inner">
                        <Settings className="h-12 w-12 text-emerald-600 animate-[spin_4s_linear_infinite]" />
                        <Loader2 className="h-16 w-16 text-emerald-600/20 animate-spin absolute" />
                    </div>
                </div>

                <div className="space-y-3 relative">
                    <h3 className="text-md font-black text-text-primary uppercase tracking-[0.4em] italic leading-tight">
                        Compiling <span className="text-emerald-600">Stock Matrix</span>
                    </h3>
                    <div className="flex flex-col space-y-1">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-40">Intelligence Aggregation in Progress</p>
                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest italic">{reportName}</p>
                    </div>
                </div>

                {/* Precise Progress Bar */}
                <div className="w-full max-w-[280px] space-y-3">
                    <div className="h-1.5 w-full bg-surface-0/60 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                    <div className="flex justify-between px-1">
                        <span className="text-[8px] font-black text-emerald-600/40 uppercase tracking-widest animate-pulse">Syncing...</span>
                        <span className="text-[8px] font-black text-emerald-600/40 uppercase tracking-widest animate-pulse">Verifying...</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <p className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.5em]">
                        Aggregation Engine Active
                    </p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
);

export function ParameterForm({ 
    params, 
    setParams, 
    onSearch, 
    loading, 
    items, 
    companies, 
    categories, 
    firms 
}: ParameterFormProps) {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

    const updateParam = (key: string, value: any) => {
        setParams({ ...params, [key]: value });
    };

    const selectedReport = stockReports.find(r => r.id === params.reportId) || stockReports[0];
    const selectedItem = items.find(i => i.id.toString() === params.itemId);
    const selectedCompany = companies.find(c => c.id.toString() === params.companyId);

    return (
        <div className="space-y-4">
            <Card className="p-1.5 bg-surface-1/50 border-border/40 shadow-xl rounded-sm backdrop-blur-md ring-1 ring-border/5">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-1.5">
                    
                    {/* Date Range Selection */}
                    <div className="flex-[1.5] min-w-[320px] flex items-center gap-1 p-1 bg-surface-0/40 rounded-sm border border-border/5">
                        <div className="px-3 flex items-center gap-2 border-r border-border/10">
                            <CalendarIcon className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="flex items-center gap-2 px-2 flex-1">
                            <Input 
                                type="date" 
                                value={params.fromDate} 
                                onChange={(e) => updateParam('fromDate', e.target.value)}
                                className="border-none bg-transparent h-9 text-[11px] font-black uppercase focus-visible:ring-0 w-full cursor-pointer hover:bg-surface-1/50 transition-colors"
                            />
                            <span className="text-[10px] font-black text-text-muted/40">TO</span>
                            <Input 
                                type="date" 
                                value={params.toDate} 
                                onChange={(e) => updateParam('toDate', e.target.value)}
                                className="border-none bg-transparent h-9 text-[11px] font-black uppercase focus-visible:ring-0 w-full cursor-pointer hover:bg-surface-1/50 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Item Selection Dialog Trigger (1) */}
                    <button 
                        onClick={() => setIsItemDialogOpen(true)}
                        className="flex-1 min-w-[200px] group flex items-center gap-3 bg-surface-0/40 border border-border/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 p-1 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-emerald-500/10 transition-all border border-border/10">
                            <Package className="h-4 w-4 text-text-muted group-hover:text-emerald-600" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Product Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-emerald-600 italic">
                                {params.itemId === 'ALL' ? 'All Inventory Items' : (selectedItem?.title || 'Selected Item')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/30 mr-1 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Supplier Selection Dialog Trigger (2) */}
                    <button 
                        onClick={() => setIsAccountDialogOpen(true)}
                        className="flex-1 min-w-[200px] group flex items-center gap-3 bg-surface-0/40 border border-border/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 p-1 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-emerald-500/10 transition-all border border-border/10">
                            <Building2 className="h-4 w-4 text-text-muted group-hover:text-emerald-600" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Supplier Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-emerald-600 italic">
                                {params.companyId === 'ALL' ? 'All Active Suppliers' : (selectedCompany?.title || 'Selected Supplier')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/30 mr-1 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Report Type Dialog Trigger (3) */}
                    <button 
                        onClick={() => setIsReportDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-emerald-600 border border-emerald-700 hover:opacity-90 p-1 rounded-sm transition-all text-left shadow-lg"
                    >
                        <div className="h-9 w-9 bg-white/20 rounded-sm flex items-center justify-center border border-white/10">
                            <Layers className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/40 leading-none mb-1">Stock Dimension</span>
                             <span className="text-[11px] font-bold text-white truncate italic">
                                {selectedReport.title}
                             </span>
                        </div>
                        <Filter className="h-3 w-3 text-white/30 mr-2" />
                    </button>

                    {/* Quick Filters Toggle */}
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className={cn("h-12 w-12 rounded-sm border border-border/10 hover:bg-emerald-600/10 hover:text-emerald-600 transition-all", isAdvancedOpen ? "bg-emerald-600/10 text-emerald-600" : "bg-surface-0/40")}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>

                    {/* Execute Button */}
                    <Button 
                        onClick={onSearch}
                        disabled={loading}
                        className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm font-black uppercase tracking-[0.2em] italic text-[11px] flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
                    >
                        {loading ? <span className="animate-pulse">Analyzing...</span> : <><Search className="h-4 w-4" /> Execute</>}
                    </Button>
                </div>
            </Card>

            {/* Advanced Parameters Toggle Badge */}
            <div className="flex justify-center -mb-6">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="h-6 gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-emerald-600 hover:bg-transparent"
                >
                    <div className="h-px w-8 bg-border/40" />
                    {isAdvancedOpen ? 'Collapse Configuration' : 'Advanced Configuration'}
                    <div className="h-px w-8 bg-border/40" />
                </Button>
            </div>

            {/* Advanced Parameters */}
            <AnimatePresence>
                {isAdvancedOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: -20 }}
                        animate={{ height: 'auto', opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "circOut" }}
                        className="overflow-hidden"
                    >
                        <Card className="p-8 bg-surface-1/60 border-border/40 shadow-2xl mt-8 rounded-sm backdrop-blur-3xl ring-1 ring-white/5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600/40" />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
                                
                                {/* 1. Entity Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-emerald-600/10 flex items-center justify-center">
                                            <Warehouse className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Area & Firm</h4>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest ml-1">Business Firm</Label>
                                            <SearchableSelect 
                                                value={params.firmId} 
                                                onValueChange={(v: string) => updateParam('firmId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL FIRMS' },
                                                    ...firms.map(f => ({ value: f.id.toString(), label: f.title }))
                                                ]}
                                                placeholder="Select Firm"
                                                emptyMessage="No firms found"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest ml-1">Item Category</Label>
                                            <SearchableSelect 
                                                value={params.categoryId} 
                                                onValueChange={(v: string) => updateParam('categoryId', v)}
                                                options={[
                                                    { value: 'ALL', label: 'ALL CATEGORIES' },
                                                    ...categories.map(c => ({ value: c.id.toString(), label: c.title }))
                                                ]}
                                                placeholder="Select Category"
                                                emptyMessage="No categories found"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Valuation Logic */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-blue-600/10 flex items-center justify-center">
                                            <Tag className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Valuation</h4>
                                    </div>
                                    <RadioGroup value={params.valuation} onValueChange={(v) => updateParam('valuation', v)} className="space-y-3.5">
                                        {[
                                            { id: 'last_purchase', label: 'Last Purchase' },
                                            { id: 'average', label: 'Average Rate' },
                                            { id: 'trade_price', label: 'Trade Price' },
                                            { id: 'retail', label: 'Retail Price' }
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center space-x-3 group cursor-pointer">
                                                <RadioGroupItem value={opt.id} id={opt.id} className="border-blue-600/40 text-blue-600 h-4 w-4" />
                                                <Label htmlFor={opt.id} className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-blue-600 cursor-pointer transition-colors leading-none">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>

                                {/* 3. Analytical Calculations */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-indigo-600/10 flex items-center justify-center">
                                            <Calculator className="h-4 w-4 text-indigo-600" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Calculations</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { id: 'remove_zero', label: 'Remove Zero Stock' },
                                            { id: 'show_minus', label: 'Show Negative Stock' },
                                            { id: 'reorder_level', label: 'Below Re-Order Level' },
                                            { id: 'dead_stock', label: 'Include Dead Items' }
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center space-x-4 group">
                                                <Checkbox 
                                                    id={opt.id} 
                                                    checked={params[opt.id]} 
                                                    onCheckedChange={(checked) => updateParam(opt.id, checked)}
                                                    className="h-4 w-4 rounded-none border-indigo-600/30 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all"
                                                />
                                                <Label htmlFor={opt.id} className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-indigo-600 cursor-pointer transition-colors leading-none">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Multi-Tier Pricing Display */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-amber-600/10 flex items-center justify-center">
                                            <Filter className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Prices Display</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                        {[
                                            { id: 'showTP', label: 'Trade Price' },
                                            { id: 'showRetail', label: 'Retail' },
                                            { id: 'showPT2', label: 'PT 2' },
                                            { id: 'showPT3', label: 'PT 3' },
                                            { id: 'showPT4', label: 'PT 4' },
                                            { id: 'showPT5', label: 'PT 5' },
                                            { id: 'showPT6', label: 'PT 6' },
                                            { id: 'showPT7', label: 'PT 7' }
                                        ].map(opt => (
                                            <div key={opt.id} className="flex items-center space-x-3 group">
                                                <Checkbox 
                                                    id={opt.id} 
                                                    checked={params[opt.id]} 
                                                    onCheckedChange={(checked) => updateParam(opt.id, checked)}
                                                    className="h-3.5 w-3.5 rounded-none border-amber-600/30 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                                />
                                                <Label htmlFor={opt.id} className="text-[9px] font-black uppercase tracking-tighter text-text-muted group-hover:text-amber-600 cursor-pointer transition-colors leading-none">{opt.label}</Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 5. System Visibility */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 border-b border-border/10 pb-3">
                                        <div className="h-8 w-8 rounded-sm bg-emerald-600/10 flex items-center justify-center">
                                            <Eye className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <h4 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] italic">Visibility</h4>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-3 bg-surface-0/40 border border-border/10 rounded-sm hover:border-emerald-600/30 transition-all cursor-pointer group">
                                            <Label className="text-[10px] font-black text-text-muted uppercase tracking-widest group-hover:text-emerald-600 cursor-pointer">Show Amounts</Label>
                                            <Checkbox 
                                                checked={params.withAmount} 
                                                onCheckedChange={(v) => updateParam('withAmount', v)}
                                                className="h-4 w-4 border-emerald-600/40 rounded-none data-[state=checked]:bg-emerald-600"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest ml-1">Dead Stock Ref.</Label>
                                            <div className="relative">
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted/40" />
                                                <Input 
                                                    type="date" 
                                                    value={params.deadStockDate} 
                                                    onChange={(e) => updateParam('deadStockDate', e.target.value)}
                                                    className="h-10 pl-10 text-[11px] font-bold uppercase bg-surface-0/60 border-border/20 rounded-sm focus-visible:ring-emerald-600/20"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selection Dialogs */}
            <StockReportSectionDialog 
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                onSelect={(id) => updateParam('reportId', id)}
                currentReportId={params.reportId}
            />

            <StockAccountSelectionDialog 
                open={isAccountDialogOpen}
                onOpenChange={setIsAccountDialogOpen}
                accounts={companies}
                selectedAccountId={params.companyId}
                onSelect={(id) => updateParam('companyId', id)}
            />

            <StockItemSelectionDialog
                open={isItemDialogOpen}
                onOpenChange={setIsItemDialogOpen}
                items={items}
                selectedItemId={params.itemId}
                onSelect={(id) => updateParam('itemId', id)}
            />

            <ProcessingDialog 
                open={loading} 
                reportName={selectedReport.title} 
            />
        </div>
    );
}
