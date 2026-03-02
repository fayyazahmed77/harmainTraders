"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "@inertiajs/react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select as Nselect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Hash, Type, User as UserIcon, CalendarDays, Package, MapPin, Tag, Tags, Component, DollarSign, Percent, FileText, CheckCircle2, Box, Layers, Building2, Beaker, Briefcase, Ruler, BadgePercent } from "lucide-react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbItem } from "@/types"
import { toast } from "sonner"
import ReactSelect from "react-select"
import { useAppearance } from "@/hooks/use-appearance"

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Items", href: "/items" },
  { title: "Create", href: "/items/create" },
]

// Style Constants (Professional Modern)
const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const MONO_FONT = "font-mono tracking-tighter";

const SIGNAL_ORANGE = "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20";
const SIGNAL_GREEN = "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20";
const SIGNAL_RED = "bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20";

// Standardizing gradients and surface colors
const PREMIUM_SURFACE = "bg-white dark:bg-zinc-950/50";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5">
      {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
      {label}
    </div>
    {children}
  </div>
);

const SignalBadge = ({ text, type = 'blue' }: { text: string, type?: 'green' | 'red' | 'orange' | 'blue' }) => {
  const colors = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  };
  return (
    <span className={`px-2 py-0.5 ${PREMIUM_ROUNDING_MD} text-[10px] font-black uppercase tracking-tighter border ${colors[type]}`}>
      {text}
    </span>
  );
};

