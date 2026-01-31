"use client";

import React, { useState } from "react";
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

  // helper to compute submit url. If Ziggy's route helper is available on window, use it,
  // otherwise fallback to "/accounts".
  const getSubmitUrl = () => {
    try {
      // @ts-ignore - some projects expose route() globally via Ziggy
      if (typeof (window as any).route === "function") {
        return (window as any).route("accounts.store");
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
              {/* <CardHeader className="border-b">
                <CardTitle>Create Account</CardTitle>
              </CardHeader> */}

              <CardContent className="pt-1">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8">
                  {/* LEFT */}
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
                        name="address1"
                        placeholder="Enter address 1"
                        onChange={(e) => onInputChange("address1", e.target.value)}
                      />
                    </div>

                    <div>
                      <Label className="mb-1 block">Address 2</Label>
                      <Input
                        value={data.address2}
                        name="address2"
                        placeholder="Enter address 2"
                        onChange={(e) => onInputChange("address2", e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Telephone 1</Label>
                        <Input
                          value={data.telephone1}
                          name="telephone1"
                          placeholder="Enter telephone 1"
                          onChange={(e) => onInputChange("telephone1", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Telephone 2</Label>
                        <Input
                          value={data.telephone2}
                          name="telephone2"
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
                          name="fax"
                          placeholder="Enter fax"
                          onChange={(e) => onInputChange("fax", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Mobile</Label>
                        <Input
                          value={data.mobile}
                          name="mobile"
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
                          name="gst"
                          placeholder="Enter GST #"
                          onChange={(e) => onInputChange("gst", e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">NTN #</Label>
                        <Input
                          value={data.ntn}
                          name="ntn"
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

                  {/* RIGHT */}
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
                              <img src={`https://flagcdn.com/w40/${opt.code?.toLowerCase()}.png`} alt={opt.label} className="w-5 h-4 rounded" />
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
                      <div>
                        <Label className="mb-1 block">Item Category</Label>
                        <Nselect
                          value={data.item_category}
                          onValueChange={(v) => onInputChange("item_category", v)}
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
                            <SelectItem value="OTHER'S">OTHER'S</SelectItem>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Yearly">Yearly</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                            <SelectItem value="F">F</SelectItem>
                            <SelectItem value="G">G</SelectItem>
                            <SelectItem value="H">H</SelectItem>
                            <SelectItem value="I">I</SelectItem>
                            <SelectItem value="J">J</SelectItem>
                            <SelectItem value="K">K</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                            <SelectItem value="N">N</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="Q">Q</SelectItem>
                            <SelectItem value="R">R</SelectItem>
                            <SelectItem value="S">S</SelectItem>
                            <SelectItem value="T">T</SelectItem>
                            <SelectItem value="U">U</SelectItem>
                            <SelectItem value="V">V</SelectItem>
                            <SelectItem value="W">W</SelectItem>
                            <SelectItem value="X">X</SelectItem>
                            <SelectItem value="Y">Y</SelectItem>
                            <SelectItem value="Z">Z</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">A.T.S. %</Label>
                        <Input
                          value={data.ats_percentage}
                          onChange={(e) => onInputChange("ats_percentage", e.target.value)}
                          placeholder="Enter A.T.S. %"
                        />
                      </div>
                      <div>
                        <Label className="mb-1 block">A.T.S</Label>
                        <Nselect value={data.ats_type} onValueChange={(v) => onInputChange("ats_type", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select A.T.S" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Filer">Filer</SelectItem>
                            <SelectItem value="No-Filer">No-Filer</SelectItem>
                            <SelectItem value="Exempt">Exempt</SelectItem>
                            <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">CNIC #</Label>
                        <Input value={data.cnic} onChange={(e) => onInputChange("cnic", e.target.value)} />
                      </div>

                      <div>
                        <Label className="mb-1 block">FBR Date</Label>
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

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="status"
                        checked={!!data.status}
                        onCheckedChange={(v) => onInputChange("status", !!v)}
                      />
                      <Label htmlFor="status">Active</Label>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end mt-2 gap-3 pt-1 md:col-span-2">
                    <Button variant="outline" type="button" onClick={() => { reset(); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                      {processing ? "Saving..." : "Save"}
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
