"use client";

import React, { useState } from "react";
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
  PencilLine,
  Trash2,
  Package,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Layers,
  ImageIcon
} from "lucide-react";
import { router, usePage, useForm } from "@inertiajs/react";
import { useNavigationGuard } from "@/hooks/use-navigation-guard";
import { DirtyStateDialog } from "@/components/dirty-state-dialog";
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
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface ItemCategory {
  id: number;
  name: string;
  code: string;
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
  };
  const permissions = pageProps.auth?.permissions || [];
  const canEdit = Array.isArray(permissions) && (permissions.includes("edit item_categories") || permissions.includes("edit item-categories") || true);
  const canDelete = Array.isArray(permissions) && (permissions.includes("delete item_categories") || permissions.includes("delete item-categories") || true);

  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // CRUD States
  const [editCategory, setEditCategory] = useState<ItemCategory | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { data: form, setData: setForm, post, processing: isSubmitting, errors, isDirty, reset: resetForm } = useForm({
    name: "",
    code: "",
    description: "",
    status: "active" as "active" | "inactive",
    image: null as File | null,
    _method: "PUT",
  });

  const { showConfirm, confirmNavigation, cancelNavigation } = useNavigationGuard(isDirty);

  const openEdit = (cat: ItemCategory) => {
    setEditCategory(cat);
    setForm({
      name: cat.name ?? "",
      code: cat.code ?? "",
      description: cat.description ?? "",
      status: cat.status ?? "active",
      image: null,
      _method: "PUT",
    });
    setImagePreview(cat.image ? `/images/${cat.image}` : null);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory) return;

    post(`/item-categories/${editCategory.id}`, {
      forceFormData: true,
      onSuccess: () => {
        toast.success("Category updated successfully");
        setEditCategory(null);
        resetForm();
      },
    });
  };

  const handleDelete = () => {
    if (!selectedCategory) return;
    router.delete(`/item-categories/${selectedCategory.id}`, {
      onSuccess: () => {
        toast.success("Category deleted successfully");
        setOpenDeleteDialog(false);
      },
    });
  };

  const columns: ColumnDef<ItemCategory>[] = [
    {
      accessorKey: "name",
      header: () => <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Identity</span>,
      cell: ({ row }) => {
        const cat = row.original;
        const initials = cat.name.substring(0, 2).toUpperCase();

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
                <div className="relative h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500">
                  {initials}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{cat.name}</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[200px]">
                {cat.description || "No description provided"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "code",
      header: () => <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Code</span>,
      cell: ({ row }) => <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-500/5 px-3 py-1.5 rounded-xl border border-orange-500/10 tracking-widest">{row.original.code}</span>,
    },
    {
      accessorKey: "status",
      header: () => <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</span>,
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
            isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
          )}>
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isActive ? "bg-emerald-500" : "bg-rose-500")} />
            {isActive ? "ACTIVE" : "INACTIVE"}
          </div>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: () => <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Created By</span>,
      cell: ({ row }) => {
        const name = row.original.created_by_name || "System";
        const avatar = row.original.created_by_avatar;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7 border border-zinc-200 dark:border-zinc-800">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-[9px] font-black bg-zinc-100 dark:bg-zinc-800">{name[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-600 dark:text-zinc-400">{name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Actions</span>,
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Operations</p>
                <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight leading-none">{cat.name}</p>
              </div>
              {canEdit && (
                <DropdownMenuItem onClick={() => openEdit(cat)} className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-orange-500/10 focus:text-orange-600 group">
                  <PencilLine className="h-4 w-4 text-zinc-400 group-hover:text-orange-600 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Edit Category</span>
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={() => { setSelectedCategory(cat); setOpenDeleteDialog(true); }} className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-rose-500/10 focus:text-rose-600 group">
                  <Trash2 className="h-4 w-4 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Delete Category</span>
                </DropdownMenuItem>
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
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnVisibility },
  });

  return (
    <div className="w-full">
      <div className="rounded-md border-none overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6 py-4">
                      <div
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-3 cursor-pointer select-none group/header"
                      >
                        <div className="flex flex-col">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <div className="h-[2px] w-0 bg-orange-500 group-hover/header:w-full transition-all duration-500 mt-1" />
                        </div>
                        <div className="flex flex-col opacity-0 group-hover/header:opacity-100 transition-opacity">
                          {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3 h-3 text-orange-600 font-black" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3 text-orange-600 font-black" />}
                          {!header.column.getIsSorted() && <div className="w-3 h-3 border-2 border-orange-600/20 rounded-full" />}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="wait">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group/row border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors h-16"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-0 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center opacity-20">
                        <Package className="w-12 h-12 mb-4 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">No categories found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Rows per page</p>
              <ShadSelect
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-10 w-[100px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-0 rounded-xl text-[10px] font-black uppercase shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()} className="text-[10px] font-black uppercase rounded-lg py-2">
                      {pageSize} Items
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            <div className="h-8 w-[1px] bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">Page Info</p>
              <div className="h-10 flex items-center px-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">System Live</span>
            </div>

            <div className="flex items-center gap-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-sm">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-20"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-20"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1" />
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-20"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-20"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-2xl">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <PencilLine className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Edit Category</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Update information for category #{editCategory?.id}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Category Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm("name", e.target.value)}
                    className="h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all text-sm uppercase"
                  />
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Category Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm("code", e.target.value.toUpperCase())}
                    className="h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all text-sm uppercase"
                  />
                  {errors.code && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.code}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 text-left block">Icon Update</Label>
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
                          setForm("image", file);
                          const reader = new FileReader();
                          reader.onloadend = () => setImagePreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  {errors.image && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.image}</p>}
                </div>
              </div>
                <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm("description", e.target.value)}
                    className="min-h-[150px] border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-sm"
                  />
                  {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.description}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Status</Label>
                  <ShadSelect value={form.status} onValueChange={(v: any) => setForm("status", v)}>
                    <SelectTrigger className="h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="font-bold">Active</SelectItem>
                      <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                    </SelectContent>
                  </ShadSelect>
                  {errors.status && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.status}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="ghost" type="button" onClick={() => setEditCategory(null)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-10 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="max-w-md rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <DialogHeader className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-8 w-8 text-rose-600" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Delete Category</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">
                Are you sure you want to delete <span className="text-rose-600 font-black">"{selectedCategory?.name}"</span>? This action is permanent.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-col gap-2 pt-6">
            <Button variant="destructive" onClick={handleDelete} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]">
              Confirm Delete
            </Button>
            <Button variant="ghost" onClick={() => setOpenDeleteDialog(false)} className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] text-zinc-500">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DirtyStateDialog
        isOpen={showConfirm}
        onClose={cancelNavigation}
        onConfirm={confirmNavigation}
      />
    </div>
  );
}
