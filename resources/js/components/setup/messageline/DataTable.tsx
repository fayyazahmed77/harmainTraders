"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { ChevronUp, ChevronDown, Eye, Pencil, Trash2, MessageSquare } from "lucide-react";
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
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";

interface MessageLine {
  id: number;
  messageline: string;
  category?: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}

interface DataTableProps {
  messagesline: MessageLine[];
}

export function DataTable({ messagesline }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth.permissions;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // edit/delete/view states
  const [editMessage, setEditMessage] = useState<MessageLine | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [viewMessage, setViewMessage] = useState<MessageLine | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageLine | null>(null);

  // form states
  const [messageline, setMessageLine] = useState("");
  const [category, setCategory] = useState("Sales");
  const [status, setStatus] = useState("active");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🧩 Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMessage) return;

    router.put(
      `/message-lines/${editMessage.id}`,
      { messageline, category, status },
      {
        onSuccess: () => {
          toast.success("Protocol updated successfully!");
          setEditMessage(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // 🗑 Handle delete
  const handleDelete = () => {
    if (!selectedMessage) return;
    router.delete(`/message-lines/${selectedMessage.id}`, {
      onSuccess: () => {
        toast.success("Protocol purged successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Purge failed"),
    });
  };

  // 📊 Table columns
  const columns: ColumnDef<MessageLine>[] = [
    {
      accessorKey: "messageline",
      header: "Protocol Content",
      cell: ({ row }) => (
        <div className="group/text flex items-start gap-3">
          <div className="mt-1 h-3 w-px bg-orange-400 opacity-0 group-hover/text:opacity-100 transition-opacity" />
          <p className="font-bold text-sm tracking-tight text-foreground/90 leading-relaxed font-mono italic">
            "{row.original.messageline}"
          </p>
        </div>
      ),
      size: 500,
    },
    {
      accessorKey: "category",
      header: "Domain",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{row.original.category || "General"}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "State",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-tighter ${row.original.status === "active"
            ? "bg-orange-500/10 text-orange-600 border border-orange-500/20"
            : "bg-muted text-muted-foreground border border-border"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "created_by_name",
      header: "Operator",
      cell: ({ row }) => <span className="text-[11px] font-bold text-foreground/70">{row.original.created_by_name}</span>
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right px-2">Operations</div>,
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-border/40 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group/btn"
              onClick={(e) => {
                e.stopPropagation();
                setViewMessage(msg);
              }}
            >
              <Eye className="h-4 w-4 text-muted-foreground group-hover/btn:text-orange-600 transition-colors" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-border/40 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditMessage(msg);
                setMessageLine(msg.messageline || "");
                setCategory(msg.category || "Sales");
                setStatus(msg.status || "active");
              }}
            >
              <Pencil className="h-4 w-4 text-muted-foreground group-hover/btn:text-emerald-600 transition-colors" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-border/40 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group/btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMessage(msg);
                setOpenDeleteDialog(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground group-hover/btn:text-rose-600 transition-colors" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: messagesline,
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
      {/* ✏️ Edit Dialog */}
      <Dialog open={!!editMessage} onOpenChange={() => setEditMessage(null)}>
        <DialogContent className="sm:max-w-[500px] border-border/60 rounded-sm p-0 overflow-hidden">
          <div className="h-1.5 bg-orange-500" />
          <div className="p-8">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-orange-500 text-white rounded-sm">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">Update Protocol</DialogTitle>
                  <DialogDescription className="font-medium">Modify existing communication instruction.</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instruction String</Label>
                  <Input
                    value={messageline}
                    onChange={(e) => setMessageLine(e.target.value)}
                    className="bg-muted/30 border-muted-foreground/10 focus:ring-1 focus:ring-orange-500/50 h-12 rounded-sm font-mono italic"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Domain</Label>
                    <ShadSelect value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full bg-muted/30 border-muted-foreground/10 h-11 rounded-sm font-bold text-xs uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm">
                        <SelectItem value="Offer List">Offer List</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Receipt">Receipt</SelectItem>
                        <SelectItem value="Payments">Payments</SelectItem>
                      </SelectContent>
                    </ShadSelect>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operation Status</Label>
                    <ShadSelect value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full bg-muted/30 border-muted-foreground/10 h-11 rounded-sm font-bold text-xs uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-sm">
                        <SelectItem value="active">Active System</SelectItem>
                        <SelectItem value="inactive">Suspended</SelectItem>
                      </SelectContent>
                    </ShadSelect>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t border-border/40">
                <Button type="button" variant="ghost" className="font-bold text-xs uppercase tracking-widest" onClick={() => setEditMessage(null)}>
                  Abort
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700 h-12 px-8 rounded-sm font-black uppercase tracking-wide shadow-xl shadow-orange-600/10">
                  Commit Update
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🗑 Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-sm border-2 border-rose-500/20">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-rose-500 text-white rounded-sm animate-pulse">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Purge Protocol?</DialogTitle>
                <DialogDescription className="font-semibold text-rose-600/70">Critical operation: This action is irreversible.</DialogDescription>
              </div>
            </div>
            <div className="p-4 bg-muted/50 border border-muted-foreground/10 rounded-sm font-mono text-sm italic py-6">
              "{selectedMessage?.messageline}"
            </div>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" className="font-bold text-xs uppercase tracking-widest" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 h-12 px-8 rounded-sm font-black uppercase tracking-wide" onClick={handleDelete}>
              Confirm Purge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 👁️ View Dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="sm:max-w-[600px] border-border/60 rounded-sm p-0 overflow-hidden">
          <div className="h-1.5 bg-orange-500" />
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-sm">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight uppercase">Protocol Preview</h2>
                  <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground">ID: #MSL-{viewMessage?.id}</span>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${viewMessage?.status === 'active' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-muted text-muted-foreground'
                }`}>
                {viewMessage?.status}
              </div>
            </div>

            <div className="relative p-10 bg-muted/30 border border-border/40 rounded-sm group overflow-hidden">
              <div className="absolute top-0 left-0 h-full w-1.5 bg-orange-500 opacity-20 group-hover:opacity-100 transition-opacity" />
              <div className="absolute top-4 right-6 text-[40px] font-black text-orange-500/10 pointer-events-none italic tracking-tighter">"</div>
              <p className="text-2xl font-black italic tracking-tight text-foreground leading-snug break-words">
                {viewMessage?.messageline}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Domain</Label>
                <p className="text-sm font-black uppercase tracking-tighter text-orange-600">{viewMessage?.category || "General"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Operator</Label>
                <p className="text-sm font-bold text-foreground/80">{viewMessage?.created_by_name}</p>
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</Label>
                <p className="text-sm font-bold text-foreground/80 tabular-nums">{viewMessage ? formatDate(viewMessage.created_at) : ''}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/40">
              <Button onClick={() => setViewMessage(null)} variant="secondary" className="font-bold text-xs uppercase tracking-widest h-12 flex-1 rounded-sm">
                Dismiss
              </Button>
              <Button
                onClick={() => {
                  const msg = viewMessage!;
                  setViewMessage(null);
                  setEditMessage(msg);
                  setMessageLine(msg.messageline || "");
                  setCategory(msg.category || "Sales");
                  setStatus(msg.status || "active");
                }}
                className="bg-orange-500 hover:bg-orange-600 h-12 flex-1 rounded-sm font-black uppercase tracking-widest shadow-xl shadow-orange-500/10 transition-all active:scale-95"
              >
                Modify Line
              </Button>
            </div>
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
            <AnimatePresence>
              {table.getRowModel().rows.map((row, idx) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group border-b border-border/40 last:border-0 hover:bg-orange-500/[0.02] cursor-pointer transition-colors"
                  onClick={() => setViewMessage(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-5 px-4 first:pl-6 last:pr-6">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>

        {/* Pagination Console */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-t border-border/40">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Showing <span className="text-foreground">{table.getRowModel().rows.length}</span> entries per cycle
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
