import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Search, PackageSearch, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Item {
  id: number;
  title: string;
  short_name?: string;
  category?: string;
  trade_price?: number;
  retail?: number;
  packing_qty?: number;
  packing_full?: number;
  gst_percent?: number;
  discount?: number;
  total_stock_pcs?: number;
  pt2?: number; pt3?: number; pt4?: number; pt5?: number; pt6?: number; pt7?: number;
}

interface ItemRegistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  customerCategory: string | null;
  currentRows: any[];
  onAddUpdate: (item: Item, data: { full: number; pcs: number; bonus_full: number; bonus_pcs: number; rate: number }) => void;
}

const toNumber = (v: any) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

export const ItemRegistryDialog: React.FC<ItemRegistryDialogProps> = ({
  open,
  onOpenChange,
  items,
  customerCategory,
  currentRows,
  onAddUpdate
}) => {
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemForQty, setSelectedItemForQty] = useState<Item | null>(null);
  
  const [dialogFull, setDialogFull] = useState<number>(0);
  const [dialogPcs, setDialogPcs] = useState<number>(0);
  const [dialogBonusFull, setDialogBonusFull] = useState<number>(0);
  const [dialogBonusPcs, setDialogBonusPcs] = useState<number>(0);
  const [dialogRate, setDialogRate] = useState<number>(0);

  const filteredItems = useMemo(() => {
    const q = itemSearch.toLowerCase();
    const filtered = items.filter((it) =>
      it.title.toLowerCase().includes(q) ||
      (it.short_name?.toLowerCase().includes(q)) ||
      (it.category?.toLowerCase().includes(q)) ||
      String(it.id).includes(q)
    );
    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [items, itemSearch]);

  const handleItemSelect = (item: Item) => {
    const existing = currentRows.find(r => r.item_id === item.id);
    setSelectedItemForQty(item);

    let tpVal = toNumber(item.trade_price);
    if (customerCategory && customerCategory !== "1") {
      const priceKey = `pt${customerCategory}` as keyof Item;
      const percentage = toNumber(item[priceKey]);
      if (percentage !== 0) tpVal = Math.round(tpVal * (1 + percentage / 100));
    }

    if (existing) {
      setDialogFull(toNumber(existing.full));
      setDialogPcs(toNumber(existing.pcs));
      setDialogBonusFull(toNumber(existing.bonus_full));
      setDialogBonusPcs(toNumber(existing.bonus_pcs));
      setDialogRate(toNumber(existing.rate));
    } else {
      setDialogFull(0);
      setDialogPcs(0);
      setDialogBonusFull(0);
      setDialogBonusPcs(0);
      setDialogRate(tpVal);
    }
  };

  const handleCommit = () => {
    if (!selectedItemForQty) return;
    onAddUpdate(selectedItemForQty, {
      full: dialogFull,
      pcs: dialogPcs,
      bonus_full: dialogBonusFull,
      bonus_pcs: dialogBonusPcs,
      rate: dialogRate
    });
    setSelectedItemForQty(null); // Just deselect, don't close
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[99vw] md:max-w-[75vw] w-full p-0 flex flex-col h-[90vh] rounded-[1rem] border-none shadow-2xl overflow-hidden bg-white dark:bg-[#0A0A0A]">
        
        {/* Header Section (1:1 with Screenshot) */}
        <div className="bg-[#FF5C00] p-6 shrink-0 relative">
          <button 
             onClick={() => onOpenChange(false)}
             className="absolute top-4 right-4 text-white/60 hover:text-white transition-all outline-none"
          >
            <X size={18} strokeWidth={3} />
          </button>
          <div className="flex flex-col gap-1 mb-4">
             <div className="flex items-center gap-2 text-white font-black text-xl tracking-tighter">
                <Box size={24} className="stroke-[3]" />
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-white m-0">Item Registry</DialogTitle>
             </div>
             <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.15em] ml-8 italic">
                Select an active SKU to assign to row sequence
             </p>
          </div>
          
          <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={16} strokeWidth={3} />
             <Input 
                placeholder="Query by Title, ID, or Category..." 
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                className="pl-11 h-12 bg-white/20 border-none text-white placeholder:text-white/50 rounded-full font-bold text-sm focus-visible:ring-0 transition-all focus:bg-white/30"
                autoFocus
             />
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
           {/* Table Header */}
           <div className="grid grid-cols-12 bg-zinc-50 dark:bg-[#121212] px-6 py-4 border-b dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              <div className="col-span-1">Code</div>
              <div className="col-span-4">Registry Title</div>
              <div className="col-span-1 text-center">Trade Price</div>
              <div className="col-span-2 text-center text-orange-500 font-black">Active Price Type</div>
              <div className="col-span-1 text-center font-mono">Avg</div>
              <div className="col-span-1 text-center font-mono">Retail</div>
              <div className="col-span-2 text-right">System Inventory</div>
           </div>

           {/* Table Body */}
           <div className="flex-1 overflow-y-auto custom-scrollbar divide-y dark:divide-zinc-900 bg-white dark:bg-[#050505]">
              {filteredItems.map(item => {
                const stock = toNumber(item.total_stock_pcs);
                const packing = toNumber(item.packing_qty || 1);
                const full = Math.floor(stock / packing);
                const pcs = stock % packing;
                const isSelected = currentRows.some(r => r.item_id === item.id);

                let tpVal = toNumber(item.trade_price);
                if(customerCategory && customerCategory !== "1") {
                  const p = toNumber(item[`pt${customerCategory}` as keyof Item]);
                  if(p !== 0) tpVal = Math.round(tpVal * (1 + p/100));
                }

                return (
                  <div 
                    key={item.id} 
                    onClick={() => handleItemSelect(item)}
                    className={cn(
                      "grid grid-cols-12 px-6 py-6 items-center cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 group",
                      isSelected && "bg-orange-500/5 ring-1 ring-inset ring-orange-500/20"
                    )}
                  >
                    <div className="col-span-1 text-[10px] font-bold text-zinc-300 dark:text-zinc-600">
                       #{String(item.id).padStart(4, '0')}
                    </div>
                    <div className="col-span-4 flex flex-col gap-1">
                       <span className="font-bold text-base text-zinc-800 dark:text-zinc-100 leading-tight uppercase truncate pr-4">
                          {item.title}
                       </span>
                       <div className="flex gap-2 items-center">
                          <span className="text-[9px] text-zinc-400 font-mono italic truncate">{item.short_name || 'Generic SKU'}</span>
                          {item.category && (
                             <span className="bg-blue-500/5 text-blue-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                          )}
                       </div>
                    </div>
                    <div className="col-span-1 text-center">
                       <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors"><span className="text-[8px] opacity-70">Rs</span> {toNumber(item.trade_price).toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                       <div className="px-5 py-2 rounded-lg border border-orange-200 dark:border-orange-500/20 bg-orange-50/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 font-black italic shadow-sm min-w-[120px] text-center transition-all group-hover:scale-105">
                          <span className="text-[10px] opacity-70 not-italic mr-1">Rs</span>{tpVal.toFixed(2)}
                       </div>
                    </div>
                    <div className="col-span-1 text-center text-[11px] font-mono font-bold text-zinc-400">
                       {toNumber(item.pt2 || 0).toFixed(0)}
                    </div>
                    <div className="col-span-1 text-center text-[11px] font-mono font-bold text-zinc-400">
                       {toNumber(item.retail).toFixed(0)}
                    </div>
                    <div className="col-span-2 flex flex-col items-end pr-2">
                       <div className="flex items-baseline gap-4">
                          <div className="flex flex-col items-center">
                             <span className={cn("text-lg font-black leading-none", stock > 0 ? "text-emerald-500" : "text-rose-500")}>{full}</span>
                             <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1 opacity-60">Full</span>
                          </div>
                          {packing > 1 && (
                            <div className="flex flex-col items-center">
                               <span className={cn("text-lg font-black leading-none", stock > 0 ? "text-emerald-500" : "text-rose-500")}>{pcs}</span>
                               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1 opacity-60">Pcs</span>
                            </div>
                          )}
                       </div>
                       <div className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600 mt-2 uppercase tracking-tight">Total: {stock} units</div>
                    </div>
                  </div>
                );
              })}
           </div>

           {/* Footer Section (1:1 with Screenshot) */}
           <div className="bg-zinc-50 dark:bg-[#0A0A0A] px-6 py-4 border-t dark:border-zinc-800 flex justify-between items-center shrink-0">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Showing {filteredItems.length} registry entries</span>
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Live Sync Enabled</span>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" className="h-9 px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-100 transition-all" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="h-9 px-8 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-transparent border-2 border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-white hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-black transition-all" onClick={() => onOpenChange(false)}>Ok</Button>
                 </div>
              </div>
           </div>
        </div>

        {/* Sync Tray (Refined: Bonus Fields + Conditional Visibility) */}
        <AnimatePresence>
        {selectedItemForQty && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }} 
            className="absolute inset-x-0 bottom-0 p-8 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t-2 border-[#FF5C00] shadow-[0_-20px_50px_rgba(0,0,0,0.2)] flex items-center gap-10 z-[100]"
          >
            <div className="flex-1 min-w-0">
               <span className="text-[10px] font-black text-[#FF5C00] uppercase tracking-[0.3em] mb-1 block">Configuring Sequence</span>
               <h3 className="text-3xl font-black text-zinc-900 dark:text-white truncate leading-tight uppercase tracking-tighter italic">
                  {selectedItemForQty.title}
               </h3>
               <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                  Registry Node: #{String(selectedItemForQty.id).padStart(4, '0')} | Cloud Stock: {selectedItemForQty.total_stock_pcs} Units
               </div>
            </div>

            <div className="flex gap-4 p-2 items-end">
              <div className="flex flex-col gap-1 items-center">
                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Full Units</span>
                 <Input 
                    type="number" 
                    value={dialogFull || ""} 
                    onChange={e => setDialogFull(toNumber(e.target.value))} 
                    className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-[#FF5C00] focus:ring-2 transition-all" 
                    autoFocus 
                 />
              </div>
              {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                   <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Loose Pcs</span>
                   <Input 
                      type="number" 
                      value={dialogPcs || ""} 
                      onChange={e => setDialogPcs(toNumber(e.target.value))} 
                      className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 focus:ring-[#FF5C00] focus:ring-2 transition-all" 
                   />
                </div>
              )}
              <div className="flex flex-col gap-1 items-center">
                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">B. Full</span>
                 <Input 
                    type="number" 
                    value={dialogBonusFull || ""} 
                    onChange={e => setDialogBonusFull(toNumber(e.target.value))} 
                    className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 focus:ring-amber-500 transition-all" 
                 />
              </div>
              {toNumber(selectedItemForQty.packing_qty || 1) > 1 && (
                <div className="flex flex-col gap-1 items-center animate-in fade-in slide-in-from-bottom-2">
                   <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">B. PCS</span>
                   <Input 
                      type="number" 
                      value={dialogBonusPcs || ""} 
                      onChange={e => setDialogBonusPcs(toNumber(e.target.value))} 
                      className="w-16 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 focus:ring-amber-500 transition-all" 
                   />
                </div>
              )}
              <div className="flex flex-col gap-1 items-center">
                 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Rate (Rs)</span>
                 <Input 
                    type="number" 
                    value={dialogRate || ""} 
                    onChange={e => setDialogRate(toNumber(e.target.value))} 
                    className="w-28 h-12 text-center text-xl font-black rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[#FF5C00] focus:ring-[#FF5C00] transition-all" 
                 />
              </div>
              
              <Button 
                onClick={handleCommit} 
                className="h-12 px-8 bg-[#FF5C00] hover:bg-[#E05200] text-white font-black text-base uppercase tracking-widest rounded-xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all ml-2"
              >
                Sync Node
              </Button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

      </DialogContent>
    </Dialog>
  );
};
