"use client"

import * as React from "react"
import { useState } from "react"
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
import { CalendarIcon } from "lucide-react"
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
          <div className="flex flex-1 flex-col gap-6 p-4">
            <Card className="mx-auto w-full  shadow-md border ">
              <CardHeader className=" border-b">
                <CardTitle>Create Items</CardTitle>
              </CardHeader>

              <CardContent className="pt-1">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8">
                  {/* Left Section */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Date</Label>
                        <Popover open={openingOpen} onOpenChange={setOpeningOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "w-full justify-between text-left font-normal",
                                !openingDate && "text-muted-foreground"
                              )}
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
                              <CalendarIcon className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
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
                        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                      </div>

                      <div>
                        <Label className="mb-1 block">Code</Label>
                        <Input
                          value={data.code}
                          onChange={(e) => onInputChange("code", e.target.value)}
                          placeholder="Enter code"
                        />
                        {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1 block">Title</Label>
                      <Input value={data.title} onChange={(e) => onInputChange("title", e.target.value)} placeholder="Enter title" />
                      {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Short Name</Label>
                        <Input
                          value={data.short_name}
                          onChange={(e) => onInputChange("short_name", e.target.value)}
                          placeholder="Short Name"
                        />
                      </div>

                      <div>
                        <Label className="mb-1 block">Company</Label>
                        <ReactSelect
                          placeholder="Select Company"
                          styles={selectStyles}
                          options={companyOptions}
                          value={companyOptions.find((opt: any) => opt.value === String(data.company)) || null}
                          onChange={(opt: any) => onInputChange("company", opt ? opt.value : "")}
                          isSearchable
                          isClearable
                        />
                        {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">Trade Price</Label>
                        <Input
                          value={data.trade_price}
                          onChange={(e) => onInputChange("trade_price", e.target.value)}
                          placeholder="Trade Price"
                        />
                        {errors.trade_price && <p className="text-xs text-red-500 mt-1">{errors.trade_price}</p>}
                      </div>

                      <div>
                        <Label className="mb-1 block">Retail</Label>
                        <Input value={data.retail} onChange={(e) => onInputChange("retail", e.target.value)} placeholder="Retail" />
                      </div>

                      <div>
                        <Label className="mb-1 block">Retail OR T.P Diff %</Label>
                        <Input
                          value={data.retail_tp_diff}
                          onChange={(e) => onInputChange("retail_tp_diff", e.target.value)}
                          placeholder="T.P Diff %"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Re-Order Level</Label>
                        <Input value={data.reorder_level} onChange={(e) => onInputChange("reorder_level", e.target.value)} placeholder="Re-Order Level" />
                      </div>

                      <div>
                        <Label className="mb-1 block">Packing Qnty</Label>
                        <Input value={data.packing_qty} onChange={(e) => onInputChange("packing_qty", e.target.value)} placeholder="Packing Qnty" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Packing Size</Label>
                        <Input value={data.packing_size} onChange={(e) => onInputChange("packing_size", e.target.value)} placeholder="175gm" />
                      </div>

                      <div>
                        <Label className="mb-1 block">Pcs</Label>
                        <Input value={data.pcs} onChange={(e) => onInputChange("pcs", e.target.value)} placeholder="Pcs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Formation</Label>
                        <Nselect value={data.formation ?? ""} onValueChange={(v) => onInputChange("formation", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Formation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ledger">Ledger</SelectItem>
                            <SelectItem value="head">Head</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                      <div>
                        <Label className="mb-1 block">Type</Label>
                        <Nselect value={data.type ?? ""} onValueChange={(v) => onInputChange("type", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ledger">Ledger</SelectItem>
                            <SelectItem value="head">Head</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Category</Label>
                        <ReactSelect
                          placeholder="Select Category"
                          styles={selectStyles}
                          options={categoryOptions}
                          value={categoryOptions.find((opt: any) => opt.value === String(data.category)) || null}
                          onChange={(opt: any) => onInputChange("category", opt ? opt.value : "")}
                          isSearchable
                          isClearable
                        />
                      </div>


                      <div>
                        <Label className="mb-1 block">Shelf</Label>
                        <Nselect value={data.shelf ?? ""} onValueChange={(v) => onInputChange("shelf", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Shelf" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ledger">Ledger</SelectItem>
                            <SelectItem value="head">Head</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">GST % /Amt</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={data.gst_percent} onChange={(e) => onInputChange("gst_percent", e.target.value)} placeholder="GST %" />
                          <Input value={data.gst_amount} onChange={(e) => onInputChange("gst_amount", e.target.value)} placeholder="Amt" />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-1 block">Adv Tax Filer % / NonFiler / Manufacturer</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input value={data.adv_tax_filer} onChange={(e) => onInputChange("adv_tax_filer", e.target.value)} placeholder="Adv Tax Filer %" />
                          <Input value={data.adv_tax_non_filer} onChange={(e) => onInputChange("adv_tax_non_filer", e.target.value)} placeholder="NonFiler" />
                          <Input value={data.adv_tax_manufacturer} onChange={(e) => onInputChange("adv_tax_manufacturer", e.target.value)} placeholder="Manufacturer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <Separator orientation="vertical" className="mx-auto hidden md:block h-full" />

                  {/* Right Section */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">Discount</Label>
                        <Input value={data.discount} onChange={(e) => onInputChange("discount", e.target.value)} placeholder="Discount" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Packing Full</Label>
                        <Input value={data.packing_full} onChange={(e) => onInputChange("packing_full", e.target.value)} placeholder="Packing full" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Packing Pcs</Label>
                        <Input value={data.packing_pcs} onChange={(e) => onInputChange("packing_pcs", e.target.value)} placeholder="Packing Pcs" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">Limit Pcs</Label>
                        <Input value={data.limit_pcs} onChange={(e) => onInputChange("limit_pcs", e.target.value)} placeholder="Limit Pcs" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Order Qty</Label>
                        <Input value={data.order_qty} onChange={(e) => onInputChange("order_qty", e.target.value)} placeholder="Order Qty" />
                      </div>
                      <div>
                        <Label className="mb-1 block">Weight</Label>
                        <Input value={data.weight} onChange={(e) => onInputChange("weight", e.target.value)} placeholder="Weight" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="mb-1 block">Stock</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={data.stock_1} onChange={(e) => onInputChange("stock_1", e.target.value)} />
                          <Input value={data.stock_2} onChange={(e) => onInputChange("stock_2", e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <Label className="mb-3 block">Check out</Label>
                        <div className="flex items-center flex-wrap gap-5">
                          <div className="flex items-center gap-2">
                            <Checkbox id="Import" checked={!!data.is_import} onCheckedChange={(v) => onInputChange("is_import", !!v)} />
                            <Label htmlFor="Import" className="mb-1 block">Import</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="fridge" checked={!!data.is_fridge} onCheckedChange={(v) => onInputChange("is_fridge", !!v)} />
                            <Label htmlFor="fridge" className="mb-1 block">Fridge</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="active" checked={!!data.is_active} onCheckedChange={(v) => onInputChange("is_active", !!v)} />
                            <Label htmlFor="active" className="mb-1 block">Active</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox id="recipe" checked={!!data.is_recipe} onCheckedChange={(v) => onInputChange("is_recipe", !!v)} />
                            <Label htmlFor="recipe" className="mb-1 block">Recipe</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PT fields */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">Loose (T.P.2)</Label>
                        <Input placeholder="Loose (T.P.2)" value={data.pt2} onChange={(e) => onInputChange("pt2", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label className="mb-1 block">Retail (T.P.3)</Label>
                        <Input placeholder="Retail (T.P.3)" value={data.pt3} onChange={(e) => onInputChange("pt3", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">Agent (T.P.4)</Label>
                        <Input placeholder="Agent (T.P.4)" value={data.pt4} onChange={(e) => onInputChange("pt4", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label className="mb-1 block">T.P.5</Label>
                        <Input placeholder="T.P.5" value={data.pt5} onChange={(e) => onInputChange("pt5", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="mb-1 block">T.P.6</Label>
                        <Input placeholder="T.P.6" value={data.pt6} onChange={(e) => onInputChange("pt6", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label className="mb-1 block">T.P.7</Label>
                        <Input placeholder="T.P.7" value={data.pt7} onChange={(e) => onInputChange("pt7", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - inside form so Save submits */}
                  <div className="flex justify-end mt-2 gap-3 pt-1 md:col-span-3">
                    <Button variant="outline" type="button" onClick={() => { reset(); setOpeningDate(undefined); }}>
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
  )
}
