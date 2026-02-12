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

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "/account" },
  { title: "Create", href: "/account/create" },
];

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
  value: number;
  label: string;
  code?: string;
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
}

export default function Create({
  countries,
  salemans,
  bookers,
  accountTypes,
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

  const [openingDate, setOpeningDate] = useState<Date | undefined>();
  const [openingOpen, setOpeningOpen] = useState(false);

  const [fbrDate, setFbrDate] = useState<Date | undefined>();
  const [fbrOpen, setFbrOpen] = useState(false);

  const [saleman, setSaleman] = useState<Option | null>(null);
  const [booker, setBooker] = useState<Option | null>(null);
  const [accountType, setAccountType] = useState<Option | null>(null);

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

  // Define custom styles for react-select to match Shadcn UI
  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
      borderRadius: "var(--radius)",
      boxShadow: state.isFocused ? "0 0 0 1px var(--ring)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "var(--ring)" : "var(--border)",
      },
      minHeight: "40px", // h-10
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
      opacity: state.isDisabled ? 0.5 : 1,
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
      fontSize: "0.875rem",
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)",
      backgroundColor: "var(--popover)",
      color: "var(--popover-foreground)",
      zIndex: 50,
      padding: "4px",
    }),
    option: (base: any, state: any) => ({
      ...base,
      borderRadius: "calc(var(--radius) - 2px)",
      backgroundColor: state.isSelected
        ? "var(--primary)"
        : state.isFocused
          ? "var(--accent)"
          : "transparent",
      color: state.isSelected
        ? "var(--primary-foreground)"
        : state.isFocused
          ? "var(--accent-foreground)"
          : "var(--foreground)",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "var(--accent)",
      },
      fontSize: "0.875rem",
      padding: "8px 12px",
    }),
    input: (base: any) => ({
      ...base,
      color: "var(--foreground)",
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      color: "var(--muted-foreground)",
      "&:hover": {
        color: "var(--foreground)",
      },
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

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
      fetchProvinces(opt.value);
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
      fetchCities(opt.value);
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
      fetchAreas(opt.value);
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
      fetchSubareas(opt.value);
      setData("area_id", String(opt.value));
    } else {
      setData("area_id", "");
    }
  };

  // ---------- Inertia form ----------
  const { data, setData, post, processing, errors, reset } = useForm({
    code: "",
    title: "",
    type: "",
    purchase: false,
    cashbank: false,
    sale: false,
    opening_balance: "",
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
    opening_date: "",
    fbr_date: "",
    country_id: "",
    province_id: "",
    city_id: "",
    area_id: "",
    subarea_id: "",
    saleman_id: "",
    booker_id: "",
    credit_limit: "",
    aging_days: "",
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

    // ensure date strings in yyyy-mm-dd (ISO date portion)
    const opening_date = openingDate ? openingDate.toISOString().split("T")[0] : "";
    const fbr_date = fbrDate ? fbrDate.toISOString().split("T")[0] : "";

    // ensure we keep selected IDs (some were already set on change, but ensure final)
    const payload = {
      ...data,
      opening_date,
      fbr_date,
      country_id: country?.value ?? data.country_id,
      province_id: province?.value ?? data.province_id,
      city_id: city?.value ?? data.city_id,
      area_id: area?.value ?? data.area_id,
      subarea_id: subarea?.value ?? data.subarea_id,
      saleman_id: saleman?.value ?? data.saleman_id,
      type: accountType?.value ?? data.type,
      booker_id: booker?.value ?? data.booker_id,
    };

    post(getSubmitUrl(), {
      preserveState: false,
      onSuccess: () => {
        
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
        toast.error("Failed to create account. Please check errors.");
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
          <div className="flex flex-1 flex-col gap-6 p-4">
            <Card className="mx-auto w-full shadow-md border">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* LEFT COLUMN: Basic Info & Contact */}
                    <div className="space-y-6">

                      {/* Code & Title */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Code</Label>
                          <Input
                            value={data.code}
                            onChange={(e) => onInputChange("code", e.target.value)}
                            placeholder="Auto-generated"
                          />
                          {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                        </div>

                        <div>
                          <Label className="mb-2 block">Title</Label>
                          <Input
                            value={data.title}
                            onChange={(e) => onInputChange("title", e.target.value)}
                            placeholder="Enter title"
                          />
                          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                        </div>
                      </div>

                      {/* Account Type */}
                      <div>
                        <Label className="mb-2 block">Account Type</Label>
                        <Select
                          value={accountType}
                          onChange={(opt) => {
                            setAccountType(opt);
                            setData("type", opt ? String(opt.value) : "");
                          }}
                          options={accountTypeOptions}
                          placeholder="Select account type"
                          isSearchable
                          className="text-sm"
                          styles={customStyles}
                        />
                        {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                      </div>

                      {/* Checkboxes */}
                      <div className="border rounded-md p-4 bg-muted/20">
                        <Label className="mb-3 block font-semibold text-sm">Account Options</Label>
                        <div className="flex items-center flex-wrap gap-6">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="purchase"
                              checked={data.purchase}
                              onCheckedChange={(v) => onInputChange("purchase", !!v)}
                            />
                            <Label htmlFor="purchase" className="cursor-pointer">Purchase</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="cashbank"
                              checked={data.cashbank}
                              onCheckedChange={(v) => onInputChange("cashbank", !!v)}
                            />
                            <Label htmlFor="cashbank" className="cursor-pointer">Cash / Bank</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="sale"
                              checked={data.sale}
                              onCheckedChange={(v) => onInputChange("sale", !!v)}
                            />
                            <Label htmlFor="sale" className="cursor-pointer">Sale</Label>
                          </div>
                        </div>
                      </div>

                      {/* Opening Balance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Opening Date</Label>
                          <Popover open={openingOpen} onOpenChange={setOpeningOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn("w-full justify-between text-left font-normal", !openingDate && "text-muted-foreground")}
                              >
                                {openingDate
                                  ? openingDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                  : "Select date"}
                                <CalendarIcon className="h-4 w-4 opacity-60" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
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
                        </div>
                        <div>
                          <Label className="mb-2 block">Opening Balance</Label>
                          <Input
                            value={data.opening_balance}
                            type="number"
                            placeholder="0.00"
                            onChange={(e) => onInputChange("opening_balance", e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Address & Contact */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <Label className="mb-2 block">Address 1</Label>
                            <Input
                              value={data.address1}
                              onChange={(e) => onInputChange("address1", e.target.value)}
                              placeholder="Complete address line 1"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Address 2</Label>
                            <Input
                              value={data.address2}
                              onChange={(e) => onInputChange("address2", e.target.value)}
                              placeholder="Complete address line 2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-2 block">Mobile (Primary)</Label>
                            <Input
                              value={data.mobile}
                              onChange={(e) => onInputChange("mobile", e.target.value)}
                              placeholder="0300-1234567"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Telephone 1</Label>
                            <Input
                              value={data.telephone1}
                              onChange={(e) => onInputChange("telephone1", e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-2 block">Telephone 2</Label>
                            <Input
                              value={data.telephone2}
                              onChange={(e) => onInputChange("telephone2", e.target.value)}
                              placeholder="Alt phone number"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Fax</Label>
                            <Input
                              value={data.fax}
                              onChange={(e) => onInputChange("fax", e.target.value)}
                              placeholder="Fax number"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="mb-2 block">Remarks</Label>
                            <Input
                              value={data.remarks}
                              onChange={(e) => onInputChange("remarks", e.target.value)}
                              placeholder="Additional remarks"
                            />
                          </div>
                          <div>
                            <Label className="mb-2 block">Regards</Label>
                            <Input
                              value={data.regards}
                              onChange={(e) => onInputChange("regards", e.target.value)}
                              placeholder="Details..."
                            />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Location & Details */}
                    <div className="space-y-6">

                      {/* Location Hierarchy */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Country</Label>
                          <Select
                            options={countryOptions}
                            value={country}
                            onChange={(opt) => handleCountryChange(opt as Option)}
                            placeholder="Select country..."
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                            formatOptionLabel={(opt: any) => (
                              <div className="flex items-center gap-2">
                                <img src={`https://flagcdn.com/w40/${opt.code?.toLowerCase()}.png`} alt={opt.label} className="w-5 h-4 rounded object-cover" />
                                <span>{opt.label}</span>
                              </div>
                            )}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Province</Label>
                          <Select
                            options={provinceOptions}
                            value={province}
                            onChange={(opt) => handleProvinceChange(opt as Option)}
                            placeholder={country ? "Select province..." : "Select country first..."}
                            isDisabled={!country}
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>City</Label>
                          <Select
                            options={cityOptions}
                            value={city}
                            onChange={(opt) => handleCityChange(opt as Option)}
                            placeholder={province ? "Select city..." : "Select province first..."}
                            isDisabled={!province}
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label>Area</Label>
                          <Select
                            options={areaOptions}
                            value={area}
                            onChange={(opt) => handleAreaChange(opt as Option)}
                            placeholder={city ? "Select area..." : "Select city first..."}
                            isDisabled={!city}
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label>Sub Area</Label>
                        <Select
                          options={subareaOptions}
                          value={subarea}
                          onChange={(opt) => {
                            setSubarea(opt as Option | null);
                            setData("subarea_id", opt ? String((opt as Option).value) : "");
                          }}
                          placeholder={area ? "Select subarea..." : "Select area first..."}
                          isDisabled={!area}
                          isSearchable
                          className="text-sm"
                          styles={customStyles}
                        />
                      </div>

                      {/* Salesman & Booker */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Salesman</Label>
                          <Select
                            value={saleman}
                            onChange={(opt) => {
                              setSaleman(opt as Option);
                              setData("saleman_id", opt ? String((opt as Option).value) : "");
                            }}
                            options={salemanOptions}
                            placeholder="Select salesman"
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Booker</Label>
                          <Select
                            value={booker}
                            onChange={(opt) => {
                              setBooker(opt as Option);
                              setData("booker_id", opt ? String((opt as Option).value) : "");
                            }}
                            options={bookerOptions}
                            placeholder="Select booker"
                            isSearchable
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                      </div>

                      {/* Financial Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Credit Limit</Label>
                          <Input
                            value={data.credit_limit}
                            type="number"
                            onChange={(e) => onInputChange("credit_limit", e.target.value)}
                            placeholder="Amount..."
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Aging Days</Label>
                          <Input
                            value={data.aging_days}
                            type="number"
                            onChange={(e) => onInputChange("aging_days", e.target.value)}
                            placeholder="Days..."
                          />
                        </div>
                      </div>

                      {/* Tax & Identifiers */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">GST #</Label>
                          <Input
                            value={data.gst}
                            onChange={(e) => onInputChange("gst", e.target.value)}
                            placeholder="GST Number"
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">NTN #</Label>
                          <Input
                            value={data.ntn}
                            onChange={(e) => onInputChange("ntn", e.target.value)}
                            placeholder="NTN Number"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">CNIC #</Label>
                          <Input value={data.cnic} onChange={(e) => onInputChange("cnic", e.target.value)} placeholder="CNIC Number" />
                        </div>
                        <div>
                          <Label className="mb-2 block">FBR Date</Label>
                          <Popover open={fbrOpen} onOpenChange={setFbrOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn("w-full justify-between text-left font-normal", !fbrDate && "text-muted-foreground")}
                              >
                                {fbrDate
                                  ? fbrDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                                  : "Select date"}
                                <CalendarIcon className="h-4 w-4 opacity-60" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={fbrDate}
                                onSelect={(value) => {
                                  setFbrDate(value);
                                  setFbrOpen(false);
                                  onInputChange("fbr_date", value ? value.toISOString().split("T")[0] : "");
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Misc */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Note Head</Label>
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
                            onChange={(opt: any) => onInputChange("note_head", opt ? opt.value : "")}
                            placeholder="Select Note Head"
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Category</Label>
                          <Select
                            options={[
                              { value: "OTHER'S", label: "OTHER'S" },
                              { value: "A", label: "A" },
                              { value: "B", label: "B" },
                              { value: "C", label: "C" },
                              { value: "D", label: "D" },
                              { value: "Monthly", label: "Monthly" },
                              { value: "Yearly", label: "Yearly" },
                            ]}
                            value={data.category ? { value: data.category, label: data.category } : null}
                            onChange={(opt: any) => onInputChange("category", opt ? opt.value : "")}
                            placeholder="Select Category"
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Item Category</Label>
                          <Select
                            options={[
                              { value: "1", label: "1" },
                              { value: "2", label: "2" },
                              { value: "3", label: "3" },
                              { value: "4", label: "4" },
                              { value: "5", label: "5" },
                            ]}
                            value={data.item_category ? { value: data.item_category, label: data.item_category } : null}
                            onChange={(opt: any) => onInputChange("item_category", opt ? opt.value : "")}
                            placeholder="Select Item Category"
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">A.T.S Info</Label>
                          <div className="flex gap-2">
                            <Input
                              value={data.ats_percentage}
                              onChange={(e) => onInputChange("ats_percentage", e.target.value)}
                              placeholder="%"
                              className="w-20"
                            />
                            <Select
                              options={[
                                { value: "Filer", label: "Filer" },
                                { value: "No-Filer", label: "No-Filer" },
                                { value: "Exempt", label: "Exempt" },
                                { value: "Manufacturer", label: "Manufacturer" },
                              ]}
                              value={data.ats_type ? { value: data.ats_type, label: data.ats_type } : null}
                              onChange={(opt: any) => onInputChange("ats_type", opt ? opt.value : "")}
                              placeholder="Type"
                              className="w-full text-sm"
                              styles={customStyles}
                            />
                          </div>
                        </div>
                      </div>


                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Checkbox
                          id="status"
                          checked={!!data.status}
                          onCheckedChange={(v) => onInputChange("status", !!v)}
                        />
                        <Label htmlFor="status">Active Account</Label>
                      </div>

                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => reset()}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={processing} className="px-8">
                      {processing ? "Saving..." : "Create Account"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
