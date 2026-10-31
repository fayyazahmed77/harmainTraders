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
    Scale,
} from "lucide-react";
import { OpeningStockReconciliationDialog } from "./OpeningStockReconciliationDialog";

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
    stock_1: string | number;
    stock_2: string | number;
    opening_stock_1?: number;
    opening_stock_2?: number;
    opening_total_pcs?: number;
    available_stock?: number;
    available_full?: number;
    available_pcs?: number;
    stock_breakdown?: string;
    is_negative_stock?: boolean;
    purchase_pcs?: number;
    sale_pcs?: number;
    sale_return_pcs?: number;
    purchase_return_pcs?: number;
    net_movement_pcs?: number;
    reorder_level: string | number;
    packing_qty: string | number;
    is_active: boolean;
    primary_image_url?: string;
    created_at: string;
}

interface DataTableProps {
    data: Item[];
}

export function DataTable({ data }: DataTableProps) {
    const [tableData, setTableData] = React.useState<Item[]>(data);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [selectedItem, setSelectedItem] = React.useState<Item | null>(null);
    const [reconcileItem, setReconcileItem] = React.useState<Item | null>(null);
    const [openReconcileDialog, setOpenReconcileDialog] = React.useState(false);

    React.useEffect(() => {
        setTableData(data);
    }, [data]);

    const handleItemReconciled = (updated: any) => {
        setTableData((prev) =>
            prev.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
        );
    };

    const handleOpenReconcile = (item: Item) => {
        setReconcileItem(item);
        setOpenReconcileDialog(true);
    };

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
            accessorKey: "title", 
            header: "Title",
            cell: ({ row }) => (
                <div className="flex items-center gap-3 min-w-[220px]">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shrink-0 shadow-sm">
                        <img 
                            src={row.original.primary_image_url || (row.original as any).images?.[0]?.url || "https://placehold.co/40x40/f8fafc/cbd5e1?text=?"} 
                            alt={row.original.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placehold.co/40x40/f8fafc/cbd5e1?text=?";
                            }}
                        />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">
                            {row.original.title}
                        </span>
                        {row.original.code && (
                            <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {row.original.code}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
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
                const item = row.original;
                const packingQty = Number(item.packing_qty) || 1;

                // Available real-time stock
                const availFull = item.available_full !== undefined ? Number(item.available_full) : Number(item.stock_1) || 0;
                const availPcs = item.available_pcs !== undefined ? Number(item.available_pcs) : Number(item.stock_2) || 0;
                const totalUnits = item.available_stock !== undefined
                    ? Number(item.available_stock)
                    : (availFull * packingQty) + availPcs;

                // Baseline Opening stock
                const opFull = item.opening_stock_1 !== undefined ? Number(item.opening_stock_1) : null;
                const opPcs = item.opening_stock_2 !== undefined ? Number(item.opening_stock_2) : null;

                const reorder = Number(item.reorder_level) || 0;

                let statusText = "OK";
                let statusColor = "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";

                if (totalUnits < 0) {
                    statusText = "Deficit";
                    statusColor = "text-rose-700 bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/30";
                } else if (totalUnits === 0) {
                    statusText = "Out of Stock";
                    statusColor = "text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20";
                } else if (totalUnits <= reorder) {
                    statusText = "Lower";
                    statusColor = "text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
                } else if (reorder > 0 && totalUnits > reorder * 2) {
                    statusText = "Higher";
                    statusColor = "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
                }

                return (
                    <div className="flex flex-col gap-1 min-w-[125px]">
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`font-semibold ${totalUnits < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                                {availFull} <span className="text-zinc-400 text-[10px] uppercase">Full</span>
                            </span>
                            <span className="text-zinc-300">|</span>
                            <span className={`font-semibold ${totalUnits < 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
                                {availPcs} <span className="text-zinc-400 text-[10px] uppercase">Pcs</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold ${totalUnits < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500'}`}>
                                Total: {totalUnits}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                {statusText}
                            </span>
                        </div>
                        {opFull !== null && (
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                Op: {opFull}F | {opPcs}P
                            </div>
                        )}
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
                            <DropdownMenuItem onClick={() => handleOpenReconcile(item)}>
                                <Scale className="w-4 h-4 mr-2 text-amber-500" />
                                Reconcile Opening Stock
                            </DropdownMenuItem>
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
        data: tableData,
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

            {/* ✅ Smart Opening Stock Reconciliation Modal */}
            <OpeningStockReconciliationDialog
                item={reconcileItem}
                open={openReconcileDialog}
                onOpenChange={setOpenReconcileDialog}
                onSuccess={handleItemReconciled}
            />

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
            <div className="rounded-md border shadow-sm mb-3 overflow-x-auto touch-scroll-x min-w-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none">
                <Table className="min-w-[750px]">
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id} className={header.id === 'actions' ? 'sticky right-0 bg-muted z-20 px-3 md:px-4 shadow-[-4px_0_10px_rgba(0,0,0,0.05)]' : 'px-3 md:px-4'}>
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
                                <TableRow 
                                    key={row.id}
                                    className="cursor-pointer hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                                    onClick={() => handleOpenReconcile(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell 
                                            key={cell.id} 
                                            className={cell.column.id === 'actions' ? 'sticky right-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs z-10 py-2.5 px-3 md:px-4 shadow-[-4px_0_10px_rgba(0,0,0,0.05)]' : 'py-2.5 px-3 md:px-4'}
                                            onClick={(e) => {
                                                if (cell.column.id === 'actions' || cell.column.id === 'is_active') {
                                                    e.stopPropagation();
                                                }
                                            }}
                                        >
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
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
