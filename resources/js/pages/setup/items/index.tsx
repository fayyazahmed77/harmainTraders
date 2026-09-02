"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, Download } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { router, Link, usePage } from "@inertiajs/react";
import { DataTable } from "@/components/setup/items/DataTable";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Items", href: "#" },
  { title: "List", href: "/items" },
];

interface FilterData {
  category_id?: string;
  status?: string;
  stock_status?: string;
  search?: string;
}

interface SummaryData {
  total_items: number;
  active_items: number;
  stock_value: number;
  out_of_stock: number;
  low_stock: number;
}

interface Item {
  id: number;
  code: string;
  title: string;
  company: string;
  category: { id: number; name: string };
  type: string;
  trade_price: string;
  retail: string;
  stock_1: string;
  stock_2: string;
  is_import: boolean;
  is_active: boolean;
  created_at: string;
  packing_qty: string;
  reorder_level: string;
}

interface Category {
  id: number;
  name: string;
}

interface Props {
  items: Item[];
  summary: SummaryData;
  filters: FilterData;
  categories: Category[];
}

import ItemsSummary from "./ItemsSummary";
import ItemsFilters from "./ItemsFilters";

export default function ItemsPage({ items, summary, filters, categories }: Props) {
  function routeHelper(name: string): string {
    if (name === "items.create") return "/items/create";
    if (name === "items.bulk-upload") return "/items/bulk-upload";
    return "/";
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

        <div className="mt-6 px-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold mb-1">Items List</h1>
              <p className="text-sm text-muted-foreground">
                Manage and view all your items.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a href="/items/bulk-upload/sample?format=xlsx" download>
                <Button variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Export Excel
                </Button>
              </a>
              <a href="/items/bulk-upload/sample?format=csv" download>
                <Button variant="outline" size="sm" className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                  <Download className="mr-1.5 h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Export CSV
                </Button>
              </a>
              <Link href={routeHelper("items.bulk-upload")}>
                <Button variant="outline" size="sm" className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Bulk Upload
                </Button>
              </Link>
              <Link href={routeHelper("items.create")}>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                </Button>
              </Link>
            </div>
          </div>

          <ItemsSummary summary={summary} />

          <ItemsFilters filters={filters} categories={categories} />

          {items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No items found.
            </div>
          ) : (
            <DataTable data={items} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
