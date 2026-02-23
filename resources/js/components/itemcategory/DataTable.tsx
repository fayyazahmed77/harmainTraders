"use client";

import React, { useState } from "react";
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
  MoreHorizontal,
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
  Plus,
  Edit3,
  Trash2,
  Package,
  Terminal,
  Clock,
  Search,
  CheckCircle2,
  ShieldAlert,
  Archive,
  ImageIcon
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface ItemCategory {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  status: "active" | "inactive";
  created_at: string;
  created_by?: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface DataTableProps {
  data: ItemCategory[];
}

export function DataTable({ data }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth?.permissions || [];
  const errors = pageProps.errors || {};

  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // edit / delete state
  const [editCategory, setEditCategory] = useState<ItemCategory | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);

  // form states for edit
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ItemCategory["status"]>("active");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openEdit = (cat: ItemCategory) => {
    setEditCategory(cat);
    setName(cat.name ?? "");
    setDescription(cat.description ?? "");
    setStatus(cat.status ?? "active");
    setImageFile(null);
    setImagePreview(cat.image ? `/images/${cat.image}` : null);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("name", name);
    formData.append("description", description ?? "");
    formData.append("status", status);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    router.post(`/item-categories/${editCategory.id}`, formData, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Classification Updated", { description: "Registry parameters have been modified successfully." });
        setEditCategory(null);
      },
      onError: () => toast.error("Protocol Update Failed"),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleDelete = () => {
    if (!selectedCategory) return;
    router.delete(`/item-categories/${selectedCategory.id}`, {
      onSuccess: () => {
        toast.success("Node Purged", { description: "The category registry entry has been permanently removed." });
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Purge Protocol Failed"),
    });
  };

  // Define columns
  const columns: ColumnDef<ItemCategory>[] = [
    {
      accessorKey: "image",
      header: "Identity",
      cell: ({ row }) => {
        const cat = row.original;
        const initials = cat.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

        return (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur" />
              {cat.image ? (
                <img
                  src={`/images/${cat.image}`}
                  alt={cat.name}
                  className="relative h-12 w-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800"
                />
              ) : (
                <div className="relative h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 dark:text-zinc-400">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{cat.name}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[150px]">
                {cat.description || "No specification provided"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Protocol Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === "active";
        return (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border",
            isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
          )}>
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isActive ? "bg-emerald-500" : "bg-rose-500")} />
            {isActive ? "ACTIVE" : "SUSPENDED"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: "Operator",
      cell: ({ row }) => {
        const name = row.original.created_by_name || "Unknown";
        const avatar = row.original.created_by_avatar;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7 border-2 border-white dark:border-zinc-800 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800">{name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400">{name}</span>
              <span className="text-[8px] text-zinc-400 font-mono tracking-tighter">ID: #{row.original.id.toString().padStart(4, '0')}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Registry Date",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-zinc-400" />
            <span className="text-[10px] font-black text-zinc-500 uppercase">
              {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Systems",
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original;
        const canEdit = permissions.includes("edit item_categories");
        const canDelete = permissions.includes("delete item_categories");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
              <div className="px-2 py-1.5 text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 mb-1">
                Asset Command
              </div>
              {canEdit && (
                <DropdownMenuItem onClick={() => openEdit(cat)} className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500/10 focus:text-orange-600 group">
                  <Edit3 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Modify Registry</span>
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-100 dark:border-zinc-800" />
                  <DropdownMenuItem onClick={() => { setSelectedCategory(cat); setOpenDeleteDialog(true); }} className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-rose-500/10 focus:text-rose-600 group">
                    <Trash2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Purge Protocol</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnVisibility, rowSelection, globalFilter },
  });

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search registry indices..."
            className="h-10 pl-10 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20 text-[10px] uppercase font-bold tracking-widest"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <Button variant="ghost" size="sm" className="rounded-lg h-10 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">
            <Archive className="mr-2 h-3.5 w-3.5" /> Export DB
          </Button>
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-14 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {header.isPlaceholder ? null : (
                      <div
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                        className={cn(
                          "flex items-center gap-2",
                          header.column.getCanSort() && "cursor-pointer select-none hover:text-orange-500 transition-colors"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: <ChevronUp className="h-3 w-3 text-orange-500" />,
                          desc: <ChevronDown className="h-3 w-3 text-orange-500" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                      <Terminal className="h-8 w-8 text-zinc-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest">No Buffer Data Detected</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
          Showing <span className="text-zinc-900 dark:text-zinc-100">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="text-zinc-900 dark:text-zinc-100">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)}</span> of <span className="text-zinc-900 dark:text-zinc-100">{data.length}</span> indices
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rows:</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-16 rounded-lg text-[10px] font-black border-zinc-200 dark:border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl min-w-[80px]">
                {[5, 10, 20, 30].map((size) => (
                  <SelectItem key={size} value={`${size}`} className="text-[10px] font-bold">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-[10px] font-black">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-orange-500"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Edit3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest">Registry Modification</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Update classification parameters for #{editCategory?.id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="py-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Class Title</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter title..."
                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Specification</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-800 font-medium focus:ring-orange-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-6 text-center">
                <div className="space-y-2 text-left">
                  <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">System Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="font-bold rounded-lg m-1">ACTIVE NODE</SelectItem>
                      <SelectItem value="inactive" className="font-bold rounded-lg m-1">SUSPENDED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 text-left block">Icon Update</Label>
                  <div className="group relative aspect-square w-32 mx-auto rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:border-orange-500/50 bg-zinc-50 dark:bg-zinc-900 shadow-inner">
                    {imagePreview ? (
                      <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-6 w-6 text-zinc-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase text-zinc-400">Replace Icon</span>
                      </div>
                    )}
                    <Input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" type="button" onClick={() => setEditCategory(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
              >
                {isSubmitting ? "Syncing..." : "Apply Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl">
          <DialogHeader className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-rose-600" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 italic">Confirmed Purge Required</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-tighter text-zinc-500 mt-2 leading-relaxed">
                You are attempting to permanently disconnect <span className="text-rose-600 font-black">"{selectedCategory?.name}"</span> from the central registry. This action cannot be reverted.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-6">
            <Button variant="destructive" onClick={handleDelete} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20">
              Authorize Purge Protocol
            </Button>
            <Button variant="ghost" onClick={() => setOpenDeleteDialog(false)} className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-500">
              Abort Command
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
