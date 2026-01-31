"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { DataTable } from "@/components/setup/bank/DataTable";
import { Link, usePage } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery"; // ✅ for toast messages

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Setup", href: "#" },
  { title: "Banks", href: "/banks" },
];

// ✅ Bank Interface
interface Bank {
  id: number;
  name: string;
  account_no: string;
  account_name: string;
  code: string | null;
  branch: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  created_by_name: string;
  logo_url: string;
  created_by_avatar?: string | null;
  created_at: string;
}

export default function BankPage() {
  // ✅ Inertia props (fixes typing warning)
  const { banks } = usePage().props as unknown as { banks: Bank[] };

  // ✅ Toast for query-based feedback
  useToastFromQuery();

  // ✅ Auth and permission handling
  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  // ✅ Helper: route fallback
  function routeHelper(name: string): string {
    if (name === "banks.create") return "/banks/create";
    return "#";
  }

  // ✅ Permission check helper
  const canCreate = permissions.includes("create banks");

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
          {/* ===== Header Section ===== */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Bank Directory</h1>
              <p className="text-sm text-muted-foreground">
                Manage, add, and organize all registered banks here.
              </p>
            </div>

            {/* ===== Permission Based Add Button ===== */}
            {canCreate && (
              <Link href={routeHelper("banks.create")}>
                <Button className="shadow-sm hover:shadow-md transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Add Bank
                </Button>
              </Link>
            )}
          </div>

          {/* ===== Error Toasts (Optional) ===== */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 mb-4 text-red-600 bg-red-50 rounded-md border border-red-200">
              {Object.values(errors).map((err, idx) => (
                <p key={idx}>{err}</p>
              ))}
            </div>
          )}

          {/* ===== Table Section ===== */}
          {banks.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border rounded-md">
              No banks found.
            </div>
          ) : (
            <DataTable data={banks}  />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
