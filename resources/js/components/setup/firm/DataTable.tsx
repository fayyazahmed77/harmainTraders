"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
  MoreHorizontal,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Activity,
  User as UserIcon,
  Search,
  Landmark,
  Building
} from "lucide-react";
import { router, usePage, Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@radix-ui/react-dropdown-menu";

const PREMIUM_ROUNDING = "rounded-2xl";

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
  logo_url?: string;
}

interface DataTableProps {
  data: Firm[];
  searchTerm: string;
  filterType: string;
}

export function DataTable({ data, searchTerm, filterType }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth?.permissions || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedFirm, setSelectedFirm] = React.useState<Firm | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setGlobalFilter(searchTerm);
  }, [searchTerm]);

  const filteredData = React.useMemo(() => {
    if (filterType === "all") return data;
    if (filterType === "primary") return data.filter(f => f.defult);
    if (filterType === "standard") return data.filter(f => !f.defult);
    return data;
  }, [data, filterType]);

  const handleDelete = () => {
    if (!selectedFirm) return;
    setIsSubmitting(true);
    router.delete(`/firms/${selectedFirm.id}`, {
      onSuccess: () => {
        toast.success("Identity Purged", { description: "Firm profile removed from primary registry." });
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Purge Failed"),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const columns: ColumnDef<Firm>[] = [
    {
      accessorKey: "name",
      header: "Institution Identity",
      cell: ({ row }) => {
        const firm = row.original;
        return (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity" />
              <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center overflow-hidden relative z-10 transition-transform group-hover:scale-105">
                {firm.logo_url ? (
                  <img src={firm.logo_url} alt={firm.name} className="h-full w-full object-cover" />
                ) : (
                  <Building className="h-6 w-6 text-zinc-400" />
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none mb-1">
                {firm.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded">
                  {firm.code || `FIRM-${firm.id}`}
                </span>
                {firm.defult && (
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter bg-orange-500/10 px-2 py-0.5 rounded-full">Primary</span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "business",
      header: "Core Operations",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 italic">
            {row.original.business || "General Commercial"}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Segment: Standard</span>
        </div>
      )
    },
    {
      accessorKey: "contact",
      header: "Registry Connectivity",
      cell: ({ row }) => {
        const firm = row.original;
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-zinc-400" />
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">{firm.phone || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-zinc-400" />
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 lowercase">{firm.email || "—"}</span>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: "registration",
      header: "Registry Sync",
      cell: ({ row }) => {
        const firm = row.original;
        return (
          <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/20 p-2 pr-4 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 w-fit">
            <div className="h-8 w-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none text-zinc-900 dark:text-zinc-100">
                {new Date(firm.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter mt-1 italic leading-none">
                Node Verified
              </span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right mr-4">Operations</div>,
      cell: ({ row }) => {
        const firm = row.original;
        const canEdit = permissions.includes("edit firms");
        const canDelete = permissions.includes("delete firms");

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
                <Link href={`/firms/${firm.id}/show`} className="block w-full">
                  <DropdownMenuItem className="flex items-center gap-3 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer py-3 px-4 group">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Eye className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Company Dossier</span>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">View full commercial profile</span>
                    </div>
                  </DropdownMenuItem>
                </Link>
                {canEdit && (
                  <Link href={`/firms/${firm.id}/edit`} className="block w-full">
                    <DropdownMenuItem className="flex items-center gap-3 rounded-lg focus:bg-orange-500/10 cursor-pointer py-3 px-4 group">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform border border-orange-500/20">
                        <Pencil className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-orange-600 dark:text-orange-400">Modify Identity</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Update branding & parameters</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800 mx-2" />
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedFirm(firm);
                        setOpenDeleteDialog(true);
                      }}
                      className="flex items-center gap-3 rounded-lg focus:bg-rose-500/10 cursor-pointer py-3 px-4 group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-rose-500">Purge Profile</span>
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
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
  });

  return (
    <div className="w-full space-y-6">
      {/* 🧨 Delete Dialog Redesigned */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
          <DialogHeader className="p-6 pb-0 flex flex-col items-center">
            <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-zinc-900 dark:text-white">Security Handshake</DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">EXECUTING DESTRUCTIVE IDENTITY PURGE</DialogDescription>
          </DialogHeader>

          <div className="p-8 text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
              You are about to purge this commercial identity from the central directory. This modification will affect all linked transaction segments and is <span className="text-rose-600 font-black italic underline decoration-rose-500/30 underline-offset-4">irreversible</span>.
            </p>
            <div className="mt-8 p-6 rounded-2xl border-2 border-dashed border-rose-500/20 bg-rose-500/5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 text-[60px] font-black text-rose-500/5 -translate-y-1/2 translate-x-1/2 pointer-events-none italic tracking-tighter">PURGE</div>
              <div className="flex flex-col gap-1 relative z-10 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block mb-1">Target Signature</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none tabular-nums">{selectedFirm?.name}</span>
                <span className="text-[9px] font-mono font-bold text-zinc-400 truncate">MS-ID: {selectedFirm?.id}</span>
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
                        header.column.getCanSort() && "cursor-pointer hover:text-orange-500 transition-colors",
                        header.id === "actions" && "justify-end mr-4"
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
                      <div className="h-16 w-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center shadow-inner text-zinc-300">
                        <Building2 className="h-8 w-8" />
                      </div>
                      <div className="space-y-1 text-center">
                        <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Null State Detected</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">No commercial identity nodes available in primary bank</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* ✅ Precision Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-zinc-50/50 dark:bg-zinc-900/30 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col gap-1 mb-4 sm:mb-0">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Directory Coverage</p>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 italic">
                Viewing <span className="text-orange-500">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span>
                &mdash;
                <span className="text-orange-500">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredData.length)}</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase mx-3 tracking-tighter">of total</span>
                <span className="text-zinc-900 dark:text-zinc-100">{filteredData.length} Identities</span>
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