export default function Page({ categories, compaines }: { categories: any, compaines: any }) {
  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';

  const selectStyles = React.useMemo(() => ({
    control: (base: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: 'var(--border)',
      color: 'inherit',
      minHeight: '2.25rem',
      height: '2.25rem',
      borderRadius: 'calc(var(--radius) - 2px)',
      '&:hover': {
        borderColor: 'var(--input)'
      }
    }),
    valueContainer: (base: any) => ({ ...base, padding: '0 8px' }),
    dropdownIndicator: (base: any) => ({ ...base, padding: '4px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: selectBg,
      border: `1px solid ${selectBorder}`,
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: selectBg,
      padding: 0,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? 'var(--primary)'
        : state.isFocused
          ? 'var(--accent)'
          : selectBg,
      color: state.isSelected
        ? 'var(--primary-foreground)'
        : 'inherit',
      fontSize: '0.875rem',
      cursor: 'pointer'
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'inherit',
    }),
    input: (base: any) => ({
      ...base,
      color: 'inherit',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
    }),
  }), [selectBg, selectBorder]);

  const companyOptions = React.useMemo(() =>
    compaines.map((c: any) => ({ value: String(c.id), label: c.title })),
    [compaines]
  );

  const categoryOptions = React.useMemo(() =>
    categories.map((c: any) => ({ value: String(c.id), label: c.name })),
    [categories]
  );

  // date picker state
  const [openingDate, setOpeningDate] = useState<Date | undefined>(new Date());
  const [openingOpen, setOpeningOpen] = useState(false)

  // Inertia form initialised with keys matching your migration
  const { data, setData, post, processing, errors, reset } = useForm({
    date: "",
    code: "",
    title: "",
    short_name: "",
    company: "",
    trade_price: "",
    retail: "",
    retail_tp_diff: "",
    reorder_level: "",
    packing_qty: "",
    packing_size: "",
    pcs: "",
    formation: "",
    type: "",
    category: "",
    shelf: "",
    gst_percent: "",
    gst_amount: "",
    adv_tax_filer: "",
    adv_tax_non_filer: "",
    adv_tax_manufacturer: "",
    discount: "",
    packing_full: "",
    packing_pcs: "",
    limit_pcs: "",
    order_qty: "",
    weight: "",
    stock_1: "",
    stock_2: "",
    is_import: false,
    is_fridge: false,
    is_active: true,
    is_recipe: false,
    pt2: "",
    pt3: "",
    pt4: "",
    pt5: "",
    pt6: "",
    pt7: "",
  })

  // small helper typed setter
  const onInputChange = <K extends keyof typeof data>(key: K, value: typeof data[K]) =>
    setData(key, value as any)

  // UseEffect to calculating Retail and Trade Price difference
  useEffect(() => {
    const tradePrice = parseFloat(data.trade_price);
    const retailPrice = parseFloat(data.retail);

    if (!isNaN(tradePrice) && !isNaN(retailPrice) && tradePrice !== 0) {
      const diff = ((retailPrice - tradePrice) / tradePrice) * 100;
      // Update only if difference significantly changed to avoid loops/unnecessary updates
      // Using toFixed(2) for display
      const diffStr = diff.toFixed(2);
      if (data.retail_tp_diff !== diffStr) {
        setData("retail_tp_diff", diffStr);
      }
    } else {
      // Clear if inputs invalid/cleared? Or keep last valid?
      // Usually better to clear if inputs are cleared to avoid stale data
      if ((data.trade_price === "" || data.retail === "") && data.retail_tp_diff !== "") {
        setData("retail_tp_diff", "");
      }
    }
  }, [data.trade_price, data.retail]);

  // submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // ensure date is yyyy-mm-dd format
    const payload = {
      ...data,
      date: openingDate ? openingDate.toISOString().split("T")[0] : data.date,
    }

    // post to your endpoint (adjust path if needed)
    post("/items", {
      onSuccess: () => {
        toast.success("Item created")
        // reset form & local state
        reset()
        setOpeningDate(undefined)
      },
      onError: () => {
        toast.error("Please fix the errors and try again")
      },
    })
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 61)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6">

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* TOP CONTROL DECK */}
              <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative overflow-hidden`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT}`} />

                <div className="col-span-1 border-b pb-4 md:pb-0 md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Status</div>
                  <div className="flex flex-col gap-2">
                    {data.is_active && <SignalBadge text="ACTIVE" type="green" />}
                    {data.is_import && <SignalBadge text="IMPORT" type="blue" />}
                    {data.is_fridge && <SignalBadge text="FRIDGE" type="blue" />}
                    {data.is_recipe && <SignalBadge text="RECIPE" type="orange" />}
                    {!data.is_active && !data.is_import && !data.is_fridge && !data.is_recipe && (
                      <div className="text-[10px] font-mono text-zinc-300">STANDARD</div>
                    )}
                  </div>
                </div>

                <div className="col-span-11 grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-3">
                    <TechLabel label="Registry Date" icon={CalendarDays}>
                      <Popover open={openingOpen} onOpenChange={setOpeningOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={`w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500 ${!openingDate && !data.date && "text-zinc-400"}`}
                          >
                            {openingDate
                              ? openingDate.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : data.date
                                ? data.date
                                : "Select date"}
                            <CalendarIcon size={14} className="text-zinc-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={openingDate}
                            onSelect={(value) => {
                              setOpeningDate(value ?? undefined)
                              onInputChange("date", value ? value.toISOString().split("T")[0] : "")
                              setOpeningOpen(false)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      {errors.date && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.date}</p>}
                    </TechLabel>
                  </div>

                  <div className="md:col-span-3">
                    <TechLabel label="Item Code" icon={Hash}>
                      <Input
                        value={data.code}
                        onChange={(e) => onInputChange("code", e.target.value)}
                        placeholder="E.g. ITM-001"
                        className={`h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.1em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500 uppercase`}
                      />
                      {errors.code && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.code}</p>}
                    </TechLabel>
                  </div>

                  <div className="md:col-span-4">
                    <TechLabel label="Primary Title" icon={Type}>
                      <Input
                        value={data.title}
                        onChange={(e) => onInputChange("title", e.target.value)}
                        placeholder="Full Item Description"
                        className={`h-10 border-zinc-200 dark:border-zinc-700 font-bold text-sm bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-400`}
                      />
                      {errors.title && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.title}</p>}
                    </TechLabel>
                  </div>

                  <div className="md:col-span-2">
                    <TechLabel label="Short Name" icon={Type}>
                      <Input
                        value={data.short_name}
                        onChange={(e) => onInputChange("short_name", e.target.value)}
                        placeholder="Alias"
                        className={`h-10 border-zinc-200 dark:border-zinc-700 font-bold text-sm bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-400`}
                      />
                    </TechLabel>
                  </div>
                </div>
              </Card>
              {/* SECOND ROW: FINANCIAL & IDENTITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* FINANCIAL MATRIX */}
                 <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <DollarSign size={16} className="text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Financial Matrix</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Trade Price" icon={DollarSign}>
                            <Input
                                type="number"
                                value={data.trade_price}
                                onChange={(e) => onInputChange("trade_price", e.target.value)}
                                placeholder="0.00"
                                className="font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                            {errors.trade_price && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.trade_price}</p>}
                        </TechLabel>
                        <TechLabel label="Retail" icon={DollarSign}>
                             <Input
                                type="number"
                                value={data.retail}
                                onChange={(e) => onInputChange("retail", e.target.value)}
                                placeholder="0.00"
                                className="font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                        </TechLabel>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="T.P Diff %" icon={Percent}>
                             <Input
                                type="number"
                                value={data.retail_tp_diff}
                                onChange={(e) => onInputChange("retail_tp_diff", e.target.value)}
                                placeholder="Auto or Manual %"
                                className="font-mono text-sm bg-orange-50/50 dark:bg-orange-500/5 text-orange-600 border-orange-200 dark:border-orange-500/30"
                            />
                        </TechLabel>
                        <TechLabel label="Discount" icon={BadgePercent}>
                             <Input
                                type="number"
                                value={data.discount}
                                onChange={(e) => onInputChange("discount", e.target.value)}
                                placeholder="0.00"
                                className="font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                            />
                        </TechLabel>
                    </div>

                    {/* Advanced Pricing Tiers */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-4 space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Advanced Pricing Tiers (TP2 - TP7)</div>
                        <div className="grid grid-cols-2 gap-3">
                             <TechLabel label="Loose (T.P.2) %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt2} onChange={(e) => onInputChange("pt2", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt2 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt2) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                             <TechLabel label="Retail (T.P.3) %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt3} onChange={(e) => onInputChange("pt3", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt3 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt3) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                             <TechLabel label="Agent (T.P.4) %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt4} onChange={(e) => onInputChange("pt4", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt4 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt4) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                             <TechLabel label="T.P.5 %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt5} onChange={(e) => onInputChange("pt5", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt5 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt5) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                             <TechLabel label="T.P.6 %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt6} onChange={(e) => onInputChange("pt6", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt6 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt6) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                             <TechLabel label="T.P.7 %" icon={Percent}>
                                 <Input type="number" placeholder="%" value={data.pt7} onChange={(e) => onInputChange("pt7", e.target.value)} className="h-8 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                 {data.trade_price && data.pt7 && <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 mt-1">Rs {(Number(data.trade_price) * (1 + Number(data.pt7) / 100)).toFixed(2)}</div>}
                             </TechLabel>
                        </div>
                    </div>
                 </Card>

                 {/* IDENTITY & LOGISTICS */}
                 <div className="space-y-6">
                     <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                            <Box size={16} className="text-zinc-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Identity & Placement</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TechLabel label="Company" icon={Building2}>
                                <ReactSelect
                                    placeholder="Select Company"
                                    styles={selectStyles}
                                    options={companyOptions}
                                    value={companyOptions.find((opt: any) => opt.value === String(data.company)) || null}
                                    onChange={(opt: any) => onInputChange("company", opt ? opt.value : "")}
                                    isSearchable
                                    isClearable
                                />
                                {errors.company && <p className="text-[10px] text-rose-500 mt-1 font-bold">{errors.company}</p>}
                            </TechLabel>
                            
                            <TechLabel label="Category" icon={Tags}>
                                <ReactSelect
                                    placeholder="Select Category"
                                    styles={selectStyles}
                                    options={categoryOptions}
                                    value={categoryOptions.find((opt: any) => opt.value === String(data.category)) || null}
                                    onChange={(opt: any) => onInputChange("category", opt ? opt.value : "")}
                                    isSearchable
                                    isClearable
                                />
                            </TechLabel>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <TechLabel label="Formation" icon={Layers}>
                                <Nselect value={data.formation ?? ""} onValueChange={(v) => onInputChange("formation", v)}>
                                <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                                    <SelectValue placeholder="Formation" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ledger">Ledger</SelectItem>
                                    <SelectItem value="head">Head</SelectItem>
                                </SelectContent>
                                </Nselect>
                            </TechLabel>
                            <TechLabel label="Type" icon={Component}>
                                <Nselect value={data.type ?? ""} onValueChange={(v) => onInputChange("type", v)}>
                                <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ledger">Ledger</SelectItem>
                                    <SelectItem value="head">Head</SelectItem>
                                </SelectContent>
                                </Nselect>
                            </TechLabel>
                            <TechLabel label="Shelf" icon={MapPin}>
                                <Nselect value={data.shelf ?? ""} onValueChange={(v) => onInputChange("shelf", v)}>
                                <SelectTrigger className="w-full h-10 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                                    <SelectValue placeholder="Shelf" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ledger">Ledger</SelectItem>
                                    <SelectItem value="head">Head</SelectItem>
                                </SelectContent>
                                </Nselect>
                            </TechLabel>
                        </div>
                     </Card>

                     <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                            <Package size={16} className="text-zinc-500" />
                            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Logistics & Limits</h3>
                        </div>

                         <div className="grid grid-cols-4 gap-3">
                            <TechLabel label="P. Size" icon={Ruler}>
                                <Input value={data.packing_size} onChange={(e) => onInputChange("packing_size", e.target.value)} placeholder="175gm" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                            <TechLabel label="P. Qty" icon={Box}>
                                <Input value={data.packing_qty} onChange={(e) => onInputChange("packing_qty", e.target.value)} placeholder="Qty" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                             <TechLabel label="P. Full" icon={Box}>
                                <Input value={data.packing_full} onChange={(e) => onInputChange("packing_full", e.target.value)} placeholder="Full" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                             <TechLabel label="P. Pcs" icon={Component}>
                                <Input value={data.packing_pcs} onChange={(e) => onInputChange("packing_pcs", e.target.value)} placeholder="Pcs" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <TechLabel label="Re-Order" icon={FileText}>
                                <Input value={data.reorder_level} onChange={(e) => onInputChange("reorder_level", e.target.value)} placeholder="0" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                            <TechLabel label="Pcs / Limit" icon={Component}>
                                <div className="flex gap-1">
                                    <Input value={data.pcs} onChange={(e) => onInputChange("pcs", e.target.value)} placeholder="Pcs" className="h-9 w-1/2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                    <Input value={data.limit_pcs} onChange={(e) => onInputChange("limit_pcs", e.target.value)} placeholder="Lmt" className="h-9 w-1/2 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                                </div>
                            </TechLabel>
                            <TechLabel label="Order Qty" icon={FileText}>
                                <Input value={data.order_qty} onChange={(e) => onInputChange("order_qty", e.target.value)} placeholder="0" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                            <TechLabel label="Weight" icon={Box}>
                                <Input value={data.weight} onChange={(e) => onInputChange("weight", e.target.value)} placeholder="kg" className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </TechLabel>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <TechLabel label="Stock 1 / 2" icon={Layers}>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input value={data.stock_1} onChange={(e) => onInputChange("stock_1", e.target.value)} className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" placeholder="Stk 1" />
                                    <Input value={data.stock_2} onChange={(e) => onInputChange("stock_2", e.target.value)} className="h-9 text-xs font-mono bg-zinc-50 dark:bg-zinc-800" placeholder="Stk 2" />
                                </div>
                            </TechLabel>
                            
                            <TechLabel label="Item Flags" icon={CheckCircle2}>
                                <div className="flex items-center flex-wrap gap-4 mt-1">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="active" checked={!!data.is_active} onCheckedChange={(v) => onInputChange("is_active", !!v)} className="data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white border-zinc-300 dark:border-zinc-600" />
                                        <Label htmlFor="active" className="text-[10px] uppercase font-bold tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">Active</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="import" checked={!!data.is_import} onCheckedChange={(v) => onInputChange("is_import", !!v)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white border-zinc-300 dark:border-zinc-600" />
                                        <Label htmlFor="import" className="text-[10px] uppercase font-bold tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">Import</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="fridge" checked={!!data.is_fridge} onCheckedChange={(v) => onInputChange("is_fridge", !!v)} className="data-[state=checked]:bg-blue-500 data-[state=checked]:text-white border-zinc-300 dark:border-zinc-600" />
                                        <Label htmlFor="fridge" className="text-[10px] uppercase font-bold tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">Fridge</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="recipe" checked={!!data.is_recipe} onCheckedChange={(v) => onInputChange("is_recipe", !!v)} className="data-[state=checked]:bg-orange-500 data-[state=checked]:text-white border-zinc-300 dark:border-zinc-600" />
                                        <Label htmlFor="recipe" className="text-[10px] uppercase font-bold tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">Recipe</Label>
                                    </div>
                                </div>
                            </TechLabel>
                        </div>
                     </Card>
                 </div>
              </div>

              {/* THIRD ROW: TAX & REGULATORY */}
              <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD}`}>
                 <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                     <Briefcase size={16} className="text-rose-500" />
                     <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Tax & Regulatory Compliance</h3>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <TechLabel label="GST Configuration" icon={Percent}>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Percentage</div>
                                <Input value={data.gst_percent} onChange={(e) => onInputChange("gst_percent", e.target.value)} placeholder="%" className="h-10 text-sm font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </div>
                             <div>
                                <div className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Amount</div>
                                <Input value={data.gst_amount} onChange={(e) => onInputChange("gst_amount", e.target.value)} placeholder="Amt" className="h-10 text-sm font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </div>
                         </div>
                     </TechLabel>

                     <TechLabel label="Advance Tax Profile" icon={BadgePercent}>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                                <div className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Filer %</div>
                                <Input value={data.adv_tax_filer} onChange={(e) => onInputChange("adv_tax_filer", e.target.value)} placeholder="%" className="h-10 text-sm font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </div>
                             <div>
                                <div className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Non-Filer %</div>
                                <Input value={data.adv_tax_non_filer} onChange={(e) => onInputChange("adv_tax_non_filer", e.target.value)} placeholder="%" className="h-10 text-sm font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </div>
                             <div>
                                <div className="text-[9px] uppercase font-bold text-zinc-400 mb-1">Manufacturer %</div>
                                <Input value={data.adv_tax_manufacturer} onChange={(e) => onInputChange("adv_tax_manufacturer", e.target.value)} placeholder="%" className="h-10 text-sm font-mono bg-zinc-50 dark:bg-zinc-800" />
                            </div>
                         </div>
                     </TechLabel>
                 </div>
              </Card>

              {/* ACTION FOOTER */}
              <div className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} shadow-lg sticky bottom-4 z-30 flex justify-between items-center`}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                       <CheckCircle2 size={14} className="text-orange-500" />
                      Commit Identity Record
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" type="button" onClick={() => { reset(); setOpeningDate(undefined); }} className={`h-11 px-6 ${PREMIUM_ROUNDING_MD} font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900`}>
                      Reset Form
                    </Button>
                    <Button type="submit" disabled={processing} className={`h-11 px-8 ${SIGNAL_ORANGE} transition-all font-black text-[10px] uppercase tracking-widest ${PREMIUM_ROUNDING_MD}`}>
                      {processing ? "Saving..." : "Create Item"}
                    </Button>
                  </div>
              </div>
            </form>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
