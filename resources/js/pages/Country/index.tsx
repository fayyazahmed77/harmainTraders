"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Country/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useToastFromQuery from "@/hooks/useToastFromQuery";


const breadcrumbs: BreadcrumbItem[] = [
  { title: "Countries", href: "/countries" },
];

interface Country {
  id: number;
  name: string;
  code: string;
  phone_code: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Pagination<T> {
  data: T[];
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}


interface IndexProps {
  countries: Pagination<Country>;
}

export default function Index({ countries }: IndexProps) {
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

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [currency, setCurrency] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      code,
      phone_code: phoneCode,
      currency,
    };

    router.post("/countries", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setPhoneCode("");
        setCurrency("");
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create countries");
  console.log(canCreate);
  return (
    <>

      <Head title="Countries" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="p-6 lg:p-10 space-y-8 max-w-[1700px] mx-auto min-h-[calc(100vh-64px)] bg-[#fafafa]/50">
            {/* Command Bar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-sm blur transition duration-1000 group-hover:duration-200 opacity-0 group-hover:opacity-100" />
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl border-2 border-orange-500/10 p-6 lg:p-8 rounded-sm shadow-2xl shadow-orange-500/5 transition-all hover:border-orange-500/20 select-none overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
                  <Plus className="w-48 h-48 text-orange-600 rotate-12" />
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 animate-pulse" />
                      <div className="relative h-14 w-14 lg:h-16 lg:w-16 rounded-sm bg-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 ring-4 ring-orange-500/10 group-hover:scale-105 transition-transform duration-500">
                        <Plus className="w-8 h-8 lg:w-10 lg:h-10 group-hover:rotate-90 transition-transform duration-500" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl lg:text-4xl font-black tracking-tighter text-foreground leading-none">
                          COUNTRIES <span className="text-orange-500">REGISTRY</span>
                        </h1>
                        <div className="hidden sm:flex h-5 w-px bg-orange-500/20 mx-1" />
                        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-sm bg-orange-500/5 border border-orange-500/20 text-[10px] font-black tracking-widest text-orange-600 uppercase">
                          Global-v4.0
                        </span>
                      </div>
                      <p className="text-muted-foreground/60 text-xs lg:text-sm font-bold uppercase tracking-[0.2em]">
                        Centralized Geographic Identity Database & Control
                      </p>
                    </div>
                  </div>

                  <div className="hidden xl:flex items-center gap-8 border-l border-orange-500/10 pl-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Identity Console</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-black text-foreground/80 tracking-tight">SYSTEM ACTIVE</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">Registry Scale</span>
                      <span className="text-xs font-black text-orange-600 uppercase tracking-tight">{countries.total} Identities</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 relative z-10 lg:ml-auto">
                  <Button
                    onClick={() => setOpenCreateDialog(true)}
                    className="group/btn bg-orange-600 hover:bg-orange-700 h-14 lg:h-16 px-8 lg:px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 transition-all active:scale-95 border-b-4 border-orange-800 flex items-center gap-3"
                  >
                    <Plus className="w-5 h-5 group-hover/btn:rotate-180 transition-transform duration-500" />
                    <span>Generate Identity</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-8 relative">
              <div className="col-span-12">
                {countries.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-20 bg-white border-2 border-dashed border-orange-500/10 rounded-sm group overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <Plus className="w-20 h-20 text-orange-500/20 mb-6 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                    <h3 className="text-2xl font-black tracking-tight text-foreground uppercase mb-2 relative z-10">NULL DATA DETECTED</h3>
                    <p className="text-muted-foreground font-semibold uppercase text-[10px] tracking-[0.2em] relative z-10 mb-8 px-4 text-center">
                      The core geographic registry is currently empty. Initialize a new identity to proceed.
                    </p>
                    <Button
                      onClick={() => setOpenCreateDialog(true)}
                      className="bg-orange-600 hover:bg-orange-700 h-12 px-8 rounded-sm font-black uppercase tracking-widest transition-all relative z-10 shadow-xl shadow-orange-500/20"
                    >
                      Initialize Identity
                    </Button>
                  </div>
                ) : (
                  <DataTable data={countries.data} />
                )}
              </div>
            </div>
          </div>

        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="rounded-sm border-2 border-orange-500/20 p-0 overflow-hidden sm:max-w-[550px] bg-white shadow-2xl">
          <div className="h-2 bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
          <div className="p-8 lg:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-600 text-white rounded-sm shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 rotate-3 flex-shrink-0">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">
                    IDENTITY <span className="text-orange-500 italic">GENESIS</span>
                  </DialogTitle>
                  <DialogDescription className="font-black text-orange-600 uppercase text-[10px] tracking-widest opacity-70">
                    Geographic Registry Initialization Protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6 relative">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Country Full Name
                  </Label>
                  <div className="relative group">
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. United Kingdom"
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-bold uppercase tracking-tight transition-all"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-orange-500 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="space-y-2 lg:col-span-1 col-span-2">
                  <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    ISO Identity Code
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. GB, PK"
                    className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-bold uppercase tracking-widest"
                    required
                  />
                </div>

                <div className="space-y-2 lg:col-span-1 col-span-2">
                  <Label htmlFor="phoneCode" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Dialing Parameter
                  </Label>
                  <Input
                    id="phoneCode"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="e.g. +92, +1"
                    className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-bold"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="currency" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Economic Unit
                  </Label>
                  <Input
                    id="currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    placeholder="e.g. PKR, USD"
                    className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-bold uppercase tracking-tight"
                  />
                </div>
              </div>

              <div className="pt-6 border-t-2 border-orange-500/10">
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 px-8 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => setOpenCreateDialog(false)}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 group flex-1"
                  >
                    Confirm Genesis
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
