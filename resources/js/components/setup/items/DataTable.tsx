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
    company_account?: { id: number; title: string };
    category: { id: number; name: string };
    trade_price: string;
    retail: string;
    stock_1: string;
    stock_2: string;
    reorder_level: string;
    packing_qty: string;
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
        { accessorKey: "category.name", header: "Category" },
        {
            accessorKey: "trade_price",
            header: "Trade Price",
            cell: ({ row }) => (
                <div className="font-semibold text-[13px]">
                    Rs. {Number(row.original.trade_price).toFixed(2)}
                </div>
            )
        },
        {
            accessorKey: "retail",
            header: "Retail Price",
            cell: ({ row }) => (
                <div className="font-semibold text-[13px]">
                    Rs. {Number(row.original.retail).toFixed(2)}
                </div>
            )
        },
        {
            id: "stock",
            header: "Stock (Full | Pcs)",
            cell: ({ row }) => {
                const stock1 = Number(row.original.stock_1) || 0;
                const stock2 = Number(row.original.stock_2) || 0;
                const packingQty = Number(row.original.packing_qty) || 1;
                const totalUnits = (stock1 * packingQty) + stock2;
                
                const reorder = Number(row.original.reorder_level) || 0;
                
                let statusText = "OK";
                let statusColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
                
                if (totalUnits <= 0) {
                    statusText = "Out of Stock";
                    statusColor = "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
                } else if (totalUnits <= reorder) {
                    statusText = "Lower";
                    statusColor = "text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
                } else if (totalUnits > reorder * 2) {
                    statusText = "Higher";
                    statusColor = "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
                }

                return (
                    <div className="flex flex-col gap-1 min-w-[120px]">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-semibold">{stock1} <span className="text-zinc-400 text-[10px] uppercase">Full</span></span>
                            <span className="text-zinc-300">|</span>
                            <span className="font-semibold">{stock2} <span className="text-zinc-400 text-[10px] uppercase">Pcs</span></span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] font-bold text-zinc-500">Total: {totalUnits}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "is_active",
            header: "Active",
            cell: ({ row }) => {
                const isActive = !!row.original.is_active;
                return (
                    <button
                        type="button"
                        onClick={() => {
                            router.patch(`/items/${row.original.id}/toggle-active`, {}, {
                                preserveScroll: true,
                                onSuccess: () => toast.success('Status updated')
                            });
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActive ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                        role="switch"
                        aria-checked={isActive}
                    >
                        <span
                            className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                        />
                    </button>
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
            <div className="rounded-md border shadow-sm mb-3 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none">
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
