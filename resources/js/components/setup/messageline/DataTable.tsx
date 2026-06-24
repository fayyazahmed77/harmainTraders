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
import {
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
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
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface MessageLine {
  id: number;
  messageline: string;
  category?: string[] | string | null;
  status: string;
  created_by_name?: string;
  created_at: string;
}

interface DataTableProps {
  messagesline: MessageLine[];
}

const CATEGORIES = ["Offer List", "Sales", "Purchase", "Receipt", "Payments"];

export function DataTable({ messagesline }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth.permissions;
  const canEdit   = Array.isArray(permissions) && permissions.includes("edit message");
  const canDelete = Array.isArray(permissions) && permissions.includes("delete message");

  const [sorting, setSorting]         = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection]         = useState({});

  // Dialog states
  const [editMessage,      setEditMessage]      = useState<MessageLine | null>(null);
  const [viewMessage,      setViewMessage]      = useState<MessageLine | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<MessageLine | null>(null);

  // Edit form state
  const [editText,     setEditText]     = useState("");
  const [editCategories, setEditCategories] = useState<string[]>(["Sales"]);
  const [editStatus,   setEditStatus]   = useState("active");

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ── Open edit dialog ──────────────────────────────────────────
  const openEdit = (msg: MessageLine) => {
    setEditMessage(msg);
    setEditText(msg.messageline || "");
    
    let cats: string[] = ["Sales"];
    if (Array.isArray(msg.category)) {
      cats = msg.category;
    } else if (typeof msg.category === "string") {
      try {
        const parsed = JSON.parse(msg.category);
        cats = Array.isArray(parsed) ? parsed : [msg.category];
      } catch {
        cats = [msg.category];
      }
    }
    setEditCategories(cats);
    setEditStatus(msg.status || "active");
  };

  // ── Save changes ──────────────────────────────────────────────
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMessage) return;

    router.put(
      `/message-lines/${editMessage.id}`,
      { messageline: editText, category: editCategories, status: editStatus },
      {
        onSuccess: () => {
          toast.success("Message line updated.");
          setEditMessage(null);
        },
        onError: () => toast.error("Could not save changes. Please try again."),
      }
    );
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    router.delete(`/message-lines/${deleteTarget.id}`, {
      onSuccess: () => {
        toast.success("Message line deleted.");
        setDeleteTarget(null);
      },
      onError: () => toast.error("Could not delete. Please try again."),
    });
  };

  // ── Status badge ──────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        status === "active"
          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
          : "bg-muted text-muted-foreground border border-border"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
        }`}
      />
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );

  // ── Table columns ─────────────────────────────────────────────
  const columns: ColumnDef<MessageLine>[] = [
    {
      accessorKey: "messageline",
      header: "Message Text",
      cell: ({ row }) => (
        <p className="text-sm font-medium text-foreground/90 leading-relaxed max-w-sm truncate">
          {row.original.messageline}
        </p>
      ),
      size: 450,
    },
    {
      accessorKey: "category",
      header: "Used For",
      cell: ({ row }) => {
        const cat = row.original.category;
        let cats: string[] = [];
        if (Array.isArray(cat)) {
          cats = cat;
        } else if (typeof cat === "string") {
          try {
            const parsed = JSON.parse(cat);
            cats = Array.isArray(parsed) ? parsed : [cat];
          } catch {
            cats = [cat];
          }
        }

        if (cats.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {cats.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wide"
                >
                  {c}
                </span>
              ))}
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wide">
            General
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "created_by_name",
      header: "Added By",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.created_by_name || "—"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date Added",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const msg = row.original;
        return (
          <div className="flex justify-end gap-1.5">
            {/* View */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-muted"
              title="View"
              onClick={(e) => { e.stopPropagation(); setViewMessage(msg); }}
            >
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>

            {/* Edit */}
            {canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-blue-500/10"
                title="Edit"
                onClick={(e) => { e.stopPropagation(); openEdit(msg); }}
              >
                <Pencil className="h-3.5 w-3.5 text-blue-500" />
              </Button>
            )}

            {/* Delete */}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg hover:bg-rose-500/10"
                title="Delete"
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(msg); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
              </Button>
            )}
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
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="w-full">

      {/* ══════════════════════════════════════════════════════════
          EDIT DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!editMessage} onOpenChange={() => setEditMessage(null)}>
        <DialogContent className="sm:max-w-[620px] rounded-2xl border-border/60 p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="p-6">
            <DialogHeader className="mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Pencil className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Edit Message Line</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Update the message and its settings below.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-5">
              {/* Message Text */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Message Text <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Enter your message..."
                  className="h-11 rounded-xl border-border/60 bg-muted/30"
                  required
                />
              </div>

              <div className="space-y-4">
                {/* Categories Checkboxes */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Used For</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-muted/20 border border-border/60 rounded-xl">
                    {CATEGORIES.map((c) => {
                      const isChecked = editCategories.includes(c);
                      return (
                        <div key={c} className="flex items-center space-x-2.5">
                          <Checkbox
                            id={`edit-cat-${c}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditCategories([...editCategories, c]);
                              } else {
                                setEditCategories(editCategories.filter((cat) => cat !== c));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`edit-cat-${c}`}
                            className="text-sm font-medium cursor-pointer select-none text-foreground/80 hover:text-foreground"
                          >
                            {c}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/60 rounded-xl">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable this message line on printed documents.
                    </p>
                  </div>
                  <Switch
                    checked={editStatus === "active"}
                    onCheckedChange={(checked) => setEditStatus(checked ? "active" : "inactive")}
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-border/40 gap-2">
                <Button type="button" variant="ghost" className="rounded-xl font-semibold" onClick={() => setEditMessage(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[420px] rounded-2xl border-rose-200 dark:border-rose-900/40 p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Delete Message Line?</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 text-rose-600/80">
                    This cannot be undone.
                  </DialogDescription>
                </div>
              </div>

              {/* Preview the message being deleted */}
              <div className="p-4 bg-muted/50 border border-border/60 rounded-xl">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Message to be deleted:</p>
                <p className="text-sm font-medium text-foreground leading-relaxed">
                  "{deleteTarget?.messageline}"
                </p>
              </div>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button variant="ghost" className="font-semibold rounded-xl" onClick={() => setDeleteTarget(null)}>
                Keep It
              </Button>
              <Button
                className="bg-rose-500 hover:bg-rose-600 text-white h-11 px-6 rounded-xl font-semibold shadow-lg shadow-rose-500/20 transition-all active:scale-95"
                onClick={handleDelete}
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          VIEW DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="sm:max-w-[520px] rounded-2xl border-border/60 p-0 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Message Line Details</h2>
                  <span className="text-xs text-muted-foreground">ID #{viewMessage?.id}</span>
                </div>
              </div>
              {viewMessage && <StatusBadge status={viewMessage.status} />}
            </div>

            {/* Message preview */}
            <div className="p-5 bg-muted/40 border border-border/60 rounded-xl relative">
              <span className="absolute top-3 left-4 text-4xl font-black text-orange-500/15 leading-none select-none">"</span>
              <p className="text-base font-semibold text-foreground leading-relaxed pt-4 break-words">
                {viewMessage?.messageline}
              </p>
              <span className="absolute bottom-2 right-4 text-4xl font-black text-orange-500/15 leading-none select-none">"</span>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-xl border border-border/40">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Used For</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(() => {
                    const cat = viewMessage?.category;
                    let cats: string[] = [];
                    if (Array.isArray(cat)) {
                      cats = cat;
                    } else if (typeof cat === "string") {
                      try {
                        const parsed = JSON.parse(cat);
                        cats = Array.isArray(parsed) ? parsed : [cat];
                      } catch {
                        cats = [cat];
                      }
                    }

                    if (cats.length > 0) {
                      return cats.map((c) => (
                        <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 border border-orange-500/20 text-[10px] font-bold uppercase tracking-wide">
                          {c}
                        </span>
                      ));
                    }
                    return <span className="text-sm font-semibold text-orange-600">General</span>;
                  })()}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Added By</p>
                <p className="text-sm font-semibold">{viewMessage?.created_by_name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Date Added</p>
                <p className="text-sm font-semibold tabular-nums">
                  {viewMessage ? formatDate(viewMessage.created_at) : ""}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-border/40">
              <Button
                variant="secondary"
                className="flex-1 h-11 rounded-xl font-semibold"
                onClick={() => setViewMessage(null)}
              >
                Close
              </Button>
              {canEdit && (
                <Button
                  className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                  onClick={() => {
                    const msg = viewMessage!;
                    setViewMessage(null);
                    openEdit(msg);
                  }}
                >
                  Edit This Message
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          TABLE
      ══════════════════════════════════════════════════════════ */}
      <Table>
        {/* Header */}
        <TableHeader className="bg-muted/40 border-b border-border/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground h-12 px-4 first:pl-6 last:pr-6"
                >
                  <div
                    onClick={() => header.column.toggleSorting()}
                    className={`flex items-center gap-1.5 cursor-pointer select-none hover:text-foreground transition-colors w-fit ${
                      header.id === "actions" ? "ml-auto" : ""
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() && (
                      <span className="text-orange-500">
                        {header.column.getIsSorted() === "asc"
                          ? <ChevronUp className="w-3.5 h-3.5" />
                          : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>

        {/* Body */}
        <TableBody>
          <AnimatePresence>
            {table.getRowModel().rows.map((row, idx) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="border-b border-border/40 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors duration-150"
                onClick={() => setViewMessage(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-4 px-4 first:pl-6 last:pr-6">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
          </span>{" "}
          –{" "}
          <span className="font-semibold text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              messagesline.length
            )}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground">{messagesline.length}</span> records
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg disabled:opacity-30"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {[...Array(table.getPageCount())].map((_, i) => (
            <button
              key={i}
              onClick={() => table.setPageIndex(i)}
              className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold transition-all ${
                table.getState().pagination.pageIndex === i
                  ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-lg disabled:opacity-30"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
