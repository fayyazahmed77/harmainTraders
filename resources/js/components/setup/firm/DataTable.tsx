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
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
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
import { toast } from "react-hot-toast";

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
  const permissions = pageProps.auth.permissions || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedFirm, setSelectedFirm] = React.useState<Firm | null>(null);

  // ✅ SyncsearchTerm prop with table global filter
  React.useEffect(() => {
    setGlobalFilter(searchTerm);
  }, [searchTerm]);

  // ✅ Manual filter for Authority Type
  const filteredData = React.useMemo(() => {
    if (filterType === "all") return data;
    if (filterType === "primary") return data.filter(f => f.defult);
    if (filterType === "standard") return data.filter(f => !f.defult);
    return data;
  }, [data, filterType]);

  // ✅ Delete firm handler
  const handleDelete = () => {
    if (!selectedFirm) return;
    router.delete(`/firms/${selectedFirm.id}`, {
      onSuccess: () => {
        toast.success("Firm deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Failed to delete firm."),
    });
  };

  // ✅ Table Columns
  const columns: ColumnDef<Firm>[] = [
    {
      id: "logo",
      header: "Identity",
      cell: ({ row }) => {
        const logoUrl = row.original.logo_url;
        return (
          <div className="flex items-center gap-4 group/ident">
            <div className="flex items-center justify-center h-12 w-12 rounded-sm border-2 border-border/40 bg-muted/30 overflow-hidden group-hover/ident:border-orange-500/50 transition-colors shadow-sm">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={row.original.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground/40 group-hover/ident:text-orange-500 transition-colors" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-foreground/90 uppercase">{row.original.name}</span>
              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase leading-none mt-1">
                MS-ID: {row.original.id.toString().padStart(4, "0")}
              </span>
            </div>
          </div>
        );
      },
      size: 250,
    },

    {
      accessorKey: "business",
      header: "Core Business",
      cell: ({ row }) => (
        <span className="text-xs font-bold text-foreground/70 uppercase tracking-tighter italic">
          {row.original.business || "General Trade"}
        </span>
      )
    },
    {
      accessorKey: "contact",
      header: "Contact Meta",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground group/meta">
            <Phone className="w-3 h-3 text-orange-500/50" />
            <span>{row.original.phone || "No Pulse"}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground group/meta">
            <Mail className="w-3 h-3 text-orange-500/50" />
            <span className="lowercase">{row.original.email || "Offline"}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: "defult",
      header: "Authority",
      cell: ({ row }) => (
        row.original.defult ? (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-orange-500 text-white shadow-lg shadow-orange-500/20 text-[9px] font-black uppercase tracking-widest">
            <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
            Primary
          </div>
        ) : (
          <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">Standard</span>
        )
      ),
    },
    {
      accessorKey: "created_at",
      header: "Registration",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-foreground/70 tabular-nums">
              {formatDate(row.original.created_at)}
            </span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">By {row.original.created_by_name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right px-2">Operations</div>,
      cell: ({ row }) => {
        const firm = row.original;
        const canEdit = permissions.includes("edit firms");
        const canDelete = permissions.includes("delete firms");

        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-border/40 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group/btn"
              onClick={(e) => {
                e.stopPropagation();
                router.visit(`/firms/${firm.id}/show`);
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground group-hover/btn:text-orange-600 transition-colors" />
            </Button>
            {canEdit && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  router.visit(`/firms/${firm.id}/edit`);
                }}
              >
                <Pencil className="h-4 w-4 text-muted-foreground group-hover/btn:text-emerald-600 transition-colors" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-border/40 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFirm(firm);
                  setOpenDeleteDialog(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-muted-foreground group-hover/btn:text-rose-600 transition-colors" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ✅ React Table Initialization
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
    <div className="w-full">
      {/* 🧨 Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-sm border-2 border-rose-500/20 p-0 overflow-hidden sm:max-w-[500px]">
          <div className="h-1.5 bg-rose-500 animate-pulse" />
          <div className="p-8">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-rose-500 text-white rounded-sm shadow-xl shadow-rose-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">Purge Identity?</DialogTitle>
                  <DialogDescription className="font-semibold text-rose-600/70 uppercase text-[10px] tracking-widest">
                    Critical Operation Override Required
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="bg-muted/50 border border-border/40 p-6 rounded-sm mb-6 relative group overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1.5 bg-rose-500 opacity-20" />
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-2">Selected Firmware</p>
              <p className="text-2xl font-black italic tracking-tighter text-foreground uppercase">
                {selectedFirm?.name}
              </p>
              <p className="text-[10px] font-mono mt-1 opacity-60">FIRM-ID: {selectedFirm?.id}</p>
            </div>

            <DialogFooter className="pt-6 border-t border-border/40 gap-3">
              <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest" onClick={() => setOpenDeleteDialog(false)}>
                Abort
              </Button>
              <Button className="bg-rose-600 hover:bg-rose-700 h-12 px-8 rounded-sm font-black uppercase tracking-wide shadow-xl shadow-rose-500/10" onClick={handleDelete}>
                Confirm Purge
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📋 Table Section */}
      <div className="w-full rounded-sm border border-border/60 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-orange-50 border-b border-border/60 h-14">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground py-0">
                    <div
                      onClick={() => header.column.toggleSorting()}
                      className={`flex items-center gap-2 cursor-pointer select-none h-full hover:text-foreground transition-colors ${header.id === "actions" ? "justify-end" : ""
                        }`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <div className="bg-orange-500/10 p-1 rounded-sm">
                          {header.column.getIsSorted() === "asc" ? <ChevronUp className="w-3 h-3 text-orange-500" /> : <ChevronDown className="w-3 h-3 text-orange-500" />}
                        </div>
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
                table.getRowModel().rows.map((row, idx) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group border-b border-border/40 last:border-0 hover:bg-orange-500/[0.02] cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-5 px-4 first:pl-6 last:pr-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-20 text-muted-foreground font-black uppercase tracking-widest text-[10px]"
                  >
                    No Pulse Detected In Identity Bank
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* Pagination Console */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Showing <span className="text-foreground">{table.getRowModel().rows.length}</span> identities per cycle
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-sm font-black text-[9px] uppercase tracking-tighter disabled:opacity-30"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              PREV
            </Button>
            <div className="flex gap-1">
              {[...Array(table.getPageCount())].map((_, i) => (
                <div key={i} className={`h-1.5 w-4 rounded-sm transition-all ${table.getState().pagination.pageIndex === i ? 'bg-orange-500 w-8' : 'bg-border'}`} />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-sm font-black text-[9px] uppercase tracking-tighter disabled:opacity-30"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              NEXT
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
