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
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
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
import {
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Country {
  id: number;
  name: string;
  code: string;
  phone_code: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Pagination<T> {
  data: T[];
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface DataTableProps {
  data: Country[];
}

export function DataTable({ data }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [currency, setCurrency] = useState("");

  // handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCountry) return;

    router.put(
      `/countries/${editCountry.id}`,
      {
        name,
        code,
        phone_code: phoneCode,
        currency,
      },
      {
        onSuccess: () => {
          toast.success("Country updated successfully!");
          setEditCountry(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // handle delete
  const handleDelete = () => {
    if (!selectedCountry) return;
    router.delete(`/countries/${selectedCountry.id}`, {
      onSuccess: () => {
        toast.success("Country deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: "flag",
      header: "Flag",
      cell: ({ row }) => (
        <img
          src={`https://flagcdn.com/w40/${row.original.code.toLowerCase()}.png`}
          alt={row.original.name}
          className="w-8 h-6 rounded"
        />
      ),
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "phone_code", header: "Phone Code" },
    { accessorKey: "currency", header: "Currency" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs ${row.original.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
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
              {/* Tooltip */}
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
        const country = row.original;
        const canEdit = Array.isArray(permissions) && permissions.includes("edit countries");
        const canDelete = Array.isArray(permissions) && permissions.includes("delete countries");

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
                    setEditCountry(country);
                    setName(country.name);
                    setCode(country.code);
                    setPhoneCode(country.phone_code);
                    setCurrency(country.currency);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCountry(country);
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
      <Dialog
        open={!!editCountry}
        onOpenChange={() => setEditCountry(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Country</DialogTitle>
            <DialogDescription>
              Update the country details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              <div>
                <Label className="mb-2">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2">Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2">Phone Code</Label>
                <Input
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2">Currency</Label>
                <Input
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
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
            <DialogTitle>Delete Country</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedCountry?.name}</strong>?
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
      <div className="rounded-md border mt-4 ">
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
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* ✅ Dynamic Footer */}
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
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
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
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
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
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
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
