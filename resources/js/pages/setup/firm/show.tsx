"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { usePage } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Firms", href: "/firms" },
  { title: "View", href: "#" },
];

// ✅ Props Interface
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
  created_by_name?: string;
  created_at: string;
  logo_url?: string;
}

export default function FirmShowPage() {
  const { props } = usePage() as any;
  const firm: Firm = props.firm;

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "-";

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

        <div className="flex flex-col gap-6 p-6">
          <Card className="w-full border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-xl font-bold">Firm Details</CardTitle>
              {firm.logo_url && (
                <div className="h-16 w-32 border rounded-md overflow-hidden bg-white shadow-sm p-1">
                  <img
                    src={firm.logo_url}
                    alt="Firm Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </CardHeader>

            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label>Code</Label>
                  <p className="mt-1 font-medium">{firm.code}</p>
                </div>

                <div>
                  <Label>Name</Label>
                  <p className="mt-1 font-medium">{firm.name}</p>
                </div>

                <div>
                  <Label>Business</Label>
                  <p className="mt-1">{firm.business || "-"}</p>
                </div>

                <div>
                  <Label>Addresses</Label>
                  <p className="mt-1">
                    {firm.address1 || "-"}<br />
                    {firm.address2 || "-"}<br />
                    {firm.address3 || "-"}
                  </p>
                </div>

                <div>
                  <Label>Contact</Label>
                  <p className="mt-1">
                    Tel: {firm.phone || "-"}<br />
                    Fax: {firm.fax || "-"}<br />
                    Owner: {firm.owner || "-"}
                  </p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden md:block h-full" />

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <p className="mt-1">{firm.email || "-"}</p>
                </div>

                <div>
                  <Label>Website</Label>
                  <p className="mt-1">{firm.website || "-"}</p>
                </div>

                <div>
                  <Label>Tax Info</Label>
                  <p className="mt-1">
                    Sales Tax #: {firm.saletax || "-"}<br />
                    NTN #: {firm.ntn || "-"}
                  </p>
                </div>

                <div>
                  <Label>Date</Label>
                  <p className="mt-1">{formatDate(firm.date)}</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={firm.printinvoice ? "default" : "secondary"}>
                    Printed Invoice: {firm.printinvoice ? "Yes" : "No"}
                  </Badge>
                  <Badge variant={firm.defult ? "default" : "secondary"}>
                    Default: {firm.defult ? "Yes" : "No"}
                  </Badge>
                  <Badge variant={firm.status ? "default" : "secondary"}>
                    Status: {firm.status ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div>
                  <Label>Created By</Label>
                  <p className="mt-1">{firm.created_by_name || "-"}</p>
                </div>

                <div>
                  <Label>Created At</Label>
                  <p className="mt-1">{formatDate(firm.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
