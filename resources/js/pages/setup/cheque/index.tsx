"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar as CalendarIcon,
  User as UserIcon,
  ArrowLeft,
  XCircle,
  Hash,
} from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { Link, usePage, Head } from "@inertiajs/react";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { DataTable } from "@/components/setup/cheque/DataTable";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ✅ Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Financials", href: "#" },
  { title: "Cheque Books", href: "/cheque" },
];

// ✅ ChequeBook Interface
interface ChequeBook {
  id: number;
  bank_id: number;
  bank: {
    id: number;
    title: string;
  };
  logo_url: string;
  created_by_name: string;
  created_by_avatar?: string | null;
  entry_date?: string;
  voucher_code?: string | null;
  remarks?: string | null;
  prefix?: string;
  cheque_no: string;
  status?: string;
  created_at: string;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function ChequeBookPage() {
  // ✅ Inertia props
  const { chequebook } = usePage().props as unknown as {
    chequebook: ChequeBook[];
  };

  // ✅ Toast for success/error messages
  useToastFromQuery();

  // ✅ Auth & Permissions
  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth?.permissions || [];
  const errors = pageProps.errors || {};

  // ✅ Permission: can user create new cheque books?
  const canCreate = permissions.includes("create chequebook");

  // State Management
  const [selectedBankId, setSelectedBankId] = React.useState<number | null>(null);
  const [globalSearch, setGlobalSearch] = React.useState("");
  const [chequeSearch, setChequeSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  // Grouping cheques client-side by bank
  const bankGroups = React.useMemo(() => {
    const groups: Record<number, {
      bank_id: number;
      bank_name: string;
      logo_url: string;
      total_cheques: number;
      used_count: number;
      available_count: number;
      created_by_name: string;
      entry_date: string;
      raw_cheques: ChequeBook[];
    }> = {};

    chequebook.forEach((item) => {
      const bId = item.bank_id;
      if (!groups[bId]) {
        groups[bId] = {
          bank_id: bId,
          bank_name: item.bank?.title || "Unknown Bank",
          logo_url: item.logo_url,
          total_cheques: 0,
          used_count: 0,
          available_count: 0,
          created_by_name: item.created_by_name,
          entry_date: item.entry_date || item.created_at,
          raw_cheques: [],
        };
      }

      const g = groups[bId];
      g.total_cheques += 1;
      g.raw_cheques.push(item);

      if (item.status === "used" || item.status === "issued") {
        g.used_count += 1;
      } else if (item.status === "unused" || !item.status) {
        g.available_count += 1;
      }

      // Identify most recent creator / entry date
      const currentDate = new Date(item.entry_date || item.created_at);
      const groupDate = new Date(g.entry_date);
      if (currentDate > groupDate) {
        g.entry_date = item.entry_date || item.created_at;
        g.created_by_name = item.created_by_name;
      }
    });

    return Object.values(groups);
  }, [chequebook]);

  // Filter bank groups by bank name
  const filteredBankGroups = React.useMemo(() => {
    return bankGroups.filter((g) =>
      g.bank_name.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [bankGroups, globalSearch]);

  // Get active bank details & list
  const selectedBank = React.useMemo(() => {
    if (selectedBankId === null) return null;
    return bankGroups.find((g) => g.bank_id === selectedBankId) || null;
  }, [bankGroups, selectedBankId]);

  // Filter individual bank's cheques by number and status
  const filteredCheques = React.useMemo(() => {
    if (!selectedBank) return [];
    return selectedBank.raw_cheques.filter((c) => {
      const matchesSearch =
        c.cheque_no.toLowerCase().includes(chequeSearch.toLowerCase()) ||
        (c.prefix && c.prefix.toLowerCase().includes(chequeSearch.toLowerCase()));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unused" && (c.status === "unused" || !c.status)) ||
        (statusFilter === "used" && (c.status === "used" || c.status === "issued")) ||
        c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [selectedBank, chequeSearch, statusFilter]);

  return (
    <SidebarProvider>
      <Head title="Cheque Books" />
      <AppSidebar variant="inset" />
      <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
        <SiteHeader breadcrumbs={breadcrumbs} />

        <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
            {/* ===== Header Section ===== */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
              <Heading
                title={selectedBank ? `${selectedBank.bank_name} Cheques` : "Cheque Books"}
                description={
                  selectedBank
                    ? `Managing cheques for ${selectedBank.bank_name}`
                    : "Manage and track all bank cheques"
                }
              />
              <div className="flex gap-3">
                {selectedBank && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedBankId(null);
                      setChequeSearch("");
                      setStatusFilter("all");
                    }}
                    className="rounded-xl font-bold transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Banks
                  </Button>
                )}
                <Button
                  asChild
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                >
                  <Link href="/cheque/create">
                    <Plus className="mr-2 h-4 w-4" /> Add Cheque Book
                  </Link>
                </Button>
              </div>
            </motion.div>

            {/* ===== Stats / Overview Cards ===== */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {selectedBank ? (
                // Stats for Selected Bank
                [
                  {
                    label: "Total Cheques",
                    value: selectedBank.total_cheques,
                    icon: CreditCard,
                    color: "text-orange-500",
                  },
                  {
                    label: "Available Cheques",
                    value: selectedBank.available_count,
                    icon: Hash,
                    color: "text-emerald-500",
                  },
                  {
                    label: "Used / Issued",
                    value: selectedBank.used_count,
                    icon: Hash,
                    color: "text-blue-500",
                  },
                  {
                    label: "Matching Filters",
                    value: filteredCheques.length,
                    icon: Filter,
                    color: "text-zinc-500",
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className={cn(
                      PREMIUM_ROUNDING,
                      "p-4 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">
                        {stat.label}
                      </p>
                      <span className="text-xl font-black tracking-tighter">{stat.value}</span>
                    </div>
                    <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                  </Card>
                ))
              ) : (
                // General Stats
                [
                  {
                    label: "Total Cheque Books",
                    value: chequebook.length,
                    icon: CreditCard,
                    color: "text-orange-500",
                  },
                  {
                    label: "Total Banks",
                    value: bankGroups.length,
                    icon: Building2,
                    color: "text-zinc-500",
                  },
                  {
                    label: "System Status",
                    value: "ACTIVE",
                    icon: Hash,
                    color: "text-green-500",
                    suffix: "ONLINE",
                  },
                  {
                    label: "Last Added",
                    value:
                      chequebook.length > 0
                        ? new Date(chequebook[0].created_at).toLocaleDateString()
                        : "NONE",
                    icon: CalendarIcon,
                    color: "text-blue-500",
                  },
                ].map((stat, i) => (
                  <Card
                    key={i}
                    className={cn(
                      PREMIUM_ROUNDING,
                      "p-4 border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between"
                    )}
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">
                        {stat.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black tracking-tighter">{stat.value}</span>
                        {stat.suffix && (
                          <span className="text-[10px] font-bold text-green-500">
                            {stat.suffix}
                          </span>
                        )}
                      </div>
                    </div>
                    <stat.icon className={cn("h-8 w-8 opacity-20", stat.color)} />
                  </Card>
                ))
              )}
            </motion.div>

            {/* ===== Main Content Area ===== */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                className={cn(
                  PREMIUM_ROUNDING,
                  "overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl"
                )}
              >
                {/* Search & Header Control Bar */}
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl">
                    {!selectedBank ? (
                      // Search Banks Input
                      <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search by bank name..."
                          value={globalSearch}
                          onChange={(e) => setGlobalSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                        />
                      </div>
                    ) : (
                      // Search Cheques Input + Status Select
                      <>
                        <div className="relative w-full max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Search cheque number..."
                            value={chequeSearch}
                            onChange={(e) => setChequeSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                          />
                        </div>
                        <div className="w-[180px]">
                          <ShadSelect value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 rounded-xl text-xs border-zinc-200 dark:border-zinc-800">
                              <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="all" className="text-xs">All Cheques</SelectItem>
                              <SelectItem value="unused" className="text-xs">Unused / Available</SelectItem>
                              <SelectItem value="used" className="text-xs">Used / Issued</SelectItem>
                              <SelectItem value="cancelled" className="text-xs text-rose-500">Cancelled</SelectItem>
                            </SelectContent>
                          </ShadSelect>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                      {selectedBank ? "Group Cheque Detail" : "Bank-wise Cheque Summary"}
                    </span>
                  </div>
                </div>

                {/* Data Grid Render */}
                <div className="p-0">
                  {chequebook.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        <CreditCard className="h-8 w-8 text-zinc-300" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold uppercase tracking-widest text-sm">
                          No Cheque Books Found
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Add a new cheque book to start tracking
                        </p>
                      </div>
                      <Button asChild variant="outline" className="mt-2 rounded-xl border-dashed">
                        <Link href="/cheque/create">Add Cheque Book</Link>
                      </Button>
                    </div>
                  ) : !selectedBank ? (
                    // Display list of Bank Groups
                    <div className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400">
                              Bank
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400 text-center">
                              Total Cheques
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400 text-center">
                              Used / Issued
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400 text-center">
                              Available / Unused
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400">
                              Added By
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400">
                              Date Added
                            </TableHead>
                            <TableHead className="px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBankGroups.length > 0 ? (
                            filteredBankGroups.map((group, index) => (
                              <TableRow
                                key={group.bank_id}
                                className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] transition-colors cursor-pointer"
                                onClick={() => setSelectedBankId(group.bank_id)}
                              >
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                                      <AvatarImage src={group.logo_url} />
                                      <AvatarFallback className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                                        <Building2 className="h-5 w-5" />
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter hover:text-orange-500 transition-colors">
                                        {group.bank_name}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">
                                        Bank ID: {group.bank_id.toString().padStart(3, "0")}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 min-w-[40px]">
                                    {group.total_cheques}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 min-w-[40px]">
                                    {group.used_count}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 min-w-[40px]">
                                    {group.available_count}
                                  </span>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                                    <UserIcon className="h-3 w-3" />
                                    <span>{group.created_by_name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                    <CalendarIcon className="h-3 w-3 text-zinc-400" />
                                    {new Date(group.entry_date).toLocaleDateString("en-GB", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="px-6 py-4 text-right"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    className="text-orange-500 hover:text-orange-600 font-bold text-xs uppercase"
                                    onClick={() => setSelectedBankId(group.bank_id)}
                                  >
                                    View Cheques
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-20 text-zinc-400 font-mono text-xs uppercase tracking-[0.3em]"
                              >
                                No banks match search
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    // Display Cheques drilled down for selected Bank
                    <DataTable data={filteredCheques} />
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
        `}</style>
      </SidebarInset>
    </SidebarProvider>
  );
}
