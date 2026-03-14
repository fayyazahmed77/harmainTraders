"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbItem } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm, router } from "@inertiajs/react";
import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { DirtyStateDialog } from "@/components/dirty-state-dialog";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { route } from "ziggy-js";
import {
  Briefcase,
  MapPin,
  User as UserIcon,
  Tags,
  MessageSquare,
  Type,
  CalendarDays,
  PhoneCall,
  ShieldCheck,
  FileText,
  Hash,
  UserCheck,
  Percent,
  Building2,
  Globe2,
  Flag,
  Save,
  RotateCcw
} from "lucide-react";

const PREMIUM_ROUNDING_MD = "rounded-xl";
const SIGNAL_ORANGE = "rgb(249, 115, 22)";
const ACCENT_GRADIENT = "bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500";
const CARD_BASE = "bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl shadow-zinc-200/20 dark:shadow-none";
const PREMIUM_GRADIENT = "bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300";

// Standardized TechLabel component
const TechLabel = ({ children, icon: Icon, label, required, error, className }: { children: React.ReactNode, icon?: any, label: string, required?: boolean, error?: string, className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5">
      {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </div>
    {children}
    {error && <p className="text-[10px] text-rose-500 mt-1 font-bold animate-in fade-in slide-in-from-top-1">{error}</p>}
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

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "/account" },
  { title: "Edit", href: "/account" }, // or specify edit link if needed
];

interface Option {
  id?: number;
  value: number | string;
  label: string;
  code?: string;
  percentage?: number;
}

interface AccountForm {

  id?: number;
  code: string;
  title: string;
  type: string;
  purchase: boolean;
  cashbank: boolean;
  sale: boolean;
  opening_balance: string | number;
  address1: string;
  address2: string;
  telephone1: string;
  telephone2: string;
  fax: string;
  mobile: string;
  gst: string;
  ntn: string;
  remarks: string;
  regards: string;
  opening_date: string;
  fbr_date: string;
  country_id: string | number;
  province_id: string | number;
  city_id: string | number;
  area_id: string | number;
  subarea_id: string | number;
  saleman_id: string | number;
  booker_id: string | number;
  credit_limit: string | number;
  aging_days: string | number;
  note_head: string;
  item_category: string | number;
  category: string;
  ats_percentage: string | number;
  ats_type: string;
  cnic: string;
  status: boolean;
}

interface EditProps {
  account: any;
  countries: any[];
  provinces: any[];
  cities: any[];
  areas: any[];
  subareas: any[];
  salemans: any[];
  bookers: any[];
  accountTypes: any[];
  accountCategories: any[];
}

export default function Edit({
  account,
  countries,
  provinces,
  cities,
  areas,
  subareas,
  salemans,
  bookers,
  accountTypes,
  accountCategories,
}: EditProps) {
  // ---------- Option mapping ----------
  const salemanOptions = salemans.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.shortname ?? ""})`,
  }));
  const bookerOptions = bookers.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.shortname ?? ""})`,
  }));
  const accountTypeOptions = accountTypes.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const countryOptions = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const categoryOptions: Option[] = (accountCategories || []).map((cat) => ({
    value: cat.id,
    label: `${cat.name} (${cat.percentage}%)`,
    percentage: cat.percentage,
  }));

  // Helper to map passed data to Option based on ID
  const getMappedOption = (id: number | string | null, list: any[]) => {
    if (!id) return null;
    // Use loose equality to handle string vs number mismatches (e.g. "1" vs 1)
    const found = list.find((item) => item.id == id);
    if (!found) return null;
    return { value: found.id, label: found.name, code: found.code ?? "" };
  };

  // ---------- UI State initialized with account data ----------
  const [country, setCountry] = useState<Option | null>(getMappedOption(account.country_id, countries));
  const [province, setProvince] = useState<Option | null>(getMappedOption(account.province_id, provinces));
  const [city, setCity] = useState<Option | null>(getMappedOption(account.city_id, cities));
  const [area, setArea] = useState<Option | null>(getMappedOption(account.area_id, areas));
  const [subarea, setSubarea] = useState<Option | null>(getMappedOption(account.subarea_id, subareas));

  const [provinceOptions, setProvinceOptions] = useState<Option[]>(provinces.map(p => ({ value: p.id, label: p.name, code: p.code })));
  const [cityOptions, setCityOptions] = useState<Option[]>(cities.map(c => ({ value: c.id, label: c.name, code: c.code })));
  const [areaOptions, setAreaOptions] = useState<Option[]>(areas.map(a => ({ value: a.id, label: a.name })));
  const [subareaOptions, setSubareaOptions] = useState<Option[]>(subareas.map(s => ({ value: s.id, label: s.name })));

  const [openingDate, setOpeningDate] = useState<Date | undefined>(
    account.opening_date ? new Date(account.opening_date) : undefined
  );
  const [openingOpen, setOpeningOpen] = useState(false);

  const [fbrDate, setFbrDate] = useState<Date | undefined>(
    account.fbr_date ? new Date(account.fbr_date) : undefined
  );
  const [fbrOpen, setFbrOpen] = useState(false);

  const [saleman, setSaleman] = useState<Option | null>(getMappedOption(account.saleman_id, salemans));
  const [booker, setBooker] = useState<Option | null>(getMappedOption(account.booker_id, bookers));
  const [accountType, setAccountType] = useState<Option | null>(getMappedOption(account.type, accountTypes));
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(getMappedOption(account.category, accountCategories));

  const isCustomer = accountType?.label === "Customers";
  const isSupplier = accountType?.label === "Supplier";
  const isCompany = accountType?.label === "Company";

  const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';

  // Define custom styles for react-select to match Items form
  const getSelectStyles = (hasError: boolean) => ({
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: selectBg,
      border: `1px solid ${hasError ? '#f43f5e' : (state.isFocused ? SIGNAL_ORANGE : selectBorder)}`,
      borderRadius: 'var(--radius)',
      boxShadow: state.isFocused ? `0 0 0 1px ${SIGNAL_ORANGE}` : 'none',
      '&:hover': {
        borderColor: hasError ? '#f43f5e' : (state.isFocused ? SIGNAL_ORANGE : selectBorder),
      },
      minHeight: '40px',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? '#f4f4f5' : '#18181b',
      fontWeight: '600',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDark ? '#71717a' : '#a1a1aa',
      fontSize: '0.875rem',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: selectBg,
      border: `1px solid ${selectBorder}`,
      borderRadius: 'var(--radius)',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      zIndex: 9999,
      padding: '4px',
    }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
    option: (base: any, state: any) => ({
      ...base,
      borderRadius: 'calc(var(--radius) - 2px)',
      backgroundColor: state.isSelected
        ? SIGNAL_ORANGE
        : (state.isFocused ? (isDark ? '#27272a' : '#f4f4f5') : 'transparent'),
      color: state.isSelected
        ? '#ffffff'
        : (isDark ? '#f4f4f5' : '#18181b'),
      cursor: 'pointer',
      fontWeight: state.isSelected ? '700' : '500',
      fontSize: '0.875rem',
      padding: '8px 12px',
      '&:active': {
        backgroundColor: SIGNAL_ORANGE,
        color: '#ffffff',
      },
    }),
    input: (base: any) => ({ ...base, color: isDark ? '#f4f4f5' : '#18181b' }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: isDark ? '#52525b' : '#a1a1aa',
      '&:hover': { color: SIGNAL_ORANGE }
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  });

  // ---------- Inertia Form (Moved Up) ----------
  const { data, setData, put, processing, errors, transform, reset, clearErrors, setError, isDirty } = useForm<AccountForm>({
    ...account,
    // ensure boolean types
    purchase: Number(account.purchase) === 1,
    cashbank: Number(account.cashbank) === 1,
    sale: Number(account.sale) === 1,
    status: Number(account.status) === 1,
    gst: account.gst ?? "",
    ntn: account.ntn ?? "",
    remarks: account.remarks ?? "",
    regards: account.regards ?? "",
    note_head: account.note_head ?? "",
    category: account.category ?? "",
    cnic: account.cnic ?? "",
    opening_balance: account.opening_balance ?? "",
    address1: account.address1 ?? "",
    address2: account.address2 ?? "",
    telephone1: account.telephone1 ?? "",
    telephone2: account.telephone2 ?? "",
    fax: account.fax ?? "",
    mobile: account.mobile ?? "",
    country_id: account.country_id ? String(account.country_id) : "",
    province_id: account.province_id ? String(account.province_id) : "",
    city_id: account.city_id ? String(account.city_id) : "",
    area_id: account.area_id ? String(account.area_id) : "",
    subarea_id: account.subarea_id ? String(account.subarea_id) : "",
    saleman_id: account.saleman_id ? String(account.saleman_id) : "",
    booker_id: account.booker_id ? String(account.booker_id) : "",
    type: account.type ? String(account.type) : "",
    item_category: account.item_category ? String(account.item_category) : "",
    ats_percentage: account.ats_percentage ?? "",
    ats_type: account.ats_type ?? "",
  } as AccountForm);

  const { showConfirm, confirmNavigation, cancelNavigation } = useNavigationGuard(isDirty);

  // ---------- Cascading Fetchers ----------
  const fetchProvinces = async (countryId: number) => {
    try {
      const res = await fetch(`/subareas/countries/${countryId}/provinces`);
      const data = await res.json();
      setProvinceOptions(data.map((p: any) => ({ value: p.id, label: p.name, code: p.code })));
    } catch (err) {
      console.error("fetchProvinces error", err);
      setProvinceOptions([]);
    }
  };

  const fetchCities = async (provinceId: number) => {
    try {
      const res = await fetch(`/subareas/provinces/${provinceId}/cities`);
      const data = await res.json();
      setCityOptions(data.map((c: any) => ({ value: c.id, label: c.name, code: c.code })));
    } catch (err) {
      console.error("fetchCities error", err);
      setCityOptions([]);
    }
  };

  const fetchAreas = async (cityId: number) => {
    try {
      const res = await fetch(`/subareas/cities/${cityId}/areas`);
      const data = await res.json();
      setAreaOptions(data.map((a: any) => ({ value: a.id, label: a.name })));
    } catch (err) {
      console.error("fetchAreas error", err);
      setAreaOptions([]);
    }
  };

  const fetchSubareas = async (areaId: number) => {
    try {
      const res = await fetch(`/subareas/areas/${areaId}/subareas`);
      const data = await res.json();
      setSubareaOptions(data.map((s: any) => ({ value: s.id, label: s.name })));
    } catch (err) {
      console.error("fetchSubareas error", err);
      setSubareaOptions([]);
    }
  };

  // ---------- Handlers ----------
  const handleCountryChange = (opt: Option | null) => {
    setCountry(opt);
    setProvince(null);
    setCity(null);
    setArea(null);
    setSubarea(null);
    setProvinceOptions([]);
    setCityOptions([]);
    setAreaOptions([]);
    setSubareaOptions([]);
    if (opt) {
      fetchProvinces(Number(opt.value));
      setData("country_id", String(opt.value));
    } else {
      setData("country_id", "");
    }
  };

  const handleProvinceChange = (opt: Option | null) => {
    setProvince(opt);
    setCity(null);
    setArea(null);
    setSubarea(null);
    setCityOptions([]);
    setAreaOptions([]);
    setSubareaOptions([]);
    if (opt) {
      fetchCities(Number(opt.value));
      setData("province_id", String(opt.value));
    } else {
      setData("province_id", "");
    }
  };

  const handleCityChange = (opt: Option | null) => {
    setCity(opt);
    setArea(null);
    setSubarea(null);
    setAreaOptions([]);
    setSubareaOptions([]);
    if (opt) {
      fetchAreas(Number(opt.value));
      setData("city_id", String(opt.value));
    } else {
      setData("city_id", "");
    }
  };

  const handleAreaChange = (opt: Option | null) => {
    setArea(opt);
    setSubarea(null);
    setSubareaOptions([]);
    if (opt) {
      fetchSubareas(Number(opt.value));
      setData("area_id", String(opt.value));
    } else {
      setData("area_id", "");
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Client-side validation
    let validationErrors: any = {};
    if (!data.code) validationErrors.code = "Code is required";
    if (!data.title) validationErrors.title = "Account Title is required";
    if (!data.type) validationErrors.type = "Account Type is required";
    if (!data.opening_date) validationErrors.opening_date = "Opening Date is required";
    if (!data.opening_balance && data.opening_balance !== 0) validationErrors.opening_balance = "Opening Balance is required";
    if (!data.aging_days && data.aging_days !== 0) validationErrors.aging_days = "Aging Days is required";

    // At least one option must be selected
    if (!isCompany && !data.purchase && !data.cashbank && !data.sale) {
      validationErrors.purchase = "At least one account option must be selected";
    }

    // Conditional Validation for Customers
    if (isCustomer) {
      if (!data.saleman_id) validationErrors.saleman_id = "Salesman is required for Customers";
      if (!data.credit_limit && data.credit_limit !== 0) validationErrors.credit_limit = "Credit Limit is required for Customers";
      if (!data.item_category) validationErrors.item_category = "Item Category is required for Customers";
    }

    // Conditional Validation for Suppliers
    if (isSupplier) {
      if (!data.category) validationErrors.category = "Category is required for Suppliers";
    }

    if (Object.keys(validationErrors).length > 0) {
      Object.entries(validationErrors).forEach(([key, value]) => {
        setError(key as any, value as string);
      });

      const firstErrorKey = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorKey}"]`) || document.getElementById(firstErrorKey);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      toast.error("Please fix the errors before submitting.");
      return;
    }

    transform((data) => ({
      ...data,
      opening_date: openingDate ? openingDate.toISOString().split("T")[0] : "",
      fbr_date: fbrDate ? fbrDate.toISOString().split("T")[0] : "",
      country_id: country?.value ? String(country.value) : "",
      province_id: province?.value ? String(province.value) : "",
      city_id: city?.value ? String(city.value) : "",
      area_id: area?.value ? String(area.value) : "",
      subarea_id: subarea?.value ? String(subarea.value) : "",
      saleman_id: saleman?.value ? String(saleman.value) : "",
      type: accountType?.value ? String(accountType.value) : "",
      booker_id: booker?.value ? String(booker.value) : "",
      category: selectedCategory?.value ? String(selectedCategory.value) : "",
    }));

    put(`/account/${account.id}`, {
      onSuccess: () => {
        toast.success("Account updated successfully!");
      },
      onError: (err) => {
        console.error("submit error", err);
        toast.error("Failed to update account.");
      },
    });
  };

  const onInputChange = (name: keyof AccountForm, value: any) => {
    setData(name, value);
  };

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
        <div className="flex flex-1 flex-col overflow-hidden bg-[#f0f2f5]/50 dark:bg-zinc-950/50">
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-8 pb-32">
            <div className="max-w-7xl mx-auto px-6">
              <div className="mb-8">
                <h1 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'} mb-2`}>
                  EDIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">ACCOUNT</span>
                </h1>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Modify existing account parameters and preferences</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* TOP STATUS DECK */}
                <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative`}>
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT} ${PREMIUM_ROUNDING_MD && 'rounded-l-md'}`} />

                  <div className="col-span-1 border-b pb-4 md:pb-0 md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
                    <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Status</div>
                    <div className="flex flex-col gap-2">
                      <SignalBadge text={data.status ? "ACTIVE" : "INACTIVE"} type={data.status ? "green" : "red"} />
                      {accountType && (
                        <SignalBadge text={accountType.label} type="blue" />
                      )}
                    </div>
                  </div>

                  <div className="col-span-11 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <TechLabel label="Registration Date" icon={CalendarDays} required error={errors.opening_date}>
                      <Popover open={openingOpen} onOpenChange={setOpeningOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              `h-11 w-full justify-between text-left font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`,
                              !openingDate && "text-muted-foreground",
                              errors.opening_date && "border-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                            )}
                          >
                            {openingDate ? openingDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select date"}
                            <CalendarDays className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={openingDate}
                            onSelect={(val) => {
                              setOpeningDate(val);
                              setOpeningOpen(false);
                              setData("opening_date", val ? val.toISOString().split("T")[0] : "");
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </TechLabel>

                    <TechLabel label="Account Code" icon={Hash} required error={errors.code}>
                      <Input
                        value={data.code}
                        readOnly
                        placeholder="AUTO-GENERATED"
                        className={`h-11 bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 font-black text-sm text-zinc-500 tracking-wider ${PREMIUM_ROUNDING_MD}`}
                      />
                    </TechLabel>

                    <TechLabel label="Account Type" icon={Flag} required error={errors.type}>
                      <Select
                        value={accountType}
                        onChange={(opt) => {
                          setAccountType(opt as Option);
                          setData("type", opt ? String((opt as Option).value) : "");
                        }}
                        options={accountTypeOptions}
                        placeholder="Select type"
                        isSearchable
                        className="text-sm"
                        styles={getSelectStyles(!!errors.type)}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      />
                    </TechLabel>
                  </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT SIDE: Identity & Finance */}
                  <div className="space-y-6">
                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <Type size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Identity Details</h3>
                      </div>

                      <TechLabel label="Account Title" icon={Type} required error={errors.title}>
                        <Input
                          value={data.title}
                          onChange={(e) => onInputChange("title", e.target.value.toUpperCase())}
                          placeholder="Enter full account name"
                          className={cn(
                            `h-10 border-zinc-200 dark:border-zinc-700 font-bold text-sm bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} focus-visible:ring-zinc-400 uppercase`,
                            errors.title && "border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                          )}
                        />
                      </TechLabel>

                      <TechLabel label="Account Permissions" icon={UserCheck}>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "purchase", label: "PURCHASE", color: "orange" },
                            { id: "cashbank", label: "CASH/BANK", color: "green" },
                            { id: "sale", label: "SALE", color: "blue" },
                          ].map((opt) => (
                            <label
                              key={opt.id}
                              htmlFor={opt.id}
                              className={cn(
                                `flex flex-1 items-center gap-3 px-4 py-3 border ${PREMIUM_ROUNDING_MD} cursor-pointer transition-all duration-300`,
                                data[opt.id as keyof typeof data]
                                  ? `bg-${opt.color}-500/10 border-${opt.color}-500 shadow-sm shadow-${opt.color}-500/20`
                                  : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 grayscale opacity-70"
                              )}
                            >
                              <div className="relative flex items-center justify-center">
                                <Checkbox
                                  id={opt.id}
                                  checked={!!data[opt.id as keyof typeof data]}
                                  onCheckedChange={(v) => onInputChange(opt.id as any, !!v)}
                                  className={`border-zinc-300 dark:border-zinc-600 data-[state=checked]:bg-${opt.color}-500 data-[state=checked]:border-${opt.color}-500 shadow-none`}
                                />
                              </div>
                              <span className={cn(
                                "text-[10px] font-black tracking-widest transition-colors",
                                data[opt.id as keyof typeof data] ? `text-${opt.color}-600 dark:text-${opt.color}-400` : "text-zinc-500"
                              )}>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        {errors.purchase && <p className="text-[10px] text-rose-500 mt-2 font-bold uppercase tracking-tight">{errors.purchase}</p>}
                      </TechLabel>
                    </Card>

                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <Percent size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Financial Matrix</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Opening Balance" icon={Building2} required error={errors.opening_balance}>
                          <div className="relative">
                            <Input
                              type="number"
                              value={data.opening_balance}
                              onChange={(e) => onInputChange("opening_balance", e.target.value)}
                              placeholder="0"
                              className={`h-10 pl-8 font-mono font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">PKR</span>
                          </div>
                        </TechLabel>
                        <TechLabel label="Credit Limit" icon={ShieldCheck} required={isCustomer} error={errors.credit_limit}>
                          <Input
                            type="number"
                            value={data.credit_limit}
                            onChange={(e) => onInputChange("credit_limit", e.target.value)}
                            placeholder="999999"
                            className={`h-10 font-mono font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`}
                          />
                        </TechLabel>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Aging Days" icon={CalendarDays} required error={errors.aging_days}>
                          <Input
                            type="number"
                            value={data.aging_days}
                            onChange={(e) => onInputChange("aging_days", e.target.value)}
                            placeholder="1"
                            className={`h-10 font-mono font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`}
                          />
                        </TechLabel>
                        <TechLabel label="CNIC / Identifier" icon={Hash}>
                          <Input
                            value={data.cnic}
                            onChange={(e) => onInputChange("cnic", e.target.value)}
                            placeholder="00000-0000000-0"
                            className={`h-10 font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`}
                          />
                        </TechLabel>
                      </div>
                    </Card>

                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <PhoneCall size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Contact & Notes</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Mobile (Primary)" icon={PhoneCall}>
                          <Input value={data.mobile} onChange={(e) => onInputChange("mobile", e.target.value)} placeholder="0300-0000000" className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-mono" />
                        </TechLabel>
                        <TechLabel label="Telephone" icon={PhoneCall}>
                          <Input value={data.telephone1} onChange={(e) => onInputChange("telephone1", e.target.value)} placeholder="Office/Home" className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700" />
                        </TechLabel>
                      </div>

                      <TechLabel label="Remarks / Details" icon={MessageSquare}>
                        <Input
                          value={data.remarks}
                          onChange={(e) => onInputChange("remarks", e.target.value.toUpperCase())}
                          placeholder="Internal notes or specific instructions..."
                          className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 uppercase"
                        />
                      </TechLabel>
                    </Card>
                  </div>

                  {/* RIGHT SIDE: Location & Management */}
                  <div className="space-y-6">
                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <Globe2 size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Location Logistics</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Country" icon={Globe2} error={errors.country_id}>
                          <Select
                            options={countryOptions}
                            value={country}
                            onChange={(opt) => handleCountryChange(opt as Option)}
                            placeholder="Select..."
                            className="text-sm"
                            styles={getSelectStyles(!!errors.country_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                            formatOptionLabel={(opt: any) => (
                              <div className="flex items-center gap-2">
                                {opt.code && <img src={`https://flagcdn.com/w40/${opt.code.toLowerCase()}.png`} alt="" className="w-5 h-4 rounded object-cover" />}
                                <span>{opt.label}</span>
                              </div>
                            )}
                          />
                        </TechLabel>
                        <TechLabel label="Province" icon={MapPin} error={errors.province_id}>
                          <Select
                            options={provinceOptions}
                            value={province}
                            onChange={(opt) => handleProvinceChange(opt as Option)}
                            placeholder={country ? "Select..." : "Wait..."}
                            isDisabled={!country}
                            className="text-sm"
                            styles={getSelectStyles(!!errors.province_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="City" icon={Building2} error={errors.city_id}>
                          <Select
                            options={cityOptions}
                            value={city}
                            onChange={(opt) => handleCityChange(opt as Option)}
                            placeholder={province ? "Select..." : "Wait..."}
                            isDisabled={!province}
                            className="text-sm"
                            styles={getSelectStyles(!!errors.city_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                        <TechLabel label="Area" icon={MapPin} error={errors.area_id}>
                          <Select
                            options={areaOptions}
                            value={area}
                            onChange={(opt) => handleAreaChange(opt as Option)}
                            placeholder={city ? "Select..." : "Wait..."}
                            isDisabled={!city}
                            className="text-sm"
                            styles={getSelectStyles(!!errors.area_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                      </div>

                      <TechLabel label="Sub-Area / Locality" icon={MapPin} error={errors.subarea_id}>
                        <Select
                          options={subareaOptions}
                          value={subarea}
                          onChange={(opt) => {
                            setSubarea(opt as Option | null);
                            setData("subarea_id", opt ? String((opt as Option).value) : "");
                          }}
                          placeholder={area ? "Select locality..." : "Select area first..."}
                          isDisabled={!area}
                          className="text-sm"
                          styles={getSelectStyles(!!errors.subarea_id)}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                        />
                      </TechLabel>

                      <TechLabel label="Primary Address" icon={MapPin}>
                        <Input
                          value={data.address1}
                          onChange={(e) => onInputChange("address1", e.target.value.toUpperCase())}
                          placeholder="Street, Block, Building..."
                          className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 uppercase"
                        />
                      </TechLabel>
                    </Card>

                    {/* MANAGEMENT CARD */}
                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <UserIcon size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Account Management</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="Salesman" icon={Briefcase} required={isCustomer} error={errors.saleman_id}>
                          <Select
                            value={saleman}
                            onChange={(opt) => {
                              setSaleman(opt as Option);
                              setData("saleman_id", opt ? String((opt as Option).value) : "");
                            }}
                            options={salemanOptions}
                            placeholder="Select..."
                            className="text-sm"
                            styles={getSelectStyles(!!errors.saleman_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                        <TechLabel label="Booker" icon={Briefcase} error={errors.booker_id}>
                          <Select
                            value={booker}
                            onChange={(opt) => {
                              setBooker(opt as Option);
                              setData("booker_id", opt ? String((opt as Option).value) : "");
                            }}
                            options={bookerOptions}
                            placeholder="Select..."
                            className="text-sm"
                            styles={getSelectStyles(!!errors.booker_id)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {isSupplier && (
                          <TechLabel label="Category (Dynamic)" icon={Tags} required={isSupplier} error={errors.category}>
                            <Select
                              options={categoryOptions}
                              value={selectedCategory}
                              onChange={(opt: any) => {
                                setSelectedCategory(opt);
                                onInputChange("category", opt ? String(opt.value) : "");
                              }}
                              placeholder="Select..."
                              className="text-sm"
                              styles={getSelectStyles(!!errors.category)}
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                            />
                          </TechLabel>
                        )}
                        {isCustomer && (
                          <TechLabel label="Item Category" icon={Tags} required={isCustomer} error={errors.item_category}>
                            <Select
                              options={[
                                { value: "2", label: "2 (T.P 2)" },
                                { value: "3", label: "3 (T.P 3)" },
                                { value: "4", label: "4 (T.P 4)" },
                                { value: "5", label: "5 (T.P 5)" },
                                { value: "6", label: "6 (T.P 6)" },
                                { value: "7", label: "7 (T.P 7)" },
                              ]}
                              value={data.item_category ? { value: data.item_category, label: data.item_category } : null}
                              onChange={(opt: any) => onInputChange("item_category", opt ? String(opt.value) : "")}
                              placeholder="Select Category"
                              className="text-sm"
                              styles={getSelectStyles(!!errors.item_category)}
                              menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                            />
                          </TechLabel>
                        )}
                        <TechLabel label="Note Head" icon={FileText} error={errors.note_head}>
                          <Select
                            options={[
                              { value: "Legal Expenses", label: "Legal Expenses" },
                              { value: "Bank Charges", label: "Bank Charges" },
                              { value: "Depreciation", label: "Depreciation" },
                              { value: "N/A", label: "N/A" },
                              { value: "Promotional & Marketing", label: "Promotional & Marketing" },
                              { value: "Daily Customer", label: "Daily Customer" },
                              { value: "Zakat", label: "Zakat" },
                              { value: "Home Expenses", label: "Home Expenses" },
                              { value: "Office Expenses", label: "Office Expenses" },
                            ]}
                            value={data.note_head ? { value: data.note_head, label: data.note_head } : null}
                            onChange={(opt: any) => onInputChange("note_head", opt ? String(opt.value) : "")}
                            placeholder="Tagging..."
                            className="text-sm"
                            styles={getSelectStyles(!!errors.note_head)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                      </div>
                    </Card>

                    {/* TAX COMPLIANCE CARD */}
                    <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                        <ShieldCheck size={16} className="text-zinc-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Tax & Compliance</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="GST / NTN #" icon={Hash}>
                          <div className="grid grid-cols-2 gap-2">
                            <Input value={data.gst} onChange={(e) => onInputChange("gst", e.target.value)} placeholder="GST" className="h-10 text-xs font-mono" />
                            <Input value={data.ntn} onChange={(e) => onInputChange("ntn", e.target.value)} placeholder="NTN" className="h-10 text-xs font-mono" />
                          </div>
                        </TechLabel>
                        <TechLabel label="FBR Date" icon={CalendarDays}>
                          <Popover open={fbrOpen} onOpenChange={setFbrOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  `h-10 w-full justify-between text-left font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${PREMIUM_ROUNDING_MD}`,
                                  !fbrDate && "text-muted-foreground"
                                )}
                              >
                                {fbrDate ? fbrDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Select date"}
                                <CalendarDays className="h-4 w-4 text-zinc-400" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={fbrDate}
                                onSelect={(val) => {
                                  setFbrDate(val);
                                  setFbrOpen(false);
                                  setData("fbr_date", val ? val.toISOString().split("T")[0] : "");
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </TechLabel>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <TechLabel label="A.T.S Percentage" icon={Percent}>
                          <Input
                            type="number"
                            value={data.ats_percentage}
                            onChange={(e) => onInputChange("ats_percentage", e.target.value)}
                            placeholder="0.00"
                            className="h-10 text-xs font-mono"
                          />
                        </TechLabel>
                        <TechLabel label="A.T.S Status/Type" icon={ShieldCheck} error={errors.ats_type}>
                          <Select
                            options={[
                              { value: "Filer", label: "Filer" },
                              { value: "No-Filer", label: "No-Filer" },
                              { value: "Exempt", label: "Exempt" },
                              { value: "Manufacturer", label: "Manufacturer" },
                              { value: "Included", label: "Included" },
                              { value: "Excluded", label: "Excluded" },
                            ]}
                            value={data.ats_type ? { value: data.ats_type, label: data.ats_type } : null}
                            onChange={(opt: any) => onInputChange("ats_type", opt ? String(opt.value) : "")}
                            placeholder="Select Type..."
                            className="text-sm"
                            styles={getSelectStyles(!!errors.ats_type)}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          />
                        </TechLabel>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox
                          id="status"
                          checked={!!data.status}
                          onCheckedChange={(v) => onInputChange("status", !!v)}
                          className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        />
                        <label htmlFor="status" className="text-xs font-bold text-zinc-600 dark:text-zinc-400 cursor-pointer uppercase tracking-widest">Active Account</label>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* STICKY ACTION FOOTER */}
                <div className="fixed bottom-0 right-0 left-0 md:left-[244px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 p-4 px-8 z-40 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col">
                      <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Current Scope</span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{account.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reset()}
                      className={`h-11 px-6 border-zinc-200 dark:border-zinc-800 font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all ${PREMIUM_ROUNDING_MD} flex items-center gap-2`}
                    >
                      <RotateCcw size={16} />
                      RESET Changes
                    </Button>
                    <Button
                      type="submit"
                      disabled={processing}
                      className={`h-11 px-10 ${ACCENT_GRADIENT} text-white font-black hover:opacity-90 transition-all ${PREMIUM_ROUNDING_MD} shadow-lg shadow-orange-500/20 flex items-center gap-2 border-0`}
                    >
                      {processing ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          UPDATING...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          UPDATE ACCOUNT
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <DirtyStateDialog
          isOpen={showConfirm}
          onClose={cancelNavigation}
          onConfirm={confirmNavigation}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
