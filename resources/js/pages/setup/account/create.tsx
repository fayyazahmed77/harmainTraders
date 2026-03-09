"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BreadcrumbItem } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from "@inertiajs/react";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { route } from "ziggy-js";
import { useAppearance } from "@/hooks/use-appearance";
import {
  Hash,
  Type,
  CalendarDays,
  User as UserIcon,
  MapPin,
  Tag,
  Tags,
  DollarSign,
  Percent,
  FileText,
  CheckCircle2,
  Phone,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Briefcase,
  Layers,
  Globe,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "/account" },
  { title: "Create", href: "/account/create" },
];

// Style Constants (Professional Modern)
const PREMIUM_ROUNDING_MD = "rounded-md";
const SIGNAL_ORANGE = "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20";
const ACCENT_GRADIENT = "bg-gradient-to-r from-orange-500 to-rose-500";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
  code: string;
}

interface Area {
  id: number;
  name: string;
  city_id: number;
  province_id: number;
  country_id: number;
}
interface Saleman {
  id: number;
  name: string;
  shortname: string;
  code: string;
}
interface Booker {
  id: number;
  name: string;
  shortname: string;
  code: string;
}
interface AccountType {
  id: number;
  name: string;
}

interface Subarea {
  id: number;
  name: string;
  area_id: number;
  city_id: number;
  province_id: number;
  country_id: number;
}

interface Option {
  id?: number;
  value: number | string;
  label: string;
  code?: string;
  percentage?: number;
}

interface IndexProps {
  countries: Country[];
  provinces?: Province[]; // optional: we fetch cascades client-side
  cities?: City[];
  areas?: Area[];
  subareas?: Subarea[];
  salemans: Saleman[];
  bookers: Booker[];
  accountTypes: AccountType[];
  accountCategories: any[];
}


// Reusable TechLabel component matching items/create
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

