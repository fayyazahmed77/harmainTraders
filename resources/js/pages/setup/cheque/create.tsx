"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";
import { router, usePage } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Cheques", href: "/cheques" },
  { title: "Generation", href: "/cheques/create" },
];

interface Bank {
  id: number;
  name: string;
}

export default function ChequeGenerationPage() {
  // ✅ Page props from Laravel
  const { banks } = usePage().props as unknown as { banks: Bank[] };

  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [chequeFrom, setChequeFrom] = useState("");
  const [voucherno, setVoucherno] = useState("");
  const [prefix, setPerfix] = useState("");
  const [chequeTo, setChequeTo] = useState("");
  const [remarks, setRemarks] = useState("");
  const [generatedCheques, setGeneratedCheques] = useState<string[]>([]);

  // ✅ Generate cheque numbers
  const handleGenerate = () => {
    if (!chequeFrom || !chequeTo)
      return alert("Please enter both cheque numbers!");

    const from = parseInt(chequeFrom);
    const to = parseInt(chequeTo);

    if (isNaN(from) || isNaN(to) || from > to) {
      return alert("Invalid cheque number range!");
    }

    const cheques: string[] = [];
    for (let i = from; i <= to; i++) {
      cheques.push(i.toString().padStart(3, "0"));
    }
    setGeneratedCheques(cheques);
  };

  // ✅ Submit data to backend
  const handleSubmit = () => {
    if (!bankId) return alert("Please select a bank!");
    if (generatedCheques.length === 0)
      return alert("Please generate cheques first!");

    router.post("/cheque", {
      bank_id: bankId,
      entry_date: date,
      remarks,
      voucher_code: voucherno,
      prefix,
      cheques: generatedCheques,
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
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Cheque Generation
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* ==== FORM FIELDS ==== */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Entry Date */}
                <div>
                  <Label className="mb-1 block">Entry Date</Label>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
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
                          setDate(value);
                          setOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Bank Dropdown */}
                <div>
                  <Label className="mb-1 block">Bank</Label>
                  <select
                    className="w-full border rounded-md p-2"
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {errors.bank_id && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.bank_id}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="mb-1 block">Voucher No</Label>
                  <Input
                    value={voucherno}
                    onChange={(e) => setVoucherno(e.target.value)}
                    placeholder="Voucher No"
                  />
                </div>

                {/* Cheque From */}
                <div>
                  <Label className="mb-1 block">Cheque Perfix</Label>
                  <Input
                    value={prefix}
                    onChange={(e) => setPerfix(e.target.value)}
                    placeholder="D-"
                  />
                </div>
                {/* Cheque From */}
                <div>
                  <Label className="mb-1 block">Cheque From</Label>
                  <Input
                    value={chequeFrom}
                    onChange={(e) => setChequeFrom(e.target.value)}
                    placeholder="From (e.g. 001)"
                  />
                </div>

                {/* Cheque To */}
                <div>
                  <Label className="mb-1 block">Cheque To</Label>
                  <Input
                    value={chequeTo}
                    onChange={(e) => setChequeTo(e.target.value)}
                    placeholder="To (e.g. 050)"
                  />
                </div>

                {/* Remarks */}
                <div className="col-span-full">
                  <Label className="mb-1 block">Remarks</Label>
                  <Input
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter remarks"
                  />
                </div>
              </div>

              <Separator />

              {/* ==== ACTION BUTTONS ==== */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  className="hover:shadow-md"
                >
                  Generate Cheques
                </Button>

                <Button
                  onClick={handleSubmit}
                  className="shadow-sm hover:shadow-md"
                >
                  Save Cheques
                </Button>
              </div>

              {/* ==== GENERATED CHEQUES PREVIEW ==== */}
              {generatedCheques.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">
                    Generated Cheques ({generatedCheques.length})
                  </h3>
                  <div className="grid grid-cols-6 gap-2 border p-3 rounded-md">
                    {generatedCheques.map((num) => (
                      <div
                        key={num}
                        className="text-sm border rounded-md py-1 text-center bg-muted"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
