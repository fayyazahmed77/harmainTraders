"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, ChevronDown, ListPlus, Trash2, Database, Search, RotateCcw } from "lucide-react";
import { router } from "@inertiajs/react";
import axios from "axios";
import { useAppearance } from "@/hooks/use-appearance";

interface Company {
  id: number;
  title: string;
  items_count: number;
}

interface Supplier {
  id: number;
  title: string;
  assigned_companies: Company[];
}

interface OrderItem {
  id: number;
  code: string;
  title: string;
  packing_qty: number;
  stock_1: number;
  stock_2: number;
  reorder_level: number;
  last_purchase_date: string | null;
  last_qty_carton: number;
  last_qty_pcs: number;
  last_purchase_rate: number;
  av_purchase_rate: number;
  last_supplier: string | null;
  
  // Input fields
  input_full: number;
  input_pcs: number;
  input_b_full: number;
  input_b_pcs: number;
  disc_percent: number;
  
  sales_15_days?: number;
  sales_15_full?: number;
  sales_15_pcs?: number;
}

interface Props {
  suppliers: Supplier[];
  companies: Company[];
}

export default function SupplierOrder({ suppliers, companies }: Props) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark';
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [selectionMode, setSelectionMode] = useState<'supplier' | 'company'>('supplier');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  
  const getFifteenDaysAgo = () => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  };

  const getTodayDateString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Fix 4: Format purchase date as "4 July 2026"
  const formatPurchaseDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T00:00:00'); // prevent timezone shift
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const [salesStartDate, setSalesStartDate] = useState(getFifteenDaysAgo());

  const salesDaysCount = useMemo(() => {
    const start = new Date(salesStartDate);
    const today = new Date();
    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    // Use sign to determine if it is in future or past
    const isFuture = start.getTime() > today.getTime();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isFuture ? 0 : diffDays;
  }, [salesStartDate]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [filterMode, setFilterMode] = useState<'reorder' | 'sales'>('reorder');

  const [isItemManualDialogOpen, setIsItemManualDialogOpen] = useState(false);
  const [allItemsList, setAllItemsList] = useState<OrderItem[]>([]);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);

  // Fetch all items when the dialog opens
  useEffect(() => {
    if (isItemManualDialogOpen) {
      setIsLoadingAllItems(true);
      axios.get('/admin/api/supplier-order/all-items')
        .then(response => {
          setAllItemsList(response.data.items);
        })
        .catch(err => {
          console.error("Failed to load all items", err);
        })
        .finally(() => {
          setIsLoadingAllItems(false);
        });
    }
  }, [isItemManualDialogOpen]);

  // F2 keybind
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsItemManualDialogOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectItemManually = (item: any) => {
    if (orderItems.some(oi => oi.id === item.id)) {
      return;
    }
    const reorderLevel = Number(item.reorder_level || 0);
    const stockFull = Number(item.stock_1 || 0);
    const shortageFull = Math.max(0, reorderLevel - stockFull);
    
    const newOrderItem: OrderItem = {
      ...item,
      input_full: shortageFull,
      input_pcs: 0,
      input_b_full: 0,
      input_b_pcs: 0,
      disc_percent: 0,
    };
    
    setOrderItems(prev => [...prev, newOrderItem]);
    setSelectedRowId(item.id);
  };

  // Time effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }));
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => s.title.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [suppliers, supplierSearch]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => c.title.toLowerCase().includes(companySearch.toLowerCase()));
  }, [companies, companySearch]);

  useEffect(() => {
    const selectionId = selectionMode === 'supplier' ? selectedSupplier?.id : selectedCompany?.id;
    if (selectionId) {
      loadItems(selectionId, selectionMode);
    }
  }, [selectedSupplier, selectedCompany, filterMode, selectionMode, salesStartDate]);

  const loadItems = async (selectionId: number, selMode: 'supplier' | 'company') => {
    setIsLoadingItems(true);
    try {
      const response = await axios.post('/admin/api/supplier-order/items', {
        selection_id: selectionId,
        selection_mode: selMode,
        mode: filterMode,
        sales_start_date: salesStartDate
      });
      
      const newItems = response.data.items.map((item: any) => {
        // Fix 5: Negative stock is treated as additional deficit.
        // e.g. reorder_level=10, stock_1=-20 → 10 - (-20) = 30
        // e.g. reorder_level=10, stock_1=0  → 10 - 0 = 10
        const reorderLevel = Number(item.reorder_level || 0);
        const stockFull   = Number(item.stock_1 || 0);
        const inputFull   = Math.max(0, reorderLevel - stockFull);
        return {
          ...item,
          input_full: inputFull,
          input_pcs: 0,
          input_b_full: 0,
          input_b_pcs: 0,
          disc_percent: 0,
        };
      });
      setOrderItems(newItems);
      if (newItems.length > 0) {
        const stillExists = newItems.some((item: any) => item.id === selectedRowId);
        if (!stillExists) {
          setSelectedRowId(newItems[0].id);
        }
      } else {
        setSelectedRowId(null);
      }
    } catch (error) {
      console.error("Failed to load items", error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleItemChange = (id: number, field: keyof OrderItem, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOrderItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: numValue } : item
    ));
  };

  const removeItem = (id: number) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
    if (selectedRowId === id) setSelectedRowId(null);
  };

  const resetAll = () => {
    setOrderItems([]);
    setSelectedRowId(null);
    setSelectedSupplier(null);
    setSelectedCompany(null);
  };

  const selectedItem = useMemo(() => 
    orderItems.find(item => item.id === selectedRowId), 
  [orderItems, selectedRowId]);

  const totalDiscount = useMemo(() => {
    return orderItems.reduce((total, item) => {
      // Net Rate = last_purchase_rate - (last_purchase_rate * disc_percent / 100)
      const discountAmount = item.last_purchase_rate * (item.disc_percent / 100);
      const totalUnits = (item.input_full * item.packing_qty) + item.input_pcs;
      return total + ((discountAmount / item.packing_qty) * totalUnits);
    }, 0);
  }, [orderItems]);

  const totalAmount = useMemo(() => {
    return orderItems.reduce((total, item) => {
      const parsedLastPurchaseRate = Number(item.last_purchase_rate) || 0;
      const parsedDiscPercent = Number(item.disc_percent) || 0;
      const netRate = parsedLastPurchaseRate - (parsedLastPurchaseRate * parsedDiscPercent / 100);
      const pricePerPc = netRate / item.packing_qty;
      const totalUnits = (Number(item.input_full) * item.packing_qty) + Number(item.input_pcs);
      return total + (totalUnits * pricePerPc);
    }, 0);
  }, [orderItems]);

  const handleMakeReorderLevel = () => {
    setOrderItems(prev => prev.map(item => {
      // Fix 5 (same formula as loadItems): negative stock = additional deficit
      const reorderLevel = Number(item.reorder_level || 0);
      const stockFull   = Number(item.stock_1 || 0);
      const shortageFull = Math.max(0, reorderLevel - stockFull);
      return {
        ...item,
        input_full: shortageFull,
        input_pcs: 0
      };
    }));
  };

  const handleSaveOrder = async () => {
    const selectionId = selectionMode === 'supplier' ? selectedSupplier?.id : selectedCompany?.id;
    if (!selectionId || orderItems.length === 0) return;
    setIsSaving(true);
    try {
      const response = await axios.post('/admin/api/supplier-order/store', {
        supplier_id: selectionId,
        order_date: currentDate,
        items: orderItems,
      });
      setCreatedOrderId(response.data.order_id);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Failed to save order", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const breadcrumbs = [
    { title: "Orders", href: "#" },
    { title: "Company | Supplier Order", href: "/admin/supplier-order" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="h-screen overflow-hidden flex flex-col">
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 font-sans p-4 overflow-hidden">
          
          {/* Topbar */}
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1 font-bold">Purchase Date</label>
              <div className="flex gap-2">
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-10 px-4 text-xs font-mono w-32 shadow-sm">
                  <span className="text-zinc-900 dark:text-zinc-100">{currentDate}</span>
                  <Calendar size={14} className="text-blue-500/70 ml-auto" />
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-10 px-4 text-xs font-mono w-36 shadow-sm">
                  <span className="text-zinc-900 dark:text-zinc-100">{currentTime}</span>
                  <Clock size={14} className="text-orange-500/70 ml-auto" />
                </div>
              </div>
            </div>

            {/* Order Target Switcher */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1 font-bold">Order Target</label>
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm h-10">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('supplier');
                    setOrderItems([]);
                    setSelectedRowId(null);
                  }}
                  className={`px-4 h-full text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${selectionMode === 'supplier' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  Supplier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectionMode('company');
                    setOrderItems([]);
                    setSelectedRowId(null);
                  }}
                  className={`px-4 h-full text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${selectionMode === 'company' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  Company
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 max-w-sm">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1 font-bold">
                {selectionMode === 'supplier' ? 'Select Supplier' : 'Select Company'}
              </label>
              {selectionMode === 'supplier' ? (
                <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center justify-between bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg h-10 px-4 text-xs font-bold transition-colors w-full text-left shadow-sm">
                      <span className={selectedSupplier ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
                        {selectedSupplier ? selectedSupplier.title : "Select Supplier..."}
                      </span>
                      <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-600" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-300">Select Supplier</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <Input 
                        placeholder="Search..." 
                        value={supplierSearch}
                        onChange={e => setSupplierSearch(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm h-10 mb-4 focus-visible:ring-orange-500/50"
                      />
                      <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {filteredSuppliers.map(sup => {
                          const totalItems = sup.assigned_companies?.reduce((acc, comp) => acc + (comp.items_count || 0), 0) || 0;
                          return (
                            <button
                              key={sup.id}
                              onClick={() => {
                                setSelectedSupplier(sup);
                                setIsSupplierDialogOpen(false);
                              }}
                              className="text-left px-3 py-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 flex flex-col gap-1"
                            >
                              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{sup.title}</span>
                              {sup.assigned_companies && sup.assigned_companies.length > 0 && (
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {sup.assigned_companies.map(c => c.title).join(', ')} <span className="text-orange-500 font-bold ml-1">({totalItems} items)</span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="flex items-center justify-between bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg h-10 px-4 text-xs font-bold transition-colors w-full text-left shadow-sm">
                      <span className={selectedCompany ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"}>
                        {selectedCompany ? selectedCompany.title : "Select Company..."}
                      </span>
                      <ChevronDown size={14} className="text-zinc-400 dark:text-zinc-600" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold uppercase tracking-widest text-zinc-300">Select Company</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                      <Input 
                        placeholder="Search..." 
                        value={companySearch}
                        onChange={e => setCompanySearch(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-sm h-10 mb-4 focus-visible:ring-orange-500/50"
                      />
                      <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                        {filteredCompanies.map(comp => (
                          <button
                            key={comp.id}
                            onClick={() => {
                              setSelectedCompany(comp);
                              setIsCompanyDialogOpen(false);
                            }}
                            className="text-left px-3 py-2.5 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 flex flex-col gap-1"
                          >
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200">{comp.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              <span className="text-orange-500 font-bold">({comp.items_count || 0} items)</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1 font-bold text-center">Items</label>
              <div className="flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg h-10 px-6 text-sm font-black text-zinc-900 dark:text-white min-w-[80px] shadow-sm">
                {orderItems.length}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 ml-auto">
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest pl-1 font-bold">Filter Mode</label>
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm h-10">
                <button 
                  onClick={() => setFilterMode('reorder')}
                  className={`px-4 h-full text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center gap-2 ${filterMode === 'reorder' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  <RotateCcw size={12} className={filterMode === 'reorder' ? 'animate-spin-slow' : ''} />
                  Re-Order Wise
                </button>
                <div 
                  className={`flex items-center gap-2 h-full rounded-md px-3 transition-all ${filterMode === 'sales' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                >
                  <button 
                    onClick={() => setFilterMode('sales')}
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 h-full"
                  >
                    <Search size={12} />
                    Sales ({salesDaysCount} Days)
                  </button>
                  {filterMode === 'sales' && (
                    <input 
                      type="date"
                      value={salesStartDate}
                      max={getTodayDateString()}
                      onChange={e => setSalesStartDate(e.target.value)}
                      className="text-[9px] font-mono bg-blue-700/50 dark:bg-zinc-950 border border-blue-400 dark:border-zinc-800 rounded px-1 py-0.5 text-white focus:outline-none focus:border-white w-[100px] cursor-pointer h-6"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table Panel */}
          <div className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-xl relative min-h-0">
            <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-orange-500 w-[25%]">Product Title</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[8%]">Full</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[8%]">Pcs</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[8%]">B.Full</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[8%]">B.Pcs</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[10%]">Rate</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[8%]">Disc %</th>
                    <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[10%]">Net Rate</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-right text-zinc-900 dark:text-zinc-100 w-[10%]">Subtotal</th>
                    <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-500 w-[5%]">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {orderItems.map((item) => {
                    const parsedLastPurchaseRate = Number(item.last_purchase_rate) || 0;
                    const parsedDiscPercent = Number(item.disc_percent) || 0;
                    const netRate = parsedLastPurchaseRate - (parsedLastPurchaseRate * parsedDiscPercent / 100);
                    // Price per pc
                    const pricePerPc = netRate / item.packing_qty;
                    const totalUnits = (Number(item.input_full) * item.packing_qty) + Number(item.input_pcs);
                    const subtotal = totalUnits * pricePerPc;

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedRowId(item.id)}
                        className={`group transition-colors cursor-pointer ${selectedRowId === item.id ? 'bg-zinc-50 dark:bg-zinc-800 ring-1 ring-inset ring-orange-500/20' : 'hover:bg-zinc-50/50 dark:hover:bg-[#222]/50'}`}
                      >
                        <td className="px-4 py-2">
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold truncate max-w-[250px] ${selectedRowId === item.id ? 'text-orange-500' : 'text-zinc-900 dark:text-zinc-300'}`}>{item.title}</span>
                            <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">{item.code} • Pk: {item.packing_qty}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input 
                            type="number" 
                            min="0"
                            value={item.input_full || ''} 
                            onChange={e => handleItemChange(item.id, 'input_full', e.target.value)}
                            className="h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-center text-xs focus-visible:ring-orange-500/50 font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input 
                            type="number" 
                            min="0"
                            value={item.input_pcs || ''} 
                            onChange={e => handleItemChange(item.id, 'input_pcs', e.target.value)}
                            className="h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-center text-xs focus-visible:ring-orange-500/50 font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input 
                            type="number" 
                            min="0"
                            value={item.input_b_full || ''} 
                            onChange={e => handleItemChange(item.id, 'input_b_full', e.target.value)}
                            className="h-8 bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 text-center text-xs focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 font-mono text-zinc-400 dark:text-zinc-500"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input 
                            type="number" 
                            min="0"
                            value={item.input_b_pcs || ''} 
                            onChange={e => handleItemChange(item.id, 'input_b_pcs', e.target.value)}
                            className="h-8 bg-white dark:bg-zinc-950 border-zinc-200/50 dark:border-zinc-800/50 text-center text-xs focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600 font-mono text-zinc-400 dark:text-zinc-500"
                          />
                        </td>
                        <td className="px-2 py-2 text-center text-xs font-mono text-zinc-500 dark:text-zinc-400">
                          {Number(item.last_purchase_rate || 0).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <Input 
                            type="number" 
                            min="0"
                            max="100"
                            value={item.disc_percent || ''} 
                            onChange={e => handleItemChange(item.id, 'disc_percent', e.target.value)}
                            className="h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-center text-xs focus-visible:ring-orange-500/50 font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </td>
                        <td className="px-2 py-2 text-center text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300">
                          {Number(netRate || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-mono font-black text-orange-500">
                          {subtotal > 0 ? subtotal.toFixed(2) : '0.00'}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button 
                            onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                            className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orderItems.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-zinc-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-widest">
                        {isLoadingItems ? 'Loading items...' : `Select a ${selectionMode === 'supplier' ? 'supplier' : 'company'} and load items to begin`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Sub-Bottom Actions within Table Panel */}
            <div className="bg-zinc-50 dark:bg-[#151515] border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  onClick={resetAll}
                  variant="outline"
                  size="sm" 
                  className="h-8 border-zinc-700 hover:bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
                <Button 
                  onClick={handleSaveOrder}
                  disabled={orderItems.length === 0 || isSaving}
                  size="sm" 
                  className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-6"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  onClick={() => setIsItemManualDialogOpen(true)}
                  variant="outline"
                  size="sm" 
                  className="h-8 border-orange-500/50 hover:bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  <ListPlus size={14} />
                  Select Item (F2)
                </Button>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">Rows</span>
                  <span className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">{orderItems.length}</span>
                </div>
                <div className="flex flex-col items-end border-l border-zinc-200 dark:border-zinc-800 pl-6">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">Total Discount</span>
                  <span className="text-sm font-mono font-black text-rose-600 dark:text-rose-500 leading-none mt-1">
                    -Rs {totalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col items-end border-l border-zinc-200 dark:border-zinc-800 pl-6">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest leading-none">Total Amount</span>
                  <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1">
                    Rs {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Item Intelligence */}
          <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-lg min-h-[120px] flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-zinc-400 dark:text-zinc-600">
              <Database size={120} />
            </div>
            
            {selectedItem ? (
              <div className="relative z-10 w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-orange-500">
                    <Database size={16} />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
                    {selectedItem.title} <span className="text-zinc-300 dark:text-zinc-600 mx-2">•</span> Intelligence Panel
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Last Pur. Date</span>
                    {/* Fix 4: Format as "4 July 2026" */}
                    <span className="text-xs font-mono text-zinc-500 font-bold">{formatPurchaseDate(selectedItem.last_purchase_date)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Last Qty</span>
                    <span className="text-xs font-mono text-zinc-100 font-bold">
                      {selectedItem.last_qty_carton} <span className="text-[9px] text-zinc-500 font-sans">Full</span>, {selectedItem.last_qty_pcs} <span className="text-[9px] text-zinc-500 font-sans">Pcs</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Avg Pur. Rate</span>
                    <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">Rs {Number(selectedItem.av_purchase_rate || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Last Pur. Rate</span>
                    <span className="text-xs font-mono text-orange-600 dark:text-orange-400 font-bold">Rs {Number(selectedItem.last_purchase_rate || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Available Qty</span>
                    {/* Fix 2: Conditional color + NEG badge for negative stock */}
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 flex-wrap ${
                      selectedItem.stock_1 < 0 ? 'text-red-400' : selectedItem.stock_1 === 0 ? 'text-zinc-400' : 'text-emerald-400'
                    }`}>
                      {selectedItem.stock_1 < 0 && (
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-black tracking-widest">NEG</span>
                      )}
                      {selectedItem.stock_1} <span className="text-[9px] font-sans opacity-60">Full</span>,{' '}
                      <span className={selectedItem.stock_2 < 0 ? 'text-red-400' : 'inherit'}>{selectedItem.stock_2}</span>{' '}
                      <span className="text-[9px] font-sans opacity-60">Pcs</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-zinc-800 pl-4">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Re-Order Lvl</span>
                    <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-2">
                      {selectedItem.reorder_level} <span className="text-[9px] text-rose-500/50 font-sans">Full</span>
                      {selectedItem.stock_1 <= selectedItem.reorder_level && (
                        <span className="bg-rose-500/20 text-rose-400 text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest">CRITICAL</span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 border-l border-zinc-100 dark:border-zinc-800 pl-4">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Last Supplier</span>
                    {/* Fix 1: Remove truncate — use break-words + title tooltip for full name */}
                    {selectedItem.last_supplier ? (
                      <span
                        className="text-xs text-zinc-900 dark:text-zinc-300 font-bold break-words max-w-[150px] leading-tight"
                        title={selectedItem.last_supplier}
                      >
                        {selectedItem.last_supplier}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500 italic font-normal">N/A</span>
                    )}
                  </div>
                 
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Database size={24} className="mx-auto text-zinc-800 mb-2" />
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Item Intelligence Panel</p>
                <p className="text-[9px] text-zinc-600 mt-1">Select an item row to unlock real-time metrics & history</p>
              </div>
            )}
          </div>

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
            <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest text-center text-lg">
                  Order Saved Successfully!
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-6 gap-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <Database size={32} />
                </div>
                <p className="text-center text-sm text-zinc-400">
                  Your supplier order has been securely recorded. What would you like to do next?
                </p>
                <div className="flex w-full gap-3 mt-2">
                  <Button 
                    onClick={() => {
                      resetAll();
                      setShowSuccessDialog(false);
                    }}
                    className="flex-1 bg-zinc-100 dark:bg-[#222] hover:bg-zinc-200 dark:hover:bg-[#333] border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 uppercase font-black text-[10px] tracking-widest h-10"
                  >
                    Create New
                  </Button>
                  <Button 
                    onClick={() => {
                      if (createdOrderId) {
                        window.open(`/admin/supplier-order/${createdOrderId}/print`, '_blank');
                      }
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white uppercase font-black text-[10px] tracking-widest h-10"
                  >
                    Print Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manual Item Selection Dialog */}
          <Dialog open={isItemManualDialogOpen} onOpenChange={setIsItemManualDialogOpen}>
            <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sm:max-w-6xl max-h-[85vh] flex flex-col p-6">
              <DialogHeader className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <DialogTitle className="text-sm font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <ListPlus className="text-orange-500" size={16} />
                  Select Items Manually
                </DialogTitle>
              </DialogHeader>
              
              <div className="py-4 flex flex-col gap-4 flex-1 min-h-0">
                {/* Search Bar */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input 
                    placeholder="Search by product name or code..." 
                    value={itemSearchQuery}
                    onChange={e => setItemSearchQuery(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 pl-10 text-sm h-11 focus-visible:ring-orange-500/50 text-zinc-900 dark:text-zinc-100 font-medium"
                    autoFocus
                  />
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto border border-zinc-200 dark:border-zinc-800 rounded-lg custom-scrollbar min-h-0 bg-zinc-50/30 dark:bg-zinc-950/20">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Item Name</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[15%]">Last Pur. Rate</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[20%]">Available Qty</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[15%]">Re-Order Lvl</th>
                        <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-center text-zinc-400 dark:text-zinc-500 w-[15%]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {isLoadingAllItems ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            <span className="animate-pulse">Loading items catalog...</span>
                          </td>
                        </tr>
                      ) : (() => {
                        const filtered = allItemsList.filter(item => {
                          const title = (item.title || "").toLowerCase();
                          const code = (item.code || "").toLowerCase();
                          const q = itemSearchQuery.toLowerCase();
                          return title.includes(q) || code.includes(q);
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-zinc-400 text-xs font-bold uppercase tracking-widest">
                                No items match your search
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map(item => {
                          const isAlreadyAdded = orderItems.some(oi => oi.id === item.id);
                          return (
                            <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                              <td className="px-4 py-2.5">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{item.title}</span>
                                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 font-mono mt-0.5">{item.code} • Pk: {item.packing_qty}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                Rs {Number(item.last_purchase_rate || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs font-mono">
                                <span className={`font-bold ${item.stock_1 < 0 ? 'text-red-500' : item.stock_1 === 0 ? 'text-zinc-500' : 'text-emerald-500'}`}>
                                  {item.stock_1 < 0 ? 'NEG ' : ''}{item.stock_1}F, {item.stock_2}P
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-center text-xs font-mono font-bold text-rose-500 dark:text-rose-400">
                                {item.reorder_level} F
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {isAlreadyAdded ? (
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                    Added
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => selectItemManually(item)}
                                    className="h-7 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3"
                                  >
                                    Select
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 font-mono">
                  Tip: F2 key toggles this dialog
                </span>
                <Button 
                  onClick={() => setIsItemManualDialogOpen(false)}
                  className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-black uppercase tracking-widest h-9"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
