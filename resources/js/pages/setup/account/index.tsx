"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { DataTable } from "@/components/setup/account/DataTable";
import { usePage, Link } from "@inertiajs/react";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account", href: "#" },
  { title: "List", href: "/account" },
];
interface FilterData {
  type?: string;
  city_id?: string;
  status?: string;
  search?: string;
}

interface SummaryData {
  total_accounts: number;
  customers_count: number;
  suppliers_count: number;
  total_receivables: number;
  total_payables: number;
}

interface Account {
  id: number;
  code: string;
  title: string;
  type: string;
  opening_balance: number;
  credit_limit?: number;
  status?: boolean;
  created_at: string;
  created_by_name?: string;
  city?: { id: number; name: string };
  area?: { id: number; name: string };
  saleman?: { id: number; name: string };
}

interface City {
  id: number;
  name: string;
}

interface AccountType {
  id: number;
  name: string;
}

interface Props {
  accounts: Account[];
  summary: SummaryData;
  filters: FilterData;
  cities: City[];
  accountTypes: AccountType[];
}

import AccountSummary from "./AccountSummary";
import AccountFilters from "./AccountFilters";

export default function AccountsPage({ accounts, summary, filters, cities, accountTypes }: Props) {
  //   const { accounts } = usePage<{ accounts: Account[] }>().props; // Removed usePage hook usage as props are passed directly

  function route(_name: string): string {
    if (_name === "account.create") return "/account/create";
    return "";
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold mb-1">Chart of Accounts</h1>
              <p className="text-sm text-muted-foreground">
                Manage and view all your accounts here.
              </p>
            </div>
            <Link href={route("account.create")}>
              <Button className="mb-3">
                <Plus className="mr-2 h-4 w-4" /> Add Account
              </Button>
            </Link>
          </div>

          <AccountSummary summary={summary} />

          <AccountFilters filters={filters} cities={cities} accountTypes={accountTypes} />

          {accounts && accounts.length > 0 ? (
            <DataTable data={accounts} />
          ) : (
            <div className="text-center text-muted-foreground py-10">
              No accounts found.
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

