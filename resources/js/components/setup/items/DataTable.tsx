"use client";

import * as React from "react";
import {
    ColumnDef,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    SortingState,
    VisibilityState,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
    Table,
    TableHeader,
    TableHead,
    TableRow,
    TableBody,
    TableCell,
} from "@/components/ui/table";

import {
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { router } from "@inertiajs/react";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectTrigger, SelectContent, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Item {
    id: number;
    code: string;
    title: string;
    company: string;
    category: { id: number; name: string };
    type: string;
    trade_price: string;
    retail: string;
    stock_1: string;
    stock_2: string;
    is_import: boolean;
    is_active: boolean;
    created_at: string;
}

interface DataTableProps {
    data: Item[];
}

export function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);

    const handleDelete = () => {
        if (!selectedItem) return;

        router.delete(`/items/${selectedItem.id}`, {
            onSuccess: () => {
                toast.success("Item deleted successfully!");
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Delete failed"),
        });
    };

    const columns: ColumnDef<Item>[] = [
        {
            accessorKey: "code",
            header: "Code",
            cell: ({ row }) => (
                <div
                    className="cursor-pointer text-blue-600 hover:underline font-medium"
                    onClick={() => router.visit(`/items/${row.original.id}/show`)}
                >
                    {row.original.code}
                </div>
            ),
        },
        { accessorKey: "title", header: "Title" },
        { accessorKey: "company", header: "Company" },
        { accessorKey: "category.name", header: "Category" },
        { accessorKey: "type", header: "Type" },
        { accessorKey: "trade_price", header: "Trade Price" },
        { accessorKey: "retail", header: "Retail Price" },
        { accessorKey: "stock_1", header: "Stock 1" },
        { accessorKey: "stock_2", header: "Stock 2" },
        {
            accessorKey: "is_import",
            header: "Import",
            cell: ({ row }) => (row.original.is_import ? "Yes" : "No"),
        },
        {
            accessorKey: "is_active",
            header: "Active",
            cell: ({ row }) => (row.original.is_active ? "Yes" : "No"),
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
                const item = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.visit(`/items/${item.id}/show`)}>
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.visit(`/items/${item.id}/edit`)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSelectedItem(item);
                                    setOpenDeleteDialog(true);
                                }}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnVisibility },
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="w-full">

            {/* ✅ Delete Modal */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Item</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm">
                        Are you sure you want to delete <strong>{selectedItem?.title}</strong>?
                    </p>

                    <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ✅ Table */}
            <div className="rounded-md border shadow-sm">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        <div
                                            className="flex items-center gap-1 cursor-pointer"
                                            onClick={() => header.column.toggleSorting()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <ChevronUp className="w-4 h-4" />}
                                            {header.column.getIsSorted() === "desc" && <ChevronDown className="w-4 h-4" />}
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
                                <TableCell colSpan={columns.length} className="text-center py-6">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* ✅ Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-2">
                        <Label>Rows per page:</Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(v) => table.setPageSize(Number(v))}
                        >
                            <SelectTrigger className="w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 30, 40, 50].map((s) => (
                                    <SelectItem key={s} value={`${s}`}>
                                        {s}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <span>
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>

                        <Button
                            variant="outline"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
