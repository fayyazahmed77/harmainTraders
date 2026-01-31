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
import { toast } from "react-hot-toast";

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
  const permissions = pageProps.auth.permissions ?? [];
  const errors = pageProps.errors ?? {};

  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // edit / delete state
  const [editCategory, setEditCategory] = useState<ItemCategory | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | null>(null);

  // form states for edit
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ItemCategory["status"]>("active");
  const [imageFile, setImageFile] = useState<File | null>(null);

  // when opening edit, populate fields
  const openEdit = (cat: ItemCategory) => {
    setEditCategory(cat);
    setName(cat.name ?? "");
    setDescription(cat.description ?? "");
    setStatus(cat.status ?? "active");
    setImageFile(null); // user can choose to upload new file
  };

  // handle update (PUT via FormData with _method=PUT)
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCategory) return;

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
        toast.success("Category updated successfully!");
        setEditCategory(null);
      },
      onError: () => {
        toast.error("Update failed");
      },
    });
  };

  // handle delete
  const handleDelete = () => {
    if (!selectedCategory) return;
    router.delete(`/item-categories/${selectedCategory.id}`, {
      onSuccess: () => {
        toast.success("Category deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => {
        toast.error("Delete failed");
      },
    });
  };

  // Define columns
  const columns: ColumnDef<ItemCategory>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const getInitials = (name: string) => {
          const words = name.trim().split(/\s+/);
          if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
          }
          return words
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join('');
        };

        return row.original.image ? (
          <img
            src={`/images/${row.original.image}`}
            alt={row.original.name}
            className="h-12 w-12 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-orange-500 flex items-center justify-center text-sm font-semibold text-white">
            {getInitials(row.original.name)}
          </div>
        );
      },
    },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.description ?? "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs ${row.original.status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {row.original.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at") as string);
        return (
          <div>
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: "Created By",
      cell: ({ row }) => {
        const name = row.original.created_by_name || "Unknown";
        const imageUrl = row.original.created_by_avatar || "";
        const firstLetter = name.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Avatar className="h-8 w-8">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={name} />
                ) : (
                  <AvatarFallback>{firstLetter}</AvatarFallback>
                )}
              </Avatar>
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const cat = row.original;
        const canEdit =
          Array.isArray(permissions) && permissions.includes("edit itemcategory");
        const canDelete =
          Array.isArray(permissions) && permissions.includes("delete itemcategory");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => {
                    openEdit(cat);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenDeleteDialog(true);
                  }}
                >
                  Delete
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
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  return (
    <div className="w-full">
      {/* Edit Dialog */}
      <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              <div>
                <Label className="mb-2">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label className="mb-2">Description</Label>
                <Input
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label className="mb-2">Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ItemCategory["status"])}
                >
                  <SelectTrigger className="w-full" size="sm">
                    <SelectValue placeholder={status} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Image (upload to replace)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                />
                {editCategory?.image && (
                  <div className="mt-2">
                    <div className="text-xs text-muted-foreground">Current image:</div>
                    <img
                      src={`/images/${editCategory.image}`}
                      alt={editCategory.name}
                      className="mt-1 h-16 w-24 rounded object-cover border"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <div
                        onClick={() => header.column.toggleSorting()}
                        className="flex items-center gap-1 cursor-pointer select-none"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === "asc" && (
                          <ChevronUp className="w-4 h-4" />
                        )}
                        {header.column.getIsSorted() === "desc" && (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </React.Fragment>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>

          <div className="flex w-full items-center gap-8 lg:w-fit">
            {/* Rows per page */}
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={`${table.getState().pagination.pageSize}`} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Page info */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            {/* Pagination buttons */}
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
