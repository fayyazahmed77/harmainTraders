"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
  Eye,
  Trash2,
  Building2,
  User as UserIcon,
  Calendar as CalendarIcon,
  Hash,
  Landmark,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Edit3,
  Search,
  Activity
} from "lucide-react";
import { router, usePage, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PREMIUM_ROUNDING = "rounded-2xl";

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

interface DataTableProps {
  data: Bank[];
}

export function DataTable({ data }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth?.permissions || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState<Bank | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleDelete = () => {
    if (!selectedBank) return;
    setIsSubmitting(true);
    router.delete(`/banks/${selectedBank.id}`, {
      onSuccess: () => {
        toast.success("Registry Purged", { description: "Bank entity has been removed from the registry." });
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Purge Failed"),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const columns: ColumnDef<Bank>[] = [
    {
      accessorKey: "name",
      header: "Institution Identity",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative z-10 transition-transform group-hover:scale-105">
                {bank.logo_url ? (
                  <img src={bank.logo_url} alt={bank.name} className="h-full w-full object-cover" />
                ) : (
                  <Landmark className="h-6 w-6 text-zinc-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mb-1">
                {bank.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">
                  {bank.code || "NO-CODE"}
                </span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Verified</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "account_details",
      header: "Asset Intel",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-sm font-black tracking-tighter tabular-nums underline decoration-orange-500/30 underline-offset-4 font-mono">
                {bank.account_no}
              </span>
            </div>
            <div className="flex items-center gap-2 text-zinc-500">
              <Fingerprint className="h-3 w-3 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest">{bank.account_name}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "connectivity",
      header: "Registry Connectivity",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-2 flex-nowrap">
              <Phone className="h-3 w-3 text-zinc-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate">{bank.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2 flex-nowrap">
              <MapPin className="h-3 w-3 text-zinc-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate">{bank.branch || "—"}</span>
            </div>
            <div className="flex items-center gap-2 flex-nowrap col-span-2">
              <Mail className="h-3 w-3 text-zinc-400 flex-shrink-0" />
              <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate lowercase">{bank.email || "—"}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Operator",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/20 p-2 pr-4 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 w-fit">
            <Avatar className="h-8 w-8 rounded-lg border-2 border-white dark:border-zinc-800 shadow-sm">
              <AvatarImage src={bank.created_by_avatar || ""} />
              <AvatarFallback className="bg-orange-500 text-white font-black text-[10px] tabular-nums rounded-lg">
                {bank.created_by_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none text-zinc-900 dark:text-zinc-100">
                {bank.created_by_name}
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mt-1 italic">
                {new Date(bank.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right mr-4">Systems</div>,
      cell: ({ row }) => {
        const bank = row.original;
        const canEdit = permissions.includes("edit bank");
        const canDelete = permissions.includes("delete bank");

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                  <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-2 shadow-2xl">
                <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 px-4 py-2">Entity Protocols</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 mx-2" />
                <Link href={`#`} className="block w-full">
                  <DropdownMenuItem className="flex items-center gap-3 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer py-3 px-4 group">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Asset Dossier</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">View full account spec</span>
                    </div>
                  </DropdownMenuItem>
                </Link>
                {canEdit && (
                  <Link href={`#`} className="block w-full">
                    <DropdownMenuItem className="flex items-center gap-3 rounded-lg focus:bg-orange-500/10 cursor-pointer py-3 px-4 group">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-500/20">
                        <Edit3 className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-orange-600 dark:text-orange-400">Modify Registry</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Update bank configuration</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 mx-2" />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedBank(bank);
                        setOpenDeleteDialog(true);
                      }}
                      className="flex items-center gap-3 rounded-lg focus:bg-rose-500/10 cursor-pointer py-3 px-4 group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-rose-500">Purge Entity</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Permanent registry removal</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
          <Input
            placeholder="Filter institution identity..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-10 h-11 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-orange-500/20 transition-all text-xs font-bold"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Registry Density</span>
            <span className="text-xs font-mono font-black text-orange-500 tabular-nums">{data.length.toString().padStart(2, '0')} NODES</span>
          </div>
          <div className="h-10 w-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center">
            <Activity className="h-5 w-5 text-white dark:text-zinc-900" />
          </div>
        </div>
      </div>

      {/* 🧨 Delete Dialog Redesigned */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
          <DialogHeader className="p-6 pb-0 flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-zinc-900 dark:text-white">Security Handshake</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">EXECUTING DESTRUCTIVE REGISTRY REMOVAL</DialogDescription>
          </DialogHeader>

          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You are about to purge this institution and all associated asset nodes from the central registry. This modification is <span className="text-rose-600 font-black italic underline decoration-rose-500/30 underline-offset-4">irreversible</span>.
            </p>
            <div className="mt-8 p-6 rounded-2xl border-2 border-dashed border-rose-500/20 bg-rose-500/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 text-[60px] font-black text-rose-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none italic tracking-tighter">PURGE</div>
              <div className="flex flex-col gap-1 relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">Target Signature</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none tabular-nums">{selectedBank?.name}</span>
                <span className="text-[9px] font-mono font-bold text-zinc-400 truncate">{selectedBank?.account_no}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setOpenDeleteDialog(false)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Abort Operation
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/20 group overflow-hidden relative"
            >
              <span className="relative z-10">{isSubmitting ? "Expunging Node..." : "Execute Purge"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Premium DataTable UI */}
      <div className={cn(PREMIUM_ROUNDING, "overflow-hidden border border-zinc-200 dark:border-zinc-800/50 bg-white/70 dark:bg-black/20 backdrop-blur-xl shadow-inner")}>
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400 h-16 px-6">
                    <div
                      className={cn(
                        "flex items-center gap-2 select-none",
                        header.column.getCanSort() && "cursor-pointer hover:text-orange-500 transition-colors"
                      )}
                      onClick={() => header.column.toggleSorting()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="w-3 h-3 text-orange-500" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <AnimatePresence mode="wait">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, i) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="group border-b border-zinc-100 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors relative"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-5 px-6 relative z-10">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    <div className="absolute left-0 top-0 w-1 h-full bg-orange-500 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300 pointer-events-none" />
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-48 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="h-16 w-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shadow-inner">
                        <Landmark className="h-8 w-8 text-zinc-300" />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Zero Connectivity</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">No registered bank nodes detected in primary vault</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* ✅ Precision Pagination Redesigned */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-1 mb-4 sm:mb-0">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Registry Coverage</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 italic">
                Viewing <span className="text-orange-500">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
                &mdash;
                <span className="text-orange-500">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase mx-3 tracking-tighter">of total</span>
                <span className="text-zinc-900 dark:text-zinc-100">{data.length} Nodes</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden lg:flex items-center gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node Density</Label>
              <ShadSelect
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-9 w-20 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-[10px] font-black tabular-nums">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-[10px] font-bold">
                      {pageSize} NODES
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-9 p-0 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-10 px-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3 shadow-inner">
                <span className="text-xs font-black text-orange-500 font-mono tracking-tighter tabular-nums">{table.getState().pagination.pageIndex + 1}</span>
                <span className="h-3 w-[1px] bg-zinc-200 dark:bg-zinc-700 mx-1" />
                <span className="text-xs font-black text-zinc-300 dark:text-zinc-600 font-mono tracking-tighter tabular-nums">{table.getPageCount()}</span>
              </div>
              <Button
                variant="outline"
                className="h-9 p-0 w-9 rounded-xl border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
