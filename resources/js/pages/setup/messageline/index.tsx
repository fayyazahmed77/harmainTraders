"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/messageline/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, MessageSquare, Search, RotateCcw } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Setup", href: "#" },
  { title: "Message Lines", href: "/message-lines" },
];

interface MessageLine {
  id: number;
  messageline: string;
  category?: string[] | string | null;
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
      { preserveState: true, replace: true }
    );
  };

  const permissions = pageProps.auth.permissions;
  const canCreate = Array.isArray(permissions) && permissions.includes("create message");

  // Form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [messageLine, setMessageLine] = useState("");
  const [categories, setCategories] = useState<string[]>(["Sales"]);
  const [status, setStatus] = useState("active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageLine.trim()) return;

    router.post(
      "/message-lines",
      { messageline: messageLine, category: categories, status },
      {
        onSuccess: () => {
          setOpenCreateDialog(false);
          setMessageLine("");
          setCategories(["Sales"]);
          setStatus("active");
        },
      }
    );
  };

  const activeCount = messagesline.filter((m) => m.status === "active").length;
  const hasFilters = search || filterCategory !== "all";

  return (
    <>
      <Head title="Message Lines" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className=" mx-auto pt-8 pb-12 px-3 lg:px-6">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Message Lines
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage the footer messages that print on invoices and documents.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Quick stats */}
                <div className="hidden sm:flex items-center gap-5 px-5 py-3 bg-card border border-border/60 rounded-xl">
                  <div className="text-center">
                    <div className="text-xl font-bold tabular-nums">{messagesline.length}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <div className="text-xl font-bold tabular-nums text-orange-500">{activeCount}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active</div>
                  </div>
                </div>

                <Button
                  size="default"
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-5 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 gap-2"
                  onClick={() => setOpenCreateDialog(true)}
                  disabled={!canCreate}
                >
                  <Plus className="h-4 w-4" />
                  Add Message Line
                </Button>
              </div>
            </div>

            {/* ── Filter bar (above table) ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 p-4 bg-card border border-border/60 rounded-xl">
              {/* Search */}
              <div className="relative flex-1 min-w-0 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="search-input"
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    handleFilter(e.target.value);
                  }}
                  className="pl-9 bg-muted/30 border-border/60 h-10 rounded-lg text-sm w-full"
                />
              </div>

              {/* Category dropdown */}
              <select
                className="border border-border/60 rounded-lg px-3 py-2 bg-muted/30 text-sm h-10 outline-none focus:ring-2 focus:ring-orange-500/30 transition-all w-full sm:w-48"
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  handleFilter(undefined, e.target.value);
                }}
              >
                <option value="all">All Categories</option>
                <option value="Offer List">Offer List</option>
                <option value="Sales">Sales</option>
                <option value="Purchase">Purchase</option>
                <option value="Receipt">Receipt</option>
                <option value="Payments">Payments</option>
              </select>

              {/* Clear filters */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-semibold text-muted-foreground hover:text-orange-600 hover:bg-orange-500/5 gap-1.5 rounded-lg h-10 px-3 flex-shrink-0"
                  onClick={() => {
                    setSearch("");
                    setFilterCategory("all");
                    router.get("/message-lines");
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>

            {/* ── Table ── */}
            {messagesline.length === 0 ? (
              <div className="h-[420px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/5">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="font-semibold text-foreground mb-1">No message lines found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {hasFilters
                    ? "Try adjusting your filters."
                    : "Add your first message line to get started."}
                </p>
                {hasFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setFilterCategory("all");
                      router.get("/message-lines");
                    }}
                    className="rounded-xl font-semibold px-6"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
                <DataTable messagesline={messagesline} />
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* ── Add Message Line Dialog ── */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl border-border/60 p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <Plus className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Add Message Line</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    This message will appear on printed documents.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Message Text */}
              <div className="space-y-1.5">
                <Label htmlFor="messageline" className="text-sm font-semibold">
                  Message Text <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="messageline"
                  value={messageLine}
                  onChange={(e) => setMessageLine(e.target.value)}
                  placeholder="e.g. Thank you for your business!"
                  className="h-11 rounded-xl border-border/60 bg-muted/30"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  This text will print at the bottom of the document.
                </p>
              </div>

              <div className="space-y-4">
                {/* Categories Checkboxes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Used For</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/20 border border-border/60 rounded-xl">
                    {["Offer List", "Sales", "Purchase", "Receipt", "Payments"].map((catName) => {
                      const isChecked = categories.includes(catName);
                      return (
                        <div key={catName} className="flex items-center space-x-2.5">
                          <Checkbox
                            id={`cat-${catName}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCategories([...categories, catName]);
                              } else {
                                setCategories(categories.filter((c) => c !== catName));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`cat-${catName}`}
                            className="text-sm font-medium cursor-pointer select-none text-foreground/80 hover:text-foreground"
                          >
                            {catName}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable this message line on printed documents.
                    </p>
                  </div>
                  <Switch
                    checked={status === "active"}
                    onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/40 gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="font-semibold rounded-xl"
                  onClick={() => setOpenCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                >
                  Save Message Line
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
