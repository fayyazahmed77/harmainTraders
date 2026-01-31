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
  const [selectedFirm, setSelectedFirm] = React.useState<Firm | null>(null);

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
      header: "Logo",
      cell: ({ row }) => {
        const logoUrl = row.original.logo_url;
        return (
          <div className="flex items-center justify-center h-10 w-10 rounded-md border border-border bg-muted/30 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={row.original.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                {row.original.name.substring(0, 2)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "business", header: "Business" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "created_by_name",
      header: "Created By",
      cell: ({ row }) => row.original.created_by_name || "—",
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
        const firm = row.original;
        const canEdit = permissions.includes("edit firm");
        const canDelete = permissions.includes("delete firm");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.visit(`/firms/${firm.id}/show`)}>
                View
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem onClick={() => router.visit(`/firms/${firm.id}/edit`)}>
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setSelectedFirm(firm);
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

  // ✅ React Table Initialization
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
      {/* 🧨 Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Firm</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedFirm?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
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
                  No firms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* ✅ Pagination Footer */}
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

            {/* Page Info */}
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>

            {/* Pagination Controls */}
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
