"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { DataTable } from "@/components/setup/firm/DataTable";
import { Link, usePage } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Setup", href: "/setup" },
  { title: "Firm", href: "/firm" },
  { title: "List", href: "/firm" },
];

// ✅ Firm Interface
interface Firm {
  id: number;
  name: string;
  code: string;
  date?: string;
  business?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  phone?: string;
  fax?: string;
  owner?: string;
  email?: string;
  website?: string;
  saletax?: string;
  ntn?: string;
  printinvoice?: boolean;
  defult?: boolean;
  status?: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

// ✅ Main Page Component
export default function FirmPage() {
  // ✅ Inertia Props
  const { firms, auth, errors } = usePage().props as unknown as {
    firms: Firm[];
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  // ✅ Toast for success/error feedback
  useToastFromQuery();

  // ✅ Permissions
  const permissions = auth?.permissions || [];
  const canCreate = permissions.includes("create firms");

  // ✅ Route helper (replace with Ziggy if available)
  function route(name: string): string {
    if (name === "firms.create") return "/firms/create";
    if (name === "firms.index") return "/firms";
    return "#";
  }

  return (
    <SidebarProvider
      style={
        {
          ["--sidebar-width" as any]: "calc(var(--spacing) * 61)",
          ["--header-height" as any]: "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="mt-6 px-6">
          {/* ===== Page Header ===== */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold mb-1">Firm Directory</h1>
              <p className="text-sm text-muted-foreground">
                Manage, edit, and organize all your registered firms.
              </p>
            </div>

            {canCreate && (
              <Link href={route("firms.create")}>
                <Button className="shadow-sm hover:shadow-md transition-all">
                  <Plus className="mr-2 h-4 w-4" /> Add Firm
                </Button>
              </Link>
            )}
          </div>

          {/* ===== Table Section ===== */}
          {firms.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 border rounded-md">
              No firms found.
            </div>
          ) : (
            <DataTable data={firms} />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
