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
import { CalendarIcon, Search, Printer, Wallet, LayoutDashboard, ChevronRight, Hash, Users, MapPin, Layers, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AccountSelectionDialog } from './AccountSelectionDialog';
import { ReportSectionDialog } from './ReportSectionDialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { reports } from '../constants/reports';

interface ReportParameterFormProps {
    data: any;
    setData: (data: any) => void;
    bootstrap: {
        accounts: any[];
        firms: any[];
        salesmen: any[];
        areas: any[];
        subareas: any[];
        accountTypes: any[];
        accountCategories: any[];
        users: any[];
    };
    onPrint?: () => void;
    onExportPdf?: () => void;
    onExecute: () => void;
}

export function ReportParameterForm({ data, setData, bootstrap, onPrint, onExportPdf, onExecute }: ReportParameterFormProps) {
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (field: string, value: any) => {
        setData((prev: any) => ({ ...prev, [field]: value }));
    };

    const selectedAccountData = data.accountId !== 'ALL' 
        ? bootstrap.accounts.find(acc => acc.id.toString() === data.accountId) 
        : null;
    const selectedReportData = reports.find(rep => rep.id === data.reportId);

    return (
        <div className="space-y-4">
            {/* High-Fidelity Inline Command Bar */}
            <Card className="p-2 bg-card/80 backdrop-blur-xl border-border shadow-sm rounded-xl overflow-visible">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2">
                    
                    {/* Date Block */}
                    <div className="flex items-center gap-1 bg-surface-1/50 p-1 rounded-xl border border-border/50 flex-1 min-w-[300px]">
                        <div className="flex items-center gap-2 px-3 border-r border-border">
                             <CalendarIcon className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="flex flex-1 items-center gap-1 px-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-9 px-2 text-xs font-bold text-text-secondary hover:bg-surface-0 shadow-none truncate">
                                        {format(data.fromDate, "MMM dd, yy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={data.fromDate} onSelect={(date) => handleChange('fromDate', date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <span className="text-text-muted/30 font-bold">→</span>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" className="h-9 px-2 text-xs font-bold text-text-secondary hover:bg-surface-0 shadow-none truncate">
                                        {format(data.toDate, "MMM dd, yy")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={data.toDate} onSelect={(date) => handleChange('toDate', date)} initialFocus />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Account Trigger */}
                    <button 
                        onClick={() => setIsAccountDialogOpen(true)}
                        className="flex-1 min-w-[250px] group flex items-center gap-3 bg-surface-0 border border-border hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 p-1.5 rounded-xl transition-all text-left"
                    >
                        <div className="h-9 w-9 bg-surface-1 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                            <Wallet className="h-4 w-4 text-text-muted group-hover:text-indigo-500" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-widest text-text-muted leading-none mb-0.5">Account Selection</span>
                             <span className="text-xs font-bold text-text-primary truncate group-hover:text-indigo-600">
                                {data.accountId === 'ALL' ? 'All Active Accounts' : (selectedAccountData ? selectedAccountData.title : 'All Active Accounts')}
                             </span>
                        </div>
                        <ChevronRight className="h-3 w-3 text-text-muted/40 mr-2 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Report Trigger */}
                    <button 
                        onClick={() => setIsReportDialogOpen(true)}
                        className="flex-1 min-w-[220px] group flex items-center gap-3 bg-text-primary border border-border/10 hover:opacity-90 p-1.5 rounded-xl transition-all text-left shadow-lg shadow-text-primary/10"
                    >
                        <div className="h-9 w-9 bg-background/20 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="h-4 w-4 text-background/60" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                             <span className="text-[9px] font-black uppercase tracking-widest text-background/40 leading-none mb-0.5 whitespace-nowrap">Report Module</span>
                             <span className="text-xs font-bold text-background truncate">
                                {selectedReportData ? selectedReportData.title : 'Standard Ledger'}
                             </span>
                        </div>
                        <Filter className="h-3.5 w-3.5 text-background/20 mr-2" />
                    </button>

                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                        <Button 
                            variant="outline"
                            size="icon"
                            onClick={onExportPdf}
                            className="h-12 w-12 rounded-xl border-border hover:bg-surface-1 text-text-secondary shadow-sm transition-all"
                            title="Download PDF"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                            variant="outline"
                            size="icon"
                            onClick={onPrint}
                            className="h-12 w-12 rounded-xl border-border hover:bg-surface-1 text-text-secondary shadow-sm transition-all"
                            title="Print Report"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Run Button */}
                    <Button 
                        onClick={onExecute}
                        className="h-14 px-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center gap-3 group transition-all duration-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.6)] active:scale-[0.98] border-t border-white/20 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 group-hover:from-indigo-400 group-hover:to-violet-600 transition-all duration-500" />
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)] mix-blend-overlay transition-opacity duration-500" />
                        <div className="absolute -inset-x-full h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-[30deg] group-hover:animate-[shimmer_2s_infinite] transition-all" />
                        <Search className="h-5 w-5 relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="font-display font-black uppercase tracking-widest relative z-10 text-sm">Execute</span>
                    </Button>
                </div>
            </Card>

            {/* High-Density Advanced Grid Toggle */}
            <div className="flex justify-center">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="h-6 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted hover:text-indigo-500 hover:bg-transparent"
                >
                    {showAdvanced ? 'Collapse Parameters ↑' : 'Advanced Filters ↓'}
                </Button>
            </div>

            <AnimatePresence>
                {showAdvanced && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <Card className="p-4 bg-surface-1/40 backdrop-blur-md border-border/60 shadow-inner rounded-2xl">
                             <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                                
                                {/* Advanced Filters Group 1 */}
                                <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
                                    {[
                                        { label: 'Firm', key: 'firmId', options: bootstrap.firms, icon: Hash },
                                        { label: 'Salesman', key: 'salemanId', options: bootstrap.salesmen, icon: Users },
                                        { label: 'Area', key: 'areaId', options: bootstrap.areas, icon: MapPin },
                                        { label: 'Sub Area', key: 'subareaId', options: bootstrap.subareas, icon: MapPin },
                                        { label: 'Acc Type', key: 'type', options: bootstrap.accountTypes, icon: Layers },
                                        { label: 'Category', key: 'noteHead', options: bootstrap.accountCategories, icon: Filter },
                                        { label: 'Nature', key: 'nature', options: bootstrap.accountCategories, icon: Filter },
                                        { label: 'Contra', key: 'contraId', options: bootstrap.accounts, icon: ArrowLeftRight },
                                    ].map((filter) => (
                                        <div key={filter.key} className="space-y-1">
                                            <div className="flex items-center gap-1 ml-1">
                                                <filter.icon className="h-2.5 w-2.5 text-text-muted/40" />
                                                <Label className="text-[9px] font-black text-text-muted uppercase tracking-tighter">{filter.label}</Label>
                                            </div>
                                            <Select value={data[filter.key]} onValueChange={(v) => handleChange(filter.key, v)}>
                                                <SelectTrigger className="h-7 w-full bg-surface-0 border-border/50 text-[10px] font-bold shadow-none hover:border-indigo-400 transition-colors">
                                                    <SelectValue placeholder="ALL" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">ALL</SelectItem>
                                                    {filter.options.map((opt: any) => (
                                                        <SelectItem key={opt.id} value={opt.id.toString()}>{opt.name || opt.title}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}

                                     <div className="space-y-1">
                                         <div className="flex items-center gap-1 ml-1">
                                            <Search className="h-2.5 w-2.5 text-text-muted/40" />
                                            <Label className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Search Meta</Label>
                                        </div>
                                        <Input 
                                            placeholder="Remarks / Cheque..."
                                            value={data.remarks}
                                            className="h-7 bg-background border-border/50 text-[10px] font-bold shadow-none focus-visible:ring-indigo-500/20"
                                            onChange={(e) => handleChange('remarks', e.target.value)}
                                        />
                                    </div>
                                    
                                     <div className="space-y-1">
                                         <div className="flex items-center gap-1 ml-1">
                                            <Users className="h-2.5 w-2.5 text-text-muted/40" />
                                            <Label className="text-[9px] font-black text-text-muted uppercase tracking-tighter">Sort By</Label>
                                        </div>
                                        <Select value={data.sortBy} onValueChange={(v) => handleChange('sortBy', v)}>
                                            <SelectTrigger className="h-7 w-full bg-surface-0 border-border/50 text-[10px] font-bold shadow-none">
                                                <SelectValue placeholder="INV_DATE" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INV_DATE">INV_DATE</SelectItem>
                                                <SelectItem value="ID">Voucher ID</SelectItem>
                                                <SelectItem value="REMARKS">Remarks</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                </div>

                                {/* Sidebar Settings */}
                                <div className="bg-surface-1/50 p-3 rounded-xl border border-border/40 space-y-4 shadow-sm flex flex-col justify-between">
                                     <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] border-b border-border/20 pb-1">Output Mode</h4>
                                            <RadioGroup value={data.printOn} onValueChange={(v: any) => handleChange('printOn', v)} className="flex flex-col gap-1.5 pt-1">
                                                {['pdf', 'screen', 'printer'].map(opt => (
                                                    <div key={opt} className="flex items-center gap-2">
                                                        <RadioGroupItem value={opt} id={`print-${opt}`} className="h-3 w-3 border-border" />
                                                        <label htmlFor={`print-${opt}`} className="text-[10px] font-bold text-text-secondary uppercase cursor-pointer">{opt}</label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-[9px] font-black text-text-muted uppercase tracking-[0.15em] border-b border-border/20 pb-1">Ledger Logic</h4>
                                            <RadioGroup value={data.dateType} onValueChange={(v: any) => handleChange('dateType', v)} className="flex flex-col gap-1.5 pt-1">
                                                {['invdate', 'cleardate'].map(opt => (
                                                    <div key={opt} className="flex items-center gap-2">
                                                        <RadioGroupItem value={opt} id={`date-${opt}`} className="h-3 w-3 border-border" />
                                                        <label htmlFor={`date-${opt}`} className="text-[10px] font-bold text-text-secondary uppercase cursor-pointer">{opt === 'invdate' ? 'By Invoice' : 'By Clearing'}</label>
                                                    </div>
                                                ))}
                                            </RadioGroup>
                                        </div>
                                     </div>

                                     <div className="pt-2">
                                        <div className="flex items-center justify-between px-2 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">Audit Mode</span>
                                            <Badge variant="outline" className="h-4 text-[8px] bg-card border-indigo-500/30 text-indigo-500 font-bold">STABLE</Badge>
                                        </div>
                                     </div>
                                </div>

                             </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dialogs */}
            <AccountSelectionDialog 
                open={isAccountDialogOpen}
                onOpenChange={setIsAccountDialogOpen}
                accounts={bootstrap.accounts}
                selectedAccountId={data.accountId}
                onSelect={(id) => handleChange('accountId', id)}
            />

            <ReportSectionDialog 
                open={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                onSelect={(id) => handleChange('reportId', id)}
                currentReportId={data.reportId}
            />
        </div>
    );
}

const ArrowLeftRight = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-right"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg>
);
