"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/messageline/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, MessageSquare } from "lucide-react";
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
import { Select } from "@/components/ui/select";
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Message Lines", href: "/message-lines" }];

interface MessageLine {
  id: number;
  messageline: string;
  category?: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}

interface IndexProps {
  messagesline: MessageLine[];
  filters: {
    search?: string;
    category?: string;
  };
}

export default function Index({ messagesline, filters }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const [search, setSearch] = useState(filters.search || "");
  const [filterCategory, setFilterCategory] = useState(filters.category || "all");

  const handleFilter = (newSearch?: string, newCategory?: string) => {
    router.get(
      "/message-lines",
      {
        search: newSearch ?? search,
        category: newCategory ?? filterCategory,
      },
      {
        preserveState: true,
        replace: true,
      }
    );
  };

  const permissions = pageProps.auth.permissions;
  const canCreate =
    Array.isArray(permissions) && permissions.includes("create message");

  // Form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [messageLine, setMessageLine] = useState("");
  const [category, setCategory] = useState("Sales");
  const [status, setStatus] = useState("active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageLine.trim()) return;

    const payload = {
      messageline: messageLine,
      category,
      status,
    };

    router.post("/message-lines", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setMessageLine("");
        setCategory("Sales");
        setStatus("active");
      },
    });
  };

  return (
    <>
      <Head title="Message Lines" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="max-w-[1600px] mx-auto pt-8 pb-12 px-6 lg:px-10">
            {/* Command Bar Section */}
            <div className="relative mb-10">
              <div className="absolute inset-0 bg-orange-500/5 blur-3xl -z-10 rounded-full opacity-50" />
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-700">Setup Console</span>
                  </div>
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-foreground leading-[0.9] mb-2">
                      Message <span className="text-orange-500">Lines</span>
                    </h1>
                    <p className="text-muted-foreground text-sm lg:text-base font-medium max-w-lg leading-relaxed">
                      Orchestrate document communication with high-precision instructions and personalized messaging templates.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-12 w-px bg-border hidden lg:block mx-4" />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mb-1">Total Repository</span>
                    <span className="text-3xl font-black tabular-nums leading-none">{messagesline.length}</span>
                  </div>
                  <Button
                    size="lg"
                    className="ml-4 bg-foreground text-background hover:bg-foreground/90 h-14 px-8 rounded-sm shadow-2xl shadow-foreground/10 transition-all active:scale-95 group"
                    onClick={() => setOpenCreateDialog(true)}
                    disabled={!canCreate}
                  >
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-bold tracking-tight">Generate New Line</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Asymmetric Filters & Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column - Filters & Stats */}
              <div className="lg:col-span-3 space-y-8">
                <div className="p-6 bg-card border border-border/60 rounded-sm shadow-sm">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 block">Filter Protocol</Label>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="search-input" className="text-xs font-bold text-foreground">Query Text</Label>
                      <Input
                        id="search-input"
                        placeholder="Scan content..."
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          handleFilter(e.target.value);
                        }}
                        className="bg-muted/30 border-muted-foreground/10 focus:ring-1 focus:ring-orange-500/50 h-11 rounded-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-foreground">Domain Category</Label>
                      <select
                        className="w-full border rounded-sm p-2 bg-muted/30 border-muted-foreground/10 text-sm h-11 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                        value={filterCategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFilterCategory(val);
                          handleFilter(undefined, val);
                        }}
                      >
                        <option value="all">All Domains</option>
                        <option value="Offer List">Offer List</option>
                        <option value="Sales">Sales</option>
                        <option value="Purchase">Purchase</option>
                        <option value="Receipt">Receipt</option>
                        <option value="Payments">Payments</option>
                      </select>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-orange-600 h-8"
                      onClick={() => {
                        setSearch("");
                        setFilterCategory("all");
                        router.get("/message-lines");
                      }}
                    >
                      Reset Filter
                    </Button>
                  </div>
                </div>

                <div className="p-6 bg-orange-500 rounded-sm shadow-xl shadow-orange-500/10 text-white overflow-hidden relative group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <MessageSquare className="w-32 h-32" />
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-4">Quality Score</h3>
                  <div className="text-4xl font-black mb-1">98.4%</div>
                  <p className="text-[10px] font-medium opacity-80">Message delivery consistency across all transaction modules.</p>
                </div>
              </div>

              {/* Right Column - Main Table Area */}
              <div className="lg:col-span-9">
                {messagesline.length === 0 ? (
                  <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/10 rounded-sm bg-muted/5">
                    <div className="p-4 bg-muted rounded-full mb-4">
                      <Plus className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="font-bold text-foreground mb-1">Null State Detected</p>
                    <p className="text-sm text-muted-foreground mb-6">No matching message lines found in the current domain.</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setFilterCategory("all");
                        router.get("/message-lines");
                      }}
                      className="rounded-sm border-foreground text-foreground hover:bg-foreground hover:text-background font-bold px-8"
                    >
                      Reset All Protocols
                    </Button>
                  </div>
                ) : (
                  <div className="bg-card rounded-sm border border-border/60 shadow-2xl shadow-black/5">
                    <DataTable messagesline={messagesline} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Message Line Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[500px] border-border/60 rounded-sm p-0 overflow-hidden">
          <div className="h-1.5 bg-orange-500" />
          <div className="p-8">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-500 text-white rounded-sm shadow-lg shadow-orange-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">Add New Protocol</DialogTitle>
                  <DialogDescription className="font-medium">Define a new communication instruction line.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Message Line */}
                <div className="space-y-2">
                  <Label htmlFor="messageline" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instruction String</Label>
                  <Input
                    id="messageline"
                    value={messageLine}
                    onChange={(e) => setMessageLine(e.target.value)}
                    placeholder="Enter command text..."
                    className="bg-muted/30 border-muted-foreground/10 focus:ring-1 focus:ring-orange-500/50 h-12 rounded-sm font-mono italic"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Domain</Label>
                    <select
                      id="category"
                      className="w-full border rounded-sm p-2 bg-muted/30 border-muted-foreground/10 text-xs font-bold uppercase tracking-wider h-11 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Offer List">Offer List</option>
                      <option value="Sales">Sales</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Payments">Payments</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System State</Label>
                    <select
                      id="status"
                      className="w-full border rounded-sm p-2 bg-muted/30 border-muted-foreground/10 text-xs font-bold uppercase tracking-wider h-11 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active System</option>
                      <option value="inactive">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-border/40">
                <Button type="button" variant="ghost" className="font-bold text-xs uppercase tracking-widest" onClick={() => setOpenCreateDialog(false)}>
                  Abort
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 h-12 px-8 rounded-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/10 transition-all active:scale-95">
                  Execute Creation
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
