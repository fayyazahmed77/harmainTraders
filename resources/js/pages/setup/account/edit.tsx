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
import {
  Select as Nselect,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "/account" },
  { title: "Edit", href: "#" },
];

interface Option {
  value: number;
  label: string;
  code?: string;
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
  country_id: string;
  province_id: string;
  city_id: string;
  area_id: string;
  subarea_id: string;
  saleman_id: string;
  booker_id: string;
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

  // ---------- Inertia Form (Moved Up) ----------
  const { data, setData, put, processing, errors, transform } = useForm<AccountForm>({
    ...account,
    // ensure boolean types
    purchase: Boolean(account.purchase),
    cashbank: Boolean(account.cashbank),
    sale: Boolean(account.sale),
    gst: account.gst ?? "",
    ntn: account.ntn ?? "",
    remarks: account.remarks ?? "",
    regards: account.regards ?? "",
    note_head: account.note_head ?? "",
    category: account.category ?? "",
    cnic: account.cnic ?? "",
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
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8">
                  {/* LEFT COLUMN */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Code</Label>
                        <Input
                          value={data.code}
                          onChange={(e) => onInputChange("code", e.target.value)}
                          placeholder="000001"
                        />
                        {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                      </div>

                      <div>
                        <Label className="mb-1 block">Title</Label>
                        <Input
                          value={data.title}
                          onChange={(e) => onInputChange("title", e.target.value)}
                          placeholder="Enter title"
                        />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Account Type</Label>
                        <Nselect
                          value={accountType?.value?.toString() ?? ""}
                          onValueChange={(value) => {
                            const selected = accountTypeOptions.find((s) => s.value.toString() === value);
                            setAccountType(selected || null);
                            setData("type", selected ? String(selected.value) : "");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account type" />
                          </SelectTrigger>
                          <SelectContent>
                            {accountTypeOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value.toString()}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Nselect>
                      </div>

                      <div>
                        <Label className="mb-3 block">Check Option</Label>
                        <div className="flex items-center flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="purchase"
                              checked={data.purchase}
                              onCheckedChange={(v) => onInputChange("purchase", !!v)}
                            />
                            <Label htmlFor="purchase" className="mb-1 block">Purchase</Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="cashbank"
                              checked={data.cashbank}
                              onCheckedChange={(v) => onInputChange("cashbank", !!v)}
                            />
                            <Label htmlFor="cashbank" className="mb-1 block">Cash / Bank</Label>
                          </div>

                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="sale"
                              checked={data.sale}
                              onCheckedChange={(v) => onInputChange("sale", !!v)}
                            />
                            <Label htmlFor="sale" className="mb-1 block">Sale</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="date" className="mb-1 block">Opening Date</Label>
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
                        <Label className="mb-1 block">Opening Balance</Label>
                        <Input
                          value={data.opening_balance}
                          placeholder="Enter opening balance"
                          onChange={(e) => onInputChange("opening_balance", e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1 block">Address 1</Label>
                      <Input
                        value={data.address1}
                        placeholder="Enter address 1"
                        onChange={(e) => onInputChange("address1", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="mb-1 block">Address 2</Label>
                      <Input
                        value={data.address2}
                        placeholder="Enter address 2"
                        onChange={(e) => onInputChange("address2", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Telephone 1</Label>
                        <Input
                          value={data.telephone1}
                          placeholder="Enter telephone 1"
                          onChange={(e) => onInputChange("telephone1", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Telephone 2</Label>
                        <Input
                          value={data.telephone2}
                          placeholder="Enter telephone 2"
                          onChange={(e) => onInputChange("telephone2", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Fax</Label>
                        <Input
                          value={data.fax}
                          placeholder="Enter fax"
                          onChange={(e) => onInputChange("fax", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Mobile</Label>
                        <Input
                          value={data.mobile}
                          placeholder="Enter mobile"
                          onChange={(e) => onInputChange("mobile", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">GST #</Label>
                        <Input
                          value={data.gst}
                          placeholder="Enter GST #"
                          onChange={(e) => onInputChange("gst", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">NTN #</Label>
                        <Input
                          value={data.ntn}
                          placeholder="Enter NTN #"
                          onChange={(e) => onInputChange("ntn", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Remarks</Label>
                        <Input
                          value={data.remarks}
                          onChange={(e) => onInputChange("remarks", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Regards</Label>
                        <Input
                          value={data.regards}
                          onChange={(e) => onInputChange("regards", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="mx-auto hidden md:block h-full" />

                  {/* RIGHT COLUMN */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Country</Label>
                        <Select
                          options={countryOptions}
                          value={country}
                          onChange={(opt) => handleCountryChange(opt as Option)}
                          placeholder="Select country..."
                          isSearchable
                          formatOptionLabel={(opt: any) => (
                            <div className="flex items-center gap-2">
                              {opt.code && <img src={`https://flagcdn.com/w40/${opt.code?.toLowerCase()}.png`} alt={opt.label} className="w-5 h-4 rounded" />}
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
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>City</Label>
                        <Select
                          options={cityOptions}
                          value={city}
                          onChange={(opt) => handleCityChange(opt as Option)}
                          placeholder={province ? "Select city..." : "Select province first..."}
                          isDisabled={!province}
                          isSearchable
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
                      />
                    </div>

                    <div>
                      <Label className="mb-1 block">Note Head</Label>
                      <Nselect
                        value={data.note_head}
                        onValueChange={(v) => onInputChange("note_head", v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Note Head" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Legal Expenses">Legal Expenses</SelectItem>
                          <SelectItem value="Bank Charges">Bank Charges</SelectItem>
                          <SelectItem value="Depreciation">Depreciation</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                          <SelectItem value="Promotional & Marketing">Promotional & Marketing</SelectItem>
                          <SelectItem value="Daily Customer">Daily Customer</SelectItem>
                          <SelectItem value="Zakat">Zakat</SelectItem>
                          <SelectItem value="Home Expenses">Home Expenses</SelectItem>
                          <SelectItem value="Office Expenses">Office Expenses</SelectItem>
                        </SelectContent>
                      </Nselect>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Salesman</Label>
                        <Nselect
                          value={saleman?.value?.toString() ?? ""}
                          onValueChange={(value) => {
                            const selected = salemanOptions.find((s) => s.value.toString() === value);
                            setSaleman(selected || null);
                            setData("saleman_id", selected ? String(selected.value) : "");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select salesman" />
                          </SelectTrigger>
                          <SelectContent>
                            {salemanOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value.toString()}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Nselect>
                      </div>

                      <div>
                        <Label className="mb-1 block">Booker</Label>
                        <Nselect
                          value={booker?.value?.toString() ?? ""}
                          onValueChange={(value) => {
                            const selected = bookerOptions.find((b) => b.value.toString() === value);
                            setBooker(selected || null);
                            setData("booker_id", selected ? String(selected.value) : "");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select booker" />
                          </SelectTrigger>
                          <SelectContent>
                            {bookerOptions.map((b) => (
                              <SelectItem key={b.value} value={b.value.toString()}>
                                {b.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Credit Limit</Label>
                        <Input
                          value={data.credit_limit}
                          onChange={(e) => onInputChange("credit_limit", e.target.value)}
                          placeholder="Enter credit limit"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">Aging Days</Label>
                        <Input
                          value={data.aging_days}
                          onChange={(e) => onInputChange("aging_days", e.target.value)}
                          placeholder="Enter aging days"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label>Item Category</Label>
                        <Nselect
                          value={String(data.item_category ?? "")}
                          onValueChange={(val) => setData("item_category", val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Item Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>

                      <div>
                        <Label className="mb-1 block">Category</Label>
                        <Nselect
                          value={data.category}
                          onValueChange={(v) => onInputChange("category", v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Distributor">Distributor</SelectItem>
                            <SelectItem value="Wholesaler">Wholesaler</SelectItem>
                            <SelectItem value="Retailer">Retailer</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">ATS Percentage</Label>
                        <Input
                          value={data.ats_percentage}
                          onChange={(e) => onInputChange("ats_percentage", e.target.value)}
                          placeholder="%"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">ATS Type</Label>
                        <Nselect
                          value={data.ats_type}
                          onValueChange={(v) => onInputChange("ats_type", v)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Included">Included</SelectItem>
                            <SelectItem value="Excluded">Excluded</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1 block">CNIC</Label>
                      <Input
                        value={data.cnic}
                        onChange={(e) => onInputChange("cnic", e.target.value)}
                        placeholder="Enter CNIC"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">FBR Date</Label>
                        <Popover open={fbrOpen} onOpenChange={setFbrOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn("w-full justify-between text-left font-normal", !fbrDate && "text-muted-foreground")}
                            >
                              {fbrDate ? fbrDate.toLocaleDateString("en-GB") : "Select date"}
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
                      <div>
                        <Label className="mb-1 block">Status</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id="status"
                            checked={data.status}
                            onCheckedChange={(v) => onInputChange("status", !!v)}
                          />
                          <Label htmlFor="status">Active</Label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" disabled={processing} className="w-full">
                        {processing ? "Updating..." : "Update Account"}
                      </Button>
                    </div>

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