export default function Create({
  countries,
  salemans,
  bookers,
  accountTypes,
  accountCategories,
}: IndexProps) {
  // ---------- UI state ----------
  const [country, setCountry] = useState<Option | null>(null);
  const [province, setProvince] = useState<Option | null>(null);
  const [city, setCity] = useState<Option | null>(null);
  const [area, setArea] = useState<Option | null>(null);
  const [subarea, setSubarea] = useState<Option | null>(null);

  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [areaOptions, setAreaOptions] = useState<Option[]>([]);
  const [subareaOptions, setSubareaOptions] = useState<Option[]>([]);

  const [openingDate, setOpeningDate] = useState<Date | undefined>(new Date());
  const [openingOpen, setOpeningOpen] = useState(false);

  const [fbrDate, setFbrDate] = useState<Date | undefined>();
  const [fbrOpen, setFbrOpen] = useState(false);

  const [saleman, setSaleman] = useState<Option | null>(null);
  const [booker, setBooker] = useState<Option | null>(null);
  const [accountType, setAccountType] = useState<Option | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);

  // ---------- convenience option lists ----------
  const salemanOptions: Option[] = salemans.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.shortname ?? ""})`,
  }));

  const accountTypeOptions: Option[] = accountTypes.map((a) => ({
    value: a.id,
    label: a.name,
  }));
  const bookerOptions: Option[] = bookers.map((b) => ({
    value: b.id,
    label: `${b.name} (${b.shortname ?? ""})`,
  }));
  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const categoryOptions: Option[] = (accountCategories || []).map((cat: any) => ({
    value: cat.id,
    label: `${cat.name} (${cat.percentage}%)`,
    percentage: cat.percentage,
  }));

  const isCustomer = accountType?.label === "Customers";
  const isSupplier = accountType?.label === "Supplier";

  const { appearance } = useAppearance();
  const isDark = appearance === 'dark' || (appearance === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const selectBg = isDark ? '#0a0a0a' : '#ffffff';
  const selectBorder = isDark ? '#262626' : '#e5e7eb';

  // Define custom styles for react-select to match Items form
  const getSelectStyles = (hasError: boolean) => ({
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: 'transparent',
      borderColor: hasError ? 'rgb(244 63 94)' : state.isFocused ? 'var(--ring)' : 'var(--border)',
      color: 'inherit',
      minHeight: '2.5rem',
      height: '2.5rem',
      borderRadius: 'calc(var(--radius) - 2px)',
      boxShadow: state.isFocused ? (hasError ? '0 0 0 1px rgb(244 63 94)' : '0 0 0 1px var(--ring)') : 'none',
      '&:hover': {
        borderColor: hasError ? 'rgb(225 29 72)' : state.isFocused ? 'var(--ring)' : 'var(--border)',
      },
      opacity: state.isDisabled ? 0.5 : 1,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'inherit',
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
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
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      borderRadius: 'calc(var(--radius) - 2px)',
      backgroundColor: state.isSelected
        ? 'var(--primary)'
        : state.isFocused
          ? 'var(--accent)'
          : 'transparent',
      color: state.isSelected
        ? 'var(--primary-foreground)'
        : state.isFocused
          ? 'var(--accent-foreground)'
          : 'inherit',
      cursor: 'pointer',
      fontSize: '0.875rem',
      padding: '8px 12px',
    }),
    input: (base: any) => ({
      ...base,
      color: 'inherit',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)',
      padding: '4px',
      '&:hover': {
        color: 'var(--foreground)',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
  });

  // ---------- cascading fetch helpers ----------
  const fetchProvinces = async (countryId: number) => {
    try {
      const res = await fetch(`/subareas/countries/${countryId}/provinces`);
      const data = await res.json();
      setProvinceOptions(data.map((p: Province) => ({ value: p.id, label: p.name, code: p.code })));
    } catch (err) {
      console.error("fetchProvinces error", err);
      setProvinceOptions([]);
    }
  };

  const fetchCities = async (provinceId: number) => {
    try {
      const res = await fetch(`/subareas/provinces/${provinceId}/cities`);
      const data = await res.json();
      setCityOptions(data.map((c: City) => ({ value: c.id, label: c.name, code: c.code })));
    } catch (err) {
      console.error("fetchCities error", err);
      setCityOptions([]);
    }
  };

  const fetchAreas = async (cityId: number) => {
    try {
      const res = await fetch(`/subareas/cities/${cityId}/areas`);
      const data = await res.json();
      setAreaOptions(data.map((a: Area) => ({ value: a.id, label: a.name })));
    } catch (err) {
      console.error("fetchAreas error", err);
      setAreaOptions([]);
    }
  };

  const fetchSubareas = async (areaId: number) => {
    try {
      const res = await fetch(`/subareas/areas/${areaId}/subareas`);
      const data = await res.json();
      setSubareaOptions(data.map((s: Subarea) => ({ value: s.id, label: s.name })));
    } catch (err) {
      console.error("fetchSubareas error", err);
      setSubareaOptions([]);
    }
  };

  // ---------- cascade handlers ----------
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

  // ---------- Inertia form ----------
  const { data, setData, post, processing, errors, reset, transform, setError, clearErrors } = useForm({
    code: "",
    title: "",
    type: "",
    purchase: false,
    cashbank: false,
    sale: false,
    opening_balance: "0",
    address1: "",
    address2: "",
    telephone1: "",
    telephone2: "",
    fax: "",
    mobile: "",
    gst: "",
    ntn: "",
    remarks: "",
    regards: "",
    opening_date: new Date().toISOString().split("T")[0],
    fbr_date: "",
    country_id: "",
    province_id: "",
    city_id: "",
    area_id: "",
    subarea_id: "",
    saleman_id: "",
    booker_id: "",
    credit_limit: "999999",
    aging_days: "1",
    note_head: "",
    item_category: "",
    category: "",
    ats_percentage: "",
    ats_type: "",
    cnic: "",
    status: true,
  });

  // ---------- Auto-generate Code Logic ----------
  useEffect(() => {
    if (accountType?.value) {
      axios.get(route('account.next-code'), { params: { type: accountType.value } })
        .then((response) => {
          if (response.data.code) {
            setData("code", response.data.code);
          }
        })
        .catch((error) => {
          console.error("Error fetching next code:", error);
        });
    }
  }, [accountType]);


  // helper to compute submit url. If Ziggy's route helper is available on window, use it,
  // otherwise fallback to "/accounts".
  const getSubmitUrl = () => {
    try {
      // @ts-ignore - some projects expose route() globally via Ziggy
      if (typeof (window as any).route === "function") {
        return (window as any).route("account.store");
      }
    } catch (e) {
      // ignore
    }
    return "/account";
  };

  // ---------- submit ----------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Client-side validation
    let hasError = false;
    const itemsToValidate: Record<string, string> = {
      code: "Code is required",
      title: "Title is required",
      type: "Account Type is required",
      opening_date: "Opening Date is required",
      opening_balance: "Opening Balance is required",
      aging_days: "Aging Days is required",
    };

    // Customer specific requirements
    if (isCustomer) {
      itemsToValidate.saleman_id = "Salesman is required for customers";
      itemsToValidate.credit_limit = "Credit limit is required for customers";
      itemsToValidate.item_category = "Item category is required for customers";
    }

    // Supplier specific requirements
    if (isSupplier) {
      itemsToValidate.category = "Category is required for suppliers";
    }

    Object.entries(itemsToValidate).forEach(([field, msg]) => {
      // Check current data or locally held select values
      let val = data[field as keyof typeof data];

      // If field is saleman_id, check the saleman object too
      if (field === 'saleman_id' && !val && saleman) val = String(saleman.value);
      if (field === 'category' && !val && selectedCategory) val = String(selectedCategory.value);

      if (!val) {
        setError(field as any, msg);
        hasError = true;
      }
    });

    if (!data.purchase && !data.cashbank && !data.sale) {
      setError("purchase" as any, "Select at least one option");
      hasError = true;
    }

    if (hasError) {
      toast.error("Please fill all required fields.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // use transform to ensure payload is correctly mapped before post
    transform((data) => ({
      ...data,
      opening_date: openingDate ? openingDate.toISOString().split("T")[0] : "",
      fbr_date: fbrDate ? fbrDate.toISOString().split("T")[0] : "",
      country_id: country?.value ?? data.country_id,
      province_id: province?.value ?? data.province_id,
      city_id: city?.value ?? data.city_id,
      area_id: area?.value ?? data.area_id,
      subarea_id: subarea?.value ?? data.subarea_id,
      saleman_id: saleman?.value ?? data.saleman_id,
      type: accountType?.value ?? data.type,
      booker_id: booker?.value ?? data.booker_id,
      category: selectedCategory?.value ?? data.category,
    }));

    post(getSubmitUrl(), {
      preserveState: false,
      onSuccess: () => {
        toast.success("Account created successfully!");
        reset();
        // clear local selects/dates
        setCountry(null);
        setProvince(null);
        setCity(null);
        setArea(null);
        setSubarea(null);
        setProvinceOptions([]);
        setCityOptions([]);
        setAreaOptions([]);
        setSubareaOptions([]);
        setOpeningDate(undefined);
        setFbrDate(undefined);
        setSaleman(null);
        setBooker(null);
        setAccountType(null); // Clear account type to reset code logic
      },
      onError: (err) => {
        console.error("submit error", err);
        const firstError = Object.values(err)[0];
        toast.error(typeof firstError === 'string' ? firstError : "Failed to create account. Please check errors.");
      },
    });
  };

  // ✅ TypeScript-safe input change handler
  const onInputChange = <K extends keyof typeof data>(name: K, value: typeof data[K]) => {
    setData(name, value as any);
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
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* TOP STATUS DECK */}
              <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} grid grid-cols-1 md:grid-cols-12 gap-6 items-start relative`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${ACCENT_GRADIENT} ${PREMIUM_ROUNDING_MD && 'rounded-l-md'}`} />

                <div className="col-span-1 border-b pb-4 md:pb-0 md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-800 flex flex-col justify-center">
                  <div className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">Status</div>
                  <div className="flex flex-col gap-2">
                    {data.status && <SignalBadge text="ACTIVE" type="green" />}
                    {!data.status && <SignalBadge text="INACTIVE" type="red" />}
                    {isCustomer && <SignalBadge text="CUSTOMER" type="blue" />}
                    {isSupplier && <SignalBadge text="SUPPLIER" type="orange" />}
                  </div>
                </div>

                <div className="col-span-11 grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-4">
                    <TechLabel label="Registration Date" icon={CalendarDays} required>
                      <Popover open={openingOpen} onOpenChange={setOpeningOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              `w-full justify-between h-10 ${PREMIUM_ROUNDING_MD} font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 transition-all hover:border-orange-500`,
                              !openingDate && "text-zinc-400",
                              errors.opening_date && "border-rose-500"
                            )}
                          >
                            {openingDate
                              ? openingDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : "Select date"}
                            <CalendarDays size={14} className="text-zinc-400" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border border-zinc-300 dark:border-zinc-700 shadow-2xl" align="start">
                          <Calendar
                            mode="single"
                            selected={openingDate}
                            onSelect={(value) => {
                              setOpeningDate(value);
                              setOpeningOpen(false);
                              onInputChange("opening_date", value ? value.toISOString().split("T")[0] : "");
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </TechLabel>
                  </div>

                  <div className="md:col-span-4">
                    <TechLabel label="Account Code" icon={Hash} required error={errors.code}>
                      <Input
                        value={data.code}
                        onChange={(e) => onInputChange("code", e.target.value)}
                        placeholder="Auto-generated"
                        className={cn(
                          `h-10 border-zinc-200 dark:border-zinc-700 font-black text-sm tracking-[0.1em] bg-zinc-50 dark:bg-zinc-800 ${PREMIUM_ROUNDING_MD} text-orange-600 focus-visible:ring-orange-500 uppercase`,
                          errors.code && "border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                        )}
                      />
                    </TechLabel>
                  </div>

                  <div className="md:col-span-4">
                    <TechLabel label="Account Type" icon={Tags} required error={errors.type}>
                      <Select
                        value={accountType}
                        onChange={(opt) => {
                          setAccountType(opt);
                          setData("type", opt ? String(opt.value) : "");
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
                </div>
              </Card>

              {/* MAIN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT COLUMN */}
                <div className="space-y-6">

                  {/* IDENTITY CARD */}
                  <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                      <Type size={16} className="text-orange-500" />
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

                    {/* Permissions / Options */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-400">
                          <ShieldCheck size={12} />
                          Account Permissions
                        </div>
                        {errors.purchase && <SignalBadge text={errors.purchase} type="red" />}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`flex items-center gap-3 p-3 border ${PREMIUM_ROUNDING_MD} ${data.purchase ? 'bg-orange-500/5 border-orange-500/30' : 'bg-muted/10 border-zinc-200 dark:border-zinc-800'} transition-all`}>
                          <Checkbox
                            id="purchase"
                            checked={data.purchase}
                            onCheckedChange={(v) => onInputChange("purchase", !!v)}
                            className="data-[state=checked]:bg-orange-500 border-zinc-300 dark:border-zinc-600"
                          />
                          <Label htmlFor="purchase" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">Purchase</Label>
                        </div>
                        <div className={`flex items-center gap-3 p-3 border ${PREMIUM_ROUNDING_MD} ${data.cashbank ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-muted/10 border-zinc-200 dark:border-zinc-800'} transition-all`}>
                          <Checkbox
                            id="cashbank"
                            checked={data.cashbank}
                            onCheckedChange={(v) => onInputChange("cashbank", !!v)}
                            className="data-[state=checked]:bg-emerald-500 border-zinc-300 dark:border-zinc-600"
                          />
                          <Label htmlFor="cashbank" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">Cash/Bank</Label>
                        </div>
                        <div className={`flex items-center gap-3 p-3 border ${PREMIUM_ROUNDING_MD} ${data.sale ? 'bg-blue-500/5 border-blue-500/30' : 'bg-muted/10 border-zinc-200 dark:border-zinc-800'} transition-all`}>
                          <Checkbox
                            id="sale"
                            checked={data.sale}
                            onCheckedChange={(v) => onInputChange("sale", !!v)}
                            className="data-[state=checked]:bg-blue-500 border-zinc-300 dark:border-zinc-600"
                          />
                          <Label htmlFor="sale" className="text-xs font-bold uppercase tracking-tighter cursor-pointer">Sale</Label>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* FINANCIAL MATRIX */}
                  <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                      <DollarSign size={16} className="text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Financial Matrix</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TechLabel label="Opening Balance" icon={CreditCard} required error={errors.opening_balance}>
                        <Input
                          type="number"
                          value={data.opening_balance}
                          onChange={(e) => onInputChange("opening_balance", e.target.value)}
                          placeholder="0.00"
                          className={cn(
                            "h-10 font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-bold",
                            errors.opening_balance && "border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                          )}
                        />
                      </TechLabel>
                      <TechLabel label="Credit Limit" icon={ShieldCheck} required={isCustomer} error={errors.credit_limit}>
                        <Input
                          type="number"
                          value={data.credit_limit}
                          onChange={(e) => onInputChange("credit_limit", e.target.value)}
                          placeholder="999999"
                          className={cn(
                            "h-10 font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
                            errors.credit_limit && "border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                          )}
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
                          className={cn(
                            "h-10 font-mono text-sm bg-orange-50/50 dark:bg-orange-500/5 text-orange-600 border-orange-200 dark:border-orange-500/30 font-bold",
                            errors.aging_days && "border-rose-500 focus-visible:ring-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,1)]"
                          )}
                        />
                      </TechLabel>
                      <TechLabel label="CNIC / Identifier" icon={UserIcon}>
                        <Input
                          value={data.cnic}
                          onChange={(e) => onInputChange("cnic", e.target.value)}
                          placeholder="00000-0000000-0"
                          className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        />
                      </TechLabel>
                    </div>
                  </Card>

                  {/* CONTACT & REMARKS */}
                  <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                      <Phone size={16} className="text-blue-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Contact & Notes</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TechLabel label="Mobile (Primary)" icon={Phone}>
                        <Input
                          value={data.mobile}
                          onChange={(e) => onInputChange("mobile", e.target.value)}
                          placeholder="0300-0000000"
                          className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        />
                      </TechLabel>
                      <TechLabel label="Telephone" icon={Phone}>
                        <Input
                          value={data.telephone1}
                          onChange={(e) => onInputChange("telephone1", e.target.value)}
                          placeholder="Office/Home"
                          className="h-10 text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        />
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

                {/* RIGHT COLUMN */}
                <div className="space-y-6">

                  {/* LOCATION CARD */}
                  <Card className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING_MD} space-y-4`}>
                    <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                      <Globe size={16} className="text-cyan-500" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Location Logistics</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <TechLabel label="Country" icon={Globe}>
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
                      <TechLabel label="Province" icon={MapPin}>
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
                      <TechLabel label="City" icon={MapPin}>
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
                      <TechLabel label="Area" icon={MapPin}>
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

                    <TechLabel label="Sub-Area / Locality" icon={MapPin}>
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
                              type="button"
                              variant="outline"
                              className={cn(`w-full h-10 ${PREMIUM_ROUNDING_MD} font-normal text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700`, !fbrDate && "text-muted-foreground")}
                            >
                              {fbrDate ? fbrDate.toLocaleDateString("en-GB") : "Compliance Date"}
                              <CalendarDays size={12} className="ml-2 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="end">
                            <Calendar mode="single" selected={fbrDate} onSelect={(v) => { setFbrDate(v); setFbrOpen(false); onInputChange("fbr_date", v ? v.toISOString().split("T")[0] : ""); }} />
                          </PopoverContent>
                        </Popover>
                      </TechLabel>
                    </div>
                  </Card>
                </div>
              </div>

              {/* ACTION FOOTER */}
              <div className={`p-4 ${PREMIUM_GRADIENT} border border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} shadow-lg sticky bottom-4 z-30 flex justify-between items-center`}>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-orange-500" />
                  Account Identity Registry
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      reset();
                      setCountry(null);
                      setProvince(null);
                      setCity(null);
                      setArea(null);
                      setSubarea(null);
                      setProvinceOptions([]);
                      setCityOptions([]);
                      setAreaOptions([]);
                      setSubareaOptions([]);
                      setOpeningDate(new Date());
                      setFbrDate(undefined);
                      setSaleman(null);
                      setBooker(null);
                      setAccountType(null);
                      setSelectedCategory(null);
                    }}
                    className={`h-11 px-6 ${PREMIUM_ROUNDING_MD} font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900`}
                  >
                    Reset Form
                  </Button>
                  <Button type="submit" disabled={processing} className={`h-11 px-8 ${SIGNAL_ORANGE} transition-all font-black text-[10px] uppercase tracking-widest ${PREMIUM_ROUNDING_MD}`}>
                    {processing ? "Saving..." : "Create Account"}
                  </Button>
                </div>
              </div>
            </form>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
