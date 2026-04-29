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
    Undo2, 
    Wallet, 
    LayoutDashboard, 
    ChevronRight, 
    Filter, 
    Package,
    Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ItemSelectionDialog } from '@/pages/reports/purchase/components/ItemSelectionDialog';
import { AccountSelectionDialog } from '@/pages/reports/accounts/components/AccountSelectionDialog';
import { ReturnReportSectionDialog } from '@/pages/reports/purchase-return/components/ReturnReportSectionDialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { purchaseReturnReports } from '@/pages/reports/purchase-return/constants/purchaseReturnReports';

interface ReturnParameterFormProps {
    data: any;
    setData: (data: any) => void;
    bootstrap: {
        accounts: any[];
        items: any[];
        firms: any[];
    };
    onExecute: () => void;
}

export function ReturnParameterForm({ data, setData, bootstrap, onExecute }: ReturnParameterFormProps) {
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
    const selectedReportData = purchaseReturnReports.find(rep => rep.id === data.reportId);

    return (
        <div className="space-y-4">
            {/* Header Command Bar */}
            <Card className="p-2 bg-card/40 backdrop-blur-3xl border-border/50 shadow-xl rounded-sm overflow-visible ring-1 ring-border/5">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
                    
                    {/* Compact Inline Date Range */}
                    <div className="flex items-center gap-1 bg-surface-1/50 p-1 rounded-sm border border-border/40 flex-1 min-w-[320px]">
                        <div className="flex items-center gap-2 px-3 border-r border-border/40">
                             <CalendarIcon className="h-4 w-4 text-rose-500" />
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
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-surface-1/30 border border-border/40 hover:border-rose-500/50 hover:bg-rose-500/5 p-1.5 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-rose-500/10 transition-all border border-border/10">
                            <Wallet className="h-4 w-4 text-text-muted group-hover:text-rose-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Supplier Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                                {data.accountId === 'ALL' ? 'All Active Suppliers' : (selectedAccountData ? selectedAccountData.title : 'All Active Suppliers')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/30 mr-1 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* Item Selector */}
                    <button 
                        onClick={() => setIsItemDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-surface-1/30 border border-border/40 hover:border-rose-500/50 hover:bg-rose-500/5 p-1.5 rounded-sm transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-sm flex items-center justify-center group-hover:bg-rose-500/10 transition-all border border-border/10">
                            <Package className="h-4 w-4 text-text-muted group-hover:text-rose-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-[0.1em] text-text-muted leading-none mb-1">Item Selection</span>
                             <span className="text-[11px] font-bold text-text-primary truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
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
                                {selectedReportData ? selectedReportData.title : 'Return Analysis'}
                             </span>
                        </div>
                        <Filter className="h-3.5 w-3.5 text-background/20 mr-2" />
                    </button>

                    {/* Execute Primary Button */}
                    <Button 
                        onClick={onExecute}
                        className="h-14 px-8 bg-rose-600 hover:bg-rose-500 text-white rounded-sm flex items-center gap-3 group transition-all duration-300 shadow-lg shadow-rose-500/20 active:scale-[0.98] border border-white/10 relative overflow-hidden shrink-0"
                    >
                        <Search className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="font-black uppercase tracking-widest relative z-10 text-xs">Analyze</span>
                    </Button>
                </div>
            </Card>

            {/* Advance Filters Toggle */}
            <div className="flex justify-center -mb-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="h-6 gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-rose-500 hover:bg-transparent"
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
                                        <div className="space-y-1.5 group">
                                            <div className="flex items-center gap-2 ml-1">
                                                <Building2 className="h-2.5 w-2.5 text-text-muted/40 group-hover:text-rose-500 transition-colors" />
                                                <Label className="text-[10px] font-black text-text-muted uppercase tracking-tighter">Firm</Label>
                                            </div>
                                            <Select value={data.firmId} onValueChange={(v) => handleChange('firmId', v)}>
                                                <SelectTrigger className="h-8 w-full bg-surface-0 border-border/50 text-[10px] font-bold text-text-primary shadow-none hover:border-rose-400 transition-all rounded-sm">
                                                    <SelectValue placeholder="ALL" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-sm">
                                                    <SelectItem value="ALL">ALL</SelectItem>
                                                    {bootstrap.firms?.map((opt: any) => (
                                                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name || opt.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar Control Group */}
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

                                    <div className="pt-2">
                                        <div className="flex items-center justify-between px-2 py-1.5 bg-rose-500/10 rounded-sm border border-rose-500/20">
                                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Engine v1.0</span>
                                            <Badge variant="outline" className="h-3.5 text-[8px] border-rose-500/30 text-rose-500 font-bold px-1 rounded-none">STABLE</Badge>
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

            <ReturnReportSectionDialog 
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                onSelect={(id) => handleChange('reportId', id)}
                currentReportId={data.reportId}
            />
        </div>
    );
}
