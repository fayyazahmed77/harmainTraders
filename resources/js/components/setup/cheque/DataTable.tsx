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
  Hash
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

interface DataTableProps {
  data: ChequeBook[];
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
  const [selectedChequeBook, setSelectedChequeBook] = React.useState<ChequeBook | null>(null);

  // ✅ Delete Cheque Book
  const handleDelete = () => {
    if (!selectedChequeBook) return;
    router.delete(`/chequebook/${selectedChequeBook.id}`, {
      onSuccess: () => {
        toast.success("✅ Protocol terminated. Cheque data purged.");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("❌ PURGE ACTION FAILED"),
    });
  };

  // ✅ Columns
  const columns: ColumnDef<ChequeBook>[] = [
    {
      accessorKey: "bank",
      header: "Financial Institution",
      cell: ({ row }) => {
        const cheque = row.original;
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
              <AvatarImage src={cheque.logo_url} />
              <AvatarFallback className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <Building2 className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{cheque.bank?.title || "VOID BANK"}</span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">BANK-ENTITY: {cheque.bank_id.toString().padStart(3, '0')}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Asset Signature",
      cell: ({ row }) => {
        const cheque = row.original;
        return (
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-bold">{cheque.prefix || "PFX"}</span>
            <span className="text-orange-500 font-black tracking-widest">{cheque.cheque_no}</span>
          </div>
        );
      }
    },
    {
      accessorKey: "entry_date",
      header: "Induction Date",
      cell: ({ row }) => {
        const date = row.original.entry_date
          ? new Date(row.original.entry_date)
          : null;
        return (
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <CalendarIcon className="h-3 w-3 text-zinc-400" />
            {date ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "PENDING"}
          </div>
        );
      },
    },

    {
      accessorKey: "status",
      header: "Protocol Status",
      cell: ({ row }) => {
        const status = row.original.status || "unused";
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
            status === "issued" || status === "used"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              : status === "cancelled"
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
          )}>
            <span className={cn("h-1 w-1 rounded-full animate-pulse",
              status === "issued" || status === "used" ? "bg-blue-500" :
                status === "cancelled" ? "bg-rose-500" : "bg-emerald-500"
            )} />
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "created_by_name",
      header: "Assigned Operator",
      cell: ({ row }) => {
        const cheque = row.original;
        return (
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            <UserIcon className="h-3 w-3" />
            <span>{cheque.created_by_name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Registry Actions",
      cell: ({ row }) => {
        const cheque = row.original;
        const canDelete = permissions.includes("delete chequebooks");

        return (
          <div className="flex items-center justify-end gap-1">
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-orange-500/10 hover:text-orange-500">
              <Link href={`/cheque/${cheque.id}/view`}>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-200 dark:border-zinc-800">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-400 p-3">Asset Intelligence</DropdownMenuLabel>
                <DropdownMenuItem asChild className="rounded-lg m-1 font-bold text-xs uppercase cursor-pointer">
                  <Link href={`/cheque/${cheque.id}/view`}>Dossier Insight</Link>
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                    <DropdownMenuItem
                      className="rounded-lg m-1 font-bold text-xs uppercase cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                      onClick={() => {
                        setSelectedChequeBook(cheque);
                        setOpenDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Purge Asset
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

  // ✅ Table setup
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
    <div className="w-full">
      {/* 🗑️ Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Asset Purge Authorization
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-zinc-500 uppercase tracking-widest py-4">
              CRITICAL: YOU ARE ABOUT TO PURGE FINANCIAL ASSET <span className="text-zinc-900 dark:text-zinc-100 font-black">{selectedChequeBook?.prefix}-{selectedChequeBook?.cheque_no}</span> FROM THE SYSTEM REGISTRY. THIS ACTION IS IRREVERSIBLE.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setOpenDeleteDialog(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
              Abort
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl font-bold uppercase tracking-widest text-[10px] bg-rose-600 hover:bg-rose-700">
              Confirm Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 📊 Data Table */}
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 px-6 py-4 font-black uppercase tracking-[0.2em] text-[10px] text-zinc-400">
                    <div
                      className={cn(
                        "flex items-center gap-1 cursor-pointer select-none",
                        header.column.getCanSort() && "hover:text-orange-500 transition-colors"
                      )}
                      onClick={() => header.column.toggleSorting()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="w-3 h-3" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-20 text-zinc-400 font-mono text-xs uppercase tracking-[0.3em]"
                  >
                    Empty Registry Archive
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* 🔢 Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Archive Entry: {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Load Factor</span>
              <ShadSelect
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-16 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs font-bold rounded-lg">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-zinc-200 dark:border-zinc-800"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] min-w-[60px] text-center">
                CH {table.getState().pagination.pageIndex + 1}/{table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl border-zinc-200 dark:border-zinc-800"
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
