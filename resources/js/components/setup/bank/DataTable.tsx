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
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const permissions = pageProps.auth.permissions || [];

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState<Bank | null>(null);

  // ✅ Delete Bank
  const handleDelete = () => {
    if (!selectedBank) return;
    router.delete(`/banks/${selectedBank.id}`, {
      onSuccess: () => {
        toast.success("✅ Bank deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("❌ Delete failed!"),
    });
  };

  // ✅ Columns with logo & avatar
  const columns: ColumnDef<Bank>[] = [
    {
      accessorKey: "name",
      header: "Bank Name",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="flex items-center gap-3">
            {bank.logo_url ? (
              <img
                src={bank.logo_url}
                alt={bank.name}
                className="w-9 h-9 rounded-md object-cover border"
              />
            ) : (
              <div className="w-9 h-9 bg-muted rounded-md flex items-center justify-center text-xs text-gray-400">
                N/A
              </div>
            )}
            <span className="font-medium text-sm">{bank.name}</span>
          </div>
        );
      },
    },
    { accessorKey: "account_no", header: "Account No" },
    { accessorKey: "account_name", header: "Account Name" },
    { accessorKey: "code", header: "Code" },
    { accessorKey: "branch", header: "Branch" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "website", header: "Website" },
    {
      accessorKey: "created_by_name",
      header: "Created By",
      cell: ({ row }) => {
        const bank = row.original;
        return (
          <div className="flex items-center gap-2">
            {bank.created_by_avatar ? (
              <img
                src={bank.created_by_avatar}
                alt={bank.created_by_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-gray-400">
                ?
              </div>
            )}
            <span>{bank.created_by_name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at);
        return (
          <span>
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const bank = row.original;
        const canEdit = permissions.includes("edit bank");
        const canDelete = permissions.includes("delete bank");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.info("👁️ View feature coming soon!")}>
                View
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => toast.info("✏️ Edit feature coming soon!")}>
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedBank(bank);
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
      {/* 🧨 Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bank</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedBank?.name}</strong>?
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

      {/* ✅ Data Table */}
      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div
                      className="flex items-center gap-1 cursor-pointer select-none"
                      onClick={() => header.column.toggleSorting()}
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
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6 text-muted-foreground"
                >
                  No banks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
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
              <ShadSelect
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            {/* Page info */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            {/* Pagination Buttons */}
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
