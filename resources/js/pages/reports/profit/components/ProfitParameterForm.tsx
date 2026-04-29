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
    Hash, 
    Users, 
    MapPin, 
    Filter, 
    Download, 
    Package,
    Settings2,
    Database,
    Tag,
    Boxes,
    FileText,
    ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ItemSelectionDialog } from './ItemSelectionDialog';
import { AccountSelectionDialog } from '../../accounts/components/AccountSelectionDialog';
import { ProfitReportSectionDialog } from './ProfitReportSectionDialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { profitReports } from '../constants/profitReports';

interface ProfitParameterFormProps {
    data: any;
    setData: (data: any) => void;
    bootstrap: {
        accounts: any[];
        items: any[];
        firms: any[];
        salesmen: any[];
        areas: any[];
        subareas: any[];
        accountTypes: any[];
        accountCategories: any[];
        itemCategories: any[];
        users: any[];
    };
    onExecute: () => void;
}

export function ProfitParameterForm({ data, setData, bootstrap, onExecute }: ProfitParameterFormProps) {
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
    const selectedReportData = profitReports.find(rep => rep.id === data.reportId);

    const filterGroup1 = [
        { label: 'Firm', key: 'firmId', options: bootstrap.firms, icon: Building2 },
        { label: 'Salemen', key: 'salemanId', options: bootstrap.salesmen, icon: Users },
        { label: 'Area', key: 'areaId', options: bootstrap.areas, icon: MapPin },
        { label: 'Sub Area', key: 'subareaId', options: bootstrap.subareas, icon: MapPin },
        { label: 'Account Typed', key: 'type', options: bootstrap.accountTypes, icon: Tag },
        { label: 'Account Nature', key: 'nature', options: bootstrap.accountCategories, icon: Filter },
        { label: 'Shelf', key: 'shelfId', options: [], icon: Boxes }, 
        { label: 'Supplier', key: 'supplierId', options: bootstrap.accounts, icon: UserCheck },
    ];

    const filterGroup2 = [
        { label: 'Item Account', key: 'itemAccountId', options: bootstrap.accounts, icon: Wallet },
        { label: 'Godown', key: 'godownId', options: [], icon: Database },
        { label: 'Item Type', key: 'itemType', options: [], icon: Tag },
        { label: 'Item Category', key: 'itemCategoryId', options: bootstrap.itemCategories, icon: Tag },
    ];

    return (
        <div className="space-y-4">
            {/* Header Command Bar - Sharpened Aesthetic */}
            <Card className="p-2 bg-card/40 backdrop-blur-3xl border-border/50 shadow-xl rounded-sm overflow-visible ring-1 ring-border/5">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
                    
                    {/* Compact Inline Date Range */}
                    <div className="flex items-center gap-1 bg-surface-1/50 p-1 rounded-sm border border-border/40 flex-1 min-w-[320px]">
                        <div className="flex items-center gap-2 px-3 border-r border-border/40">
                             <CalendarIcon className="h-4 w-4 text-indigo-500" />
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

                    {/* Account Selector */}
                    <button 
                        onClick={() => setIsAccountDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-surface-1/30 border border-border/40 hover:border-indigo-500/50 hover:bg-indigo-500/5 p-1.5 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-indigo-500/10 transition-all border border-border/10">
                            <Wallet className="h-4 w-4 text-text-muted group-hover:text-indigo-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Account Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {data.accountId === 'ALL' ? 'All Active Accounts' : (selectedAccountData ? selectedAccountData.title : 'All Active Accounts')}
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
                                {selectedReportData ? selectedReportData.title : 'Profit Analysis'}
                             </span>
                        </div>
                        <Filter className="h-3.5 w-3.5 text-background/20 mr-2" />
                    </button>

                    {/* Execute Primary Button */}
                    <Button 
                        onClick={onExecute}
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-sm flex items-center gap-3 group transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98] border border-white/10 relative overflow-hidden shrink-0"
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
                    className="h-6 gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-indigo-500 hover:bg-transparent"
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
                        <Card className="p-6 bg-surface-1/20 backdrop-blur-md border-border/50 shadow-inner rounded-sm">
                             <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                                
                                <div className="xl:col-span-10 space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {filterGroup1.map((filter) => (
                                            <div key={filter.key} className="space-y-1.5 group">
                                                <div className="flex items-center gap-2 ml-1">
                                                    <filter.icon className="h-2.5 w-2.5 text-text-muted/40 group-hover:text-indigo-500 transition-colors" />
                                                    <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">{filter.label}</Label>
                                                </div>
                                                <Select value={data[filter.key]} onValueChange={(v) => handleChange(filter.key, v)}>
                                                    <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary shadow-none hover:border-indigo-400 transition-all rounded-sm">
                                                        <SelectValue placeholder="ALL" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-sm">
                                                        <SelectItem value="ALL">ALL</SelectItem>
                                                        {filter.options?.map((opt: any) => (
                                                            <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name || opt.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {filterGroup2.map((filter) => (
                                            <div key={filter.key} className="space-y-1.5 group">
                                                <div className="flex items-center gap-2 ml-1">
                                                    <filter.icon className="h-2.5 w-2.5 text-text-muted/40 group-hover:text-amber-500 transition-colors" />
                                                    <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">{filter.label}</Label>
                                                </div>
                                                <Select value={data[filter.key]} onValueChange={(v) => handleChange(filter.key, v)}>
                                                    <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary shadow-none hover:border-amber-400 transition-all rounded-sm">
                                                        <SelectValue placeholder="ALL" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-sm">
                                                        <SelectItem value="ALL">ALL</SelectItem>
                                                        {filter.options?.map((opt: any) => (
                                                            <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name || opt.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}

                                        <div className="space-y-1.5 group">
                                            <div className="flex items-center gap-2 ml-1">
                                                <ArrowUpDown className="h-2.5 w-2.5 text-text-muted/40" />
                                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Sort By</Label>
                                            </div>
                                            <Select value={data.sortBy} onValueChange={(v) => handleChange('sortBy', v)}>
                                                <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary rounded-sm">
                                                    <SelectValue placeholder="DATE" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm">
                                                    <SelectItem value="DATE">DATE</SelectItem>
                                                    <SelectItem value="ID">Voucher ID</SelectItem>
                                                    <SelectItem value="REVENUE">Revenue</SelectItem>
                                                    <SelectItem value="PROFIT">Profit</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <div className="flex items-center gap-2 ml-1">
                                                <Settings2 className="h-2.5 w-2.5 text-text-muted/40" />
                                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Formation</Label>
                                            </div>
                                            <Select value={data.formation} onValueChange={(v) => handleChange('formation', v)}>
                                                <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary rounded-sm">
                                                    <SelectValue placeholder="Standard" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm">
                                                    <SelectItem value="Standard">Standard</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5 group">
                                            <div className="flex items-center gap-2 ml-1">
                                                <Users className="h-2.5 w-2.5 text-text-muted/40" />
                                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Input By</Label>
                                            </div>
                                            <Select value={data.userId} onValueChange={(v) => handleChange('userId', v)}>
                                                <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary rounded-sm">
                                                    <SelectValue placeholder="ALL" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm">
                                                    <SelectItem value="ALL">ALL</SelectItem>
                                                    {bootstrap.users.map(u => (
                                                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Control Group - High Contrast */}
                                <div className="xl:col-span-2 space-y-5 bg-surface-1/30 p-5 rounded-sm border border-border/50 shadow-sm">
                                    <div className="space-y-3">
                                        <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-border/20 pb-1">Output Mode</h4>
                                        <RadioGroup value={data.printOn} onValueChange={(v: any) => handleChange('printOn', v)} className="flex flex-col gap-2">
                                            {[
                                                { id: 'screen', label: 'Screen' },
                                                { id: 'pdf', label: 'PDF Report' },
                                                { id: 'printer', label: 'Direct Print' },
                                            ].map(opt => (
                                                <div key={opt.id} className="flex items-center gap-2.5 group/radio cursor-pointer">
                                                    <RadioGroupItem value={opt.id} id={`print-${opt.id}`} className="h-3.5 w-3.5 border-border" />
                                                    <label htmlFor={`print-${opt.id}`} className="text-[10px] font-bold text-text-secondary group-hover/radio:text-text-primary uppercase cursor-pointer">{opt.label}</label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-border/20">
                                        <h4 className="text-[9px] font-black text-text-muted uppercase tracking-widest border-b border-border/20 pb-1">Filter Rules</h4>
                                        <RadioGroup value={data.showOptions} onValueChange={(v: any) => handleChange('showOptions', v)} className="flex flex-col gap-2">
                                            {[
                                                { id: 'all', label: 'ALL Records' },
                                                { id: 'remove_zero', label: 'Hide Zeros' },
                                                { id: 'remove_minus', label: 'Hide Negative' },
                                            ].map(opt => (
                                                <div key={opt.id} className="flex items-center gap-2.5 group/radio cursor-pointer">
                                                    <RadioGroupItem value={opt.id} id={`show-${opt.id}`} className="h-3.5 w-3.5 border-border" />
                                                    <label htmlFor={`show-${opt.id}`} className="text-[10px] font-bold text-text-secondary group-hover/radio:text-text-primary uppercase cursor-pointer">{opt.label}</label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between px-2 py-1.5 bg-indigo-500/10 rounded-sm border border-indigo-500/20">
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Engine v1.0</span>
                                            <Badge variant="outline" className="h-3.5 text-[8px] border-indigo-500/30 text-indigo-500 font-bold px-1 rounded-none">STABLE</Badge>
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

            <ProfitReportSectionDialog 
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                onSelect={(id) => handleChange('reportId', id)}
                currentReportId={data.reportId}
            />
        </div>
    );
}



const Building2 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
);

const UserCheck = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user-check"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
);
