"use client";

import * as React from "react";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BreadcrumbItem } from "@/types";
import { Separator } from "@/components/ui/separator";
import { router, usePage } from "@inertiajs/react";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Bank", href: "/banks" },
  { title: "Create", href: "/banks/create" },
];

export default function BankCreatePage() {
  const [form, setForm] = useState({
    name: "",
    account_no: "",
    account_name: "",
    code: "",
    branch: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo: null as File | null,
  });

  const { errors } = usePage().props as unknown as { errors: Record<string, string> };

  // ✅ handle change for text inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ handle logo file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm({ ...form, logo: file });
  };

  // ✅ submit form as FormData
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) formData.append(key, value as any);
    });

    router.post("/banks", formData, {
      forceFormData: true,
      onSuccess: () => toast.success("Bank created successfully!"),
      onError: () => toast.error("Error creating bank"),
    });
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

        <div className="flex flex-1 flex-col gap-6 p-6">
          <Card className="w-full border shadow-sm">
            <CardHeader className="flex items-center justify-between border-b pb-3">
              <CardTitle className="text-lg font-semibold">Create Bank</CardTitle>
            </CardHeader>

            <CardContent className="pt-6">
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8"
              >
                {/* Left column */}
                <div className="space-y-5">
                  {[
                    ["name", "Bank Name", "Enter bank name"],
                    ["account_no", "Account No", "Enter account number"],
                    ["account_name", "Account Name", "Enter account holder name"],
                    ["code", "Code", "Enter bank code"],
                    ["branch", "Branch", "Enter branch name"],
                  ].map(([key, label, placeholder]) => (
                    <div key={key}>
                      <Label className="mb-1 block">{label}</Label>
                      <Input
                        name={key}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={handleChange}
                        required={key === "name"}
                      />
                      {errors[key] && (
                        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <Separator orientation="vertical" className="mx-auto hidden md:block h-full" />

                {/* Right column */}
                <div className="space-y-5">
                  {[
                    ["address", "Address", "Enter branch address"],
                    ["phone", "Phone", "Enter phone number"],
                    ["email", "Email", "Enter email address"],
                    ["website", "Website", "Enter website URL"],
                  ].map(([key, label, placeholder]) => (
                    <div key={key}>
                      <Label className="mb-1 block">{label}</Label>
                      <Input
                        name={key}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={handleChange}
                        type={key === "email" ? "email" : "text"}
                      />
                      {errors[key] && (
                        <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
                      )}
                    </div>
                  ))}

                  {/* ✅ Logo Upload */}
                  <div>
                    <Label className="mb-1 block">Logo</Label>
                    <Input type="file" name="logo" accept="image/*" onChange={handleFileChange} />
                    {errors.logo && (
                      <p className="text-xs text-red-500 mt-1">{errors.logo}</p>
                    )}
                  </div>

                  <div className="flex justify-end pt-6 gap-3">
                    <Button type="button" variant="outline" onClick={() => history.back()}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Bank</Button>
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
