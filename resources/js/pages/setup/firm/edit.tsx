"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { router, usePage } from "@inertiajs/react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon, Upload, X } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Firm", href: "/firm" },
  { title: "Edit", href: "" },
];

export default function FirmEditPage() {
  // ✅ Get firm data from Inertia props
  const { props } = usePage() as any;
  const firm = props.firm;
  const errors = props.errors || {};

  const [date, setDate] = useState<Date | undefined>(firm?.date ? new Date(firm.date) : new Date());
  const [open, setOpen] = useState(false);

  // ✅ Prefilled form state
  const [formData, setFormData] = useState({
    code: firm?.code || "",
    name: firm?.name || "",
    business: firm?.business || "",
    address1: firm?.address1 || "",
    address2: firm?.address2 || "",
    address3: firm?.address3 || "",
    phone: firm?.phone || "",
    fax: firm?.fax || "",
    owner: firm?.owner || "",
    email: firm?.email || "",
    website: firm?.website || "",
    saletax: firm?.saletax || "",
    ntn: firm?.ntn || "",
    printinvoice: firm?.printinvoice || false,
    defult: firm?.defult || false,
    status: firm?.status ?? true,
    logo: null as File | null,
    _method: "PUT",
  });

  // ✅ Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ ...formData, logo: file });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const removeLogo = () => {
    setFormData({ ...formData, logo: null });
  };

  // ✅ Submit updated data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use router.post with _method: "PUT" because native PUT has issues with file uploads in Laravel
    router.post(`/firms/${firm.id}`, {
      ...formData,
      date: date ? date.toISOString().split("T")[0] : null,
    });
  };

  return (
    <SidebarProvider
      style={{
        ["--sidebar-width" as any]: "calc(var(--spacing) * 61)",
        ["--header-height" as any]: "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="flex flex-1 flex-col gap-6 p-6">
          <Card className="w-full border shadow-sm">
            <CardHeader className="flex items-center justify-between border-b pb-3">
              <CardTitle className="text-lg font-semibold">Edit Firm</CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8"
              >
                {/* Left column */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 block">Date</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !date && "text-muted-foreground"
                            )}
                          >
                            {date
                              ? date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "Select date"}
                            <CalendarIcon className="h-4 w-4 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={(value) => {
                              if (value) setDate(value);
                              setOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="mb-1 block">Code</Label>
                      <Input
                        name="code"
                        placeholder="Enter code"
                        value={formData.code}
                        onChange={handleChange}
                      />
                      {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1 block">Title</Label>
                    <Input
                      name="name"
                      placeholder="Enter firm title"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label className="mb-1 block">Business</Label>
                    <Input
                      name="business"
                      placeholder="Enter business name"
                      value={formData.business}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Address 1</Label>
                    <Input
                      name="address1"
                      placeholder="Enter address 1"
                      value={formData.address1}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Address 2</Label>
                    <Input
                      name="address2"
                      placeholder="Enter address 2"
                      value={formData.address2}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Address 3</Label>
                    <Input
                      name="address3"
                      placeholder="Enter address 3"
                      value={formData.address3}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Telephone</Label>
                    <Input
                      name="phone"
                      placeholder="Enter telephone number"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label className="mb-1 block">Fax</Label>
                    <Input
                      name="fax"
                      placeholder="Enter fax number"
                      value={formData.fax}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Owner Name</Label>
                    <Input
                      name="owner"
                      placeholder="Enter owner name"
                      value={formData.owner}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Separator orientation="vertical" className="mx-auto hidden md:block h-full" />

                {/* Right column */}
                <div className="space-y-5">
                  <div>
                    <Label className="mb-1 block">Email</Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label className="mb-1 block">Web Site</Label>
                    <Input
                      name="website"
                      placeholder="Enter website URL"
                      value={formData.website}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">Sales Tax #</Label>
                    <Input
                      name="saletax"
                      placeholder="Enter Sales Tax Number"
                      value={formData.saletax}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-1 block">N.T.N #</Label>
                    <Input
                      name="ntn"
                      placeholder="Enter NTN number"
                      value={formData.ntn}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Firm Logo</Label>
                    <div
                      className={cn(
                        "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 bg-muted/30",
                        isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-muted-foreground/50",
                        (formData.logo || firm?.logo) && "border-solid border-muted pt-2"
                      )}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      {formData.logo ? (
                        <div className="relative group w-24 h-24 overflow-hidden rounded-md border border-border shadow-sm">
                          <img
                            src={URL.createObjectURL(formData.logo)}
                            alt="Logo preview"
                            className="w-full h-full object-contain bg-white"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : firm?.logo ? (
                        <div className="relative group w-24 h-24 overflow-hidden rounded-md border border-border shadow-sm">
                          <img
                            src={`/storage/${firm.logo}`}
                            alt="Current logo"
                            className="w-full h-full object-contain bg-white"
                          />
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-5 h-5 text-white" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                            />
                          </label>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className={cn("w-6 h-6 mb-2 transition-colors", isDragging ? "text-primary" : "text-muted-foreground/60")} />
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider font-medium">PNG, JPG or SVG</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                    {errors.logo && <p className="text-xs text-red-500 mt-1">{errors.logo}</p>}
                    {firm?.logo && !formData.logo && (
                      <p className="text-[10px] text-muted-foreground mt-1 text-center italic">Hover image to change</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-end gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="invoice"
                          name="printinvoice"
                          checked={formData.printinvoice}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, printinvoice: !!checked })
                          }
                        />
                        <Label htmlFor="invoice">Printed Invoice</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="default"
                          name="defult"
                          checked={formData.defult}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, defult: !!checked })
                          }
                        />
                        <Label htmlFor="default">Default</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="status"
                          name="status"
                          checked={formData.status}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, status: !!checked })
                          }
                        />
                        <Label htmlFor="status">Active</Label>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => router.visit("/firm")}>
                        Cancel
                      </Button>
                      <Button type="submit">Save</Button>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
