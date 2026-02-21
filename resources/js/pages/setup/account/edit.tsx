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
import { useForm } from "@inertiajs/react";
import { CalendarIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import axios from "axios";
import { route } from "ziggy-js";

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

  // ---------- Inertia Form (Moved Up) ----------
  const { data, setData, put, processing, errors, transform } = useForm<AccountForm>({
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
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 p-4">
            <Card className="mx-auto w-full shadow-md border">
              <CardContent className="pt-4">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT COLUMN: Basic Info & Contact */}
                    <div className="space-y-6">
                      <div className="border-b pb-2 mb-4">
                        <h3 className="text-lg font-semibold">Basic Info & Contact</h3>
                        <p className="text-sm text-muted-foreground">General identity and contact details</p>
                      </div>

                      {/* Code & Title */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Code</Label>
                          <Input
                            value={data.code}
                            onChange={(e) => onInputChange("code", e.target.value)}
                            placeholder="000001"
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
                      <div className="border-b pb-2 mb-4">
                        <h3 className="text-lg font-semibold">Location & Details</h3>
                        <p className="text-sm text-muted-foreground">Geographic and categorization data</p>
                      </div>

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
                                {opt.code && <img src={`https://flagcdn.com/w40/${opt.code?.toLowerCase()}.png`} alt={opt.label} className="w-5 h-4 rounded object-cover" />}
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
                            onChange={(opt: any) => onInputChange("note_head", opt ? String(opt.value) : "")}
                            placeholder="Select Note Head"
                            className="text-sm"
                            styles={customStyles}
                          />
                        </div>
                        <div>
                          <Label className="mb-2 block">Category (Dynamic)</Label>
                          <Select
                            options={categoryOptions}
                            value={selectedCategory}
                            onChange={(opt: any) => {
                              setSelectedCategory(opt);
                              onInputChange("category", opt ? String(opt.value) : "");
                            }}
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
                            onChange={(opt: any) => onInputChange("item_category", opt ? String(opt.value) : "")}
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
                                { value: "Included", label: "Included" },
                                { value: "Excluded", label: "Excluded" },
                              ]}
                              value={data.ats_type ? { value: data.ats_type, label: data.ats_type } : null}
                              onChange={(opt: any) => onInputChange("ats_type", opt ? String(opt.value) : "")}
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
                        <Label htmlFor="status" className="cursor-pointer">Active Account</Label>
                      </div>

                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button type="submit" disabled={processing} className="px-8">
                      {processing ? "Updating..." : "Update Account"}
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
