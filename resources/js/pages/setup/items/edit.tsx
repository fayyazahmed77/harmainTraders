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
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { router } from "@inertiajs/react"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbItem } from "@/types"
import { toast } from "sonner"

interface Props {
  item: any
  categories: any
  pagination: {
    prev_id: number | null
    next_id: number | null
    current: number
    total: number
  }
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Items", href: "/items" },
  { title: "Edit", href: "/items/edit" },
]

export default function Page({ item, categories, pagination }: Props) {
  // Parse date
  const initialDate = item.date ? new Date(item.date) : undefined
  const [openingDate, setOpeningDate] = useState<Date | undefined>(initialDate)
  const [openingOpen, setOpeningOpen] = useState(false)

  // Initialise form with item data
  const { data, setData, put, processing, reset } = useForm({
    date: item.date ?? "",
    code: item.code ?? "",
    title: item.title ?? "",
    short_name: item.short_name ?? "",
    company: item.company ?? "",
    trade_price: item.trade_price ?? "",
    retail: item.retail ?? "",
    retail_tp_diff: item.retail_tp_diff ?? "",
    reorder_level: item.reorder_level ?? "",
    packing_qty: item.packing_qty ?? "",
    packing_size: item.packing_size ?? "",
    pcs: item.pcs ?? "",
    formation: item.formation ?? "",
    type: item.type ?? "",
    category: item.category ?? "",
    shelf: item.shelf ?? "",
    gst_percent: item.gst_percent ?? "",
    gst_amount: item.gst_amount ?? "",
    adv_tax_filer: item.adv_tax_filer ?? "",
    adv_tax_non_filer: item.adv_tax_non_filer ?? "",
    adv_tax_manufacturer: item.adv_tax_manufacturer ?? "",
    discount: item.discount ?? "",
    packing_full: item.packing_full ?? "",
    packing_pcs: item.packing_pcs ?? "",
    limit_pcs: item.limit_pcs ?? "",
    order_qty: item.order_qty ?? "",
    weight: item.weight ?? "",
    stock_1: item.stock_1 ?? "",
    stock_2: item.stock_2 ?? "",
    is_import: !!item.is_import,
    is_fridge: !!item.is_fridge,
    is_active: !!item.is_active,
    is_recipe: !!item.is_recipe,
    pt2: item.pt2 ?? "",
    pt3: item.pt3 ?? "",
    pt4: item.pt4 ?? "",
    pt5: item.pt5 ?? "",
    pt6: item.pt6 ?? "",
    pt7: item.pt7 ?? "",
  })

  const onInputChange = (key: keyof typeof data, value: any) =>
    setData(key, value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      ...data,
      date: openingDate ? openingDate.toISOString().split("T")[0] : data.date,
    }

    put(`/items/${item.id}`, {
      onSuccess: () => toast.success("Item updated successfully"),
      onError: () => toast.error("Please fix the errors"),
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
            <Card className="mx-auto w-full shadow-md border">
              <CardHeader className="border-b flex flex-row items-center justify-between py-3">
                <CardTitle>Edit Item</CardTitle>

                {/* Pagination Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-blue-100 rounded-lg overflow-hidden bg-white shadow-sm">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-10 rounded-none border-r border-blue-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      disabled={!pagination.prev_id}
                      onClick={() => pagination.prev_id && router.visit(`/items/${pagination.prev_id}/edit`)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-10 rounded-none text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      disabled={!pagination.next_id}
                      onClick={() => pagination.next_id && router.visit(`/items/${pagination.next_id}/edit`)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm font-medium text-gray-700 tabular-nums">
                    {pagination.current} <span className="text-gray-400 font-normal">of</span> {pagination.total}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-1">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8">

                  {/* LEFT SECTION */}
                  <div className="space-y-4">

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Date</Label>
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
                                : data.date}

                              <CalendarIcon className="h-4 w-4 opacity-60" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={openingDate}
                              onSelect={(value) => {
                                setOpeningDate(value ?? undefined)
                                onInputChange(
                                  "date",
                                  value ? value.toISOString().split("T")[0] : ""
                                )
                                setOpeningOpen(false)
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label>Code</Label>
                        <Input value={data.code} onChange={(e) => onInputChange("code", e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <Label>Title</Label>
                      <Input value={data.title} onChange={(e) => onInputChange("title", e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Short Name</Label>
                        <Input value={data.short_name} onChange={(e) => onInputChange("short_name", e.target.value)} />
                      </div>

                      <div>
                        <Label>Company</Label>
                        <Nselect value={data.company} onValueChange={(v) => onInputChange("company", v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ledger">Ledger</SelectItem>
                            <SelectItem value="head">Head</SelectItem>
                          </SelectContent>
                        </Nselect>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Trade Price</Label>
                        <Input value={data.trade_price} onChange={(e) => onInputChange("trade_price", e.target.value)} />
                      </div>

                      <div>
                        <Label>Retail</Label>
                        <Input value={data.retail} onChange={(e) => onInputChange("retail", e.target.value)} />
                      </div>

                      <div>
                        <Label>Retail / TP Diff</Label>
                        <Input value={data.retail_tp_diff} onChange={(e) => onInputChange("retail_tp_diff", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Reorder Level</Label>
                        <Input value={data.reorder_level} onChange={(e) => onInputChange("reorder_level", e.target.value)} />
                      </div>

                      <div>
                        <Label>Packing Qty</Label>
                        <Input value={data.packing_qty} onChange={(e) => onInputChange("packing_qty", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Packing Size</Label>
                        <Input value={data.packing_size} onChange={(e) => onInputChange("packing_size", e.target.value)} />
                      </div>
                      <div>
                        <Label>Pcs</Label>
                        <Input value={data.pcs} onChange={(e) => onInputChange("pcs", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Formation</Label>
                        <Nselect value={data.formation} onValueChange={(v) => onInputChange("formation", v)}>
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
                        <Label>Type</Label>
                        <Nselect value={data.type} onValueChange={(v) => onInputChange("type", v)}>
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

                        <Nselect
                          value={data.category ?? ""}
                          onValueChange={(v) => onInputChange("category", v)} // v is string
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Item Category</SelectLabel>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Nselect>
                      </div>

                      <div>
                        <Label>Shelf</Label>
                        <Nselect value={data.shelf} onValueChange={(v) => onInputChange("shelf", v)}>
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
                        <Label>GST % / Amt</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={data.gst_percent} onChange={(e) => onInputChange("gst_percent", e.target.value)} />
                          <Input value={data.gst_amount} onChange={(e) => onInputChange("gst_amount", e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label>Adv Tax Filer / NonFiler / Manufacturer</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input value={data.adv_tax_filer} onChange={(e) => onInputChange("adv_tax_filer", e.target.value)} />
                          <Input value={data.adv_tax_non_filer} onChange={(e) => onInputChange("adv_tax_non_filer", e.target.value)} />
                          <Input value={data.adv_tax_manufacturer} onChange={(e) => onInputChange("adv_tax_manufacturer", e.target.value)} />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* DIVIDER */}
                  <Separator orientation="vertical" className="mx-auto hidden md:block h-full" />

                  {/* RIGHT SECTION */}
                  <div className="space-y-4">

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Discount</Label>
                        <Input value={data.discount} onChange={(e) => onInputChange("discount", e.target.value)} />
                      </div>
                      <div>
                        <Label>Packing Full</Label>
                        <Input value={data.packing_full} onChange={(e) => onInputChange("packing_full", e.target.value)} />
                      </div>
                      <div>
                        <Label>Packing Pcs</Label>
                        <Input value={data.packing_pcs} onChange={(e) => onInputChange("packing_pcs", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Limit Pcs</Label>
                        <Input value={data.limit_pcs} onChange={(e) => onInputChange("limit_pcs", e.target.value)} />
                      </div>
                      <div>
                        <Label>Order Qty</Label>
                        <Input value={data.order_qty} onChange={(e) => onInputChange("order_qty", e.target.value)} />
                      </div>
                      <div>
                        <Label>Weight</Label>
                        <Input value={data.weight} onChange={(e) => onInputChange("weight", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Stock</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={data.stock_1} onChange={(e) => onInputChange("stock_1", e.target.value)} />
                          <Input value={data.stock_2} onChange={(e) => onInputChange("stock_2", e.target.value)} />
                        </div>
                      </div>

                      <div>
                        <Label>Check Options</Label>
                        <div className="flex items-center flex-wrap gap-5">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={!!data.is_import} onCheckedChange={(v) => onInputChange("is_import", !!v)} />
                            <Label>Import</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={!!data.is_fridge} onCheckedChange={(v) => onInputChange("is_fridge", !!v)} />
                            <Label>Fridge</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={!!data.is_active} onCheckedChange={(v) => onInputChange("is_active", !!v)} />
                            <Label>Active</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox checked={!!data.is_recipe} onCheckedChange={(v) => onInputChange("is_recipe", !!v)} />
                            <Label>Recipe</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PT Fields */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>P.T.2</Label>
                        <Input value={data.pt2} onChange={(e) => onInputChange("pt2", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label>P.T.3</Label>
                        <Input value={data.pt3} onChange={(e) => onInputChange("pt3", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>P.T.4</Label>
                        <Input value={data.pt4} onChange={(e) => onInputChange("pt4", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label>P.T.5</Label>
                        <Input value={data.pt5} onChange={(e) => onInputChange("pt5", e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>P.T.6</Label>
                        <Input value={data.pt6} onChange={(e) => onInputChange("pt6", e.target.value)} />
                      </div>
                      <div></div>
                      <div>
                        <Label>P.T.7</Label>
                        <Input value={data.pt7} onChange={(e) => onInputChange("pt7", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-end mt-2 gap-3 pt-1 md:col-span-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        reset()
                        setOpeningDate(initialDate)
                      }}
                    >
                      Reset
                    </Button>

                    <Button type="submit" disabled={processing}>
                      {processing ? "Saving..." : "Update"}
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
