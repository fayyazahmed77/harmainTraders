"use client";

import React, { JSX, useState } from "react";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { 
    Eye, 
    Edit2, 
    Trash2, 
    MoreHorizontal, 
    CheckCircle, 
    RotateCw, 
    RefreshCcw, 
    ChevronUp, 
    ChevronDown, 
    ChevronLeft as IconChevronLeft, 
    ChevronRight as IconChevronRight, 
    ChevronsLeft as IconChevronsLeft, 
    ChevronsRight as IconChevronsRight, 
    Clock, 
    AlertCircle,
    Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type PurchaseStatus = "Completed" | "Partial Return" | "Returned" | "Pending Order" | "Canceled" | "Partial";

interface Purchases {
    id: number;
    date: string;
    created_at?: string;
    invoice: string;
    code?: string;
    status: string;
    supplier_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    extra_discount?: number;
    courier_charges?: number;
    tax_total?: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    supplier?: {
        id: number;
        title: string;
    };
    salesman?: {
        id: number;
        name: string;
    };
}

interface DataTableProps {
    data: Purchases[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState<Purchases | null>(null);

    const statusMap: Record<string, { color: string; icon: JSX.Element }> = {
        Completed: {
            color: "bg-green-100 text-green-800 border-green-200",
            icon: <CheckCircle size={14} />,
        },
        "Partial Return": {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            icon: <RotateCw size={14} />,
        },
        Returned: {
            color: "bg-red-100 text-red-800 border-red-200",
            icon: <RefreshCcw size={14} />,
        },
        "Pending Order": {
            color: "bg-orange-100 text-orange-800 border-orange-200",
            icon: <Clock size={14} />,
        },
        Canceled: {
            color: "bg-gray-100 text-gray-800 border-gray-200",
            icon: <AlertCircle size={14} />,
        },
        Partial: {
            color: "bg-indigo-100 text-indigo-800 border-indigo-200",
            icon: <RefreshCcw size={14} />,
        },
    };

    const columns: ColumnDef<Purchases>[] = [
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.date);
                const createdAt = row.original.created_at ? new Date(row.original.created_at) : null;

                const dateStr = date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });

                const timeStr = createdAt
                    ? createdAt.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      });

                return (
                    <div>
                        <div>{dateStr}</div>
                        <div className="text-xs text-muted-foreground font-medium">Time : {timeStr}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "invoice",
            header: "Invoice",
            cell: ({ row }) => (
                <div 
                    className="flex flex-col cursor-pointer group w-fit"
                    onClick={() => router.visit(`/purchase/${row.original.id}/view`)}
                >
                    <div className="flex items-center gap-2">
                        <span className="font-bold group-hover:text-orange-600 transition-colors underline-offset-4 group-hover:underline">{row.original.invoice}</span>
                    </div>
                    {row.original.code && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            Code: {row.original.code}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessorKey: "supplier.title",
            header: "Supplier",
            cell: ({ row }) => (
                <div>
                    <div>{row.original.supplier?.title || "Unknown Supplier"}</div>
                    <div className="text-xs text-muted-foreground">Salesman: {row.original.salesman?.name || "N/A"}</div>
                </div>
            )
        },
        { accessorKey: "no_of_items", header: "Items" },
        { 
            accessorKey: "gross_total", 
            header: "Gross Total",
            cell: ({ row }) => {
                const gross = Number(row.original.gross_total || 0);
                const courier = Number(row.original.courier_charges || 0);
                return <span className="font-mono">{(gross + courier).toLocaleString()}</span>;
            }
        },
        { 
            accessorKey: "discount_total", 
            header: "Discount",
            cell: ({ row }) => {
                const discTotal = Number(row.original.discount_total || 0);
                const extraDisc = Number(row.original.extra_discount || 0);
                return (
                    <div>
                        <div className="font-mono text-sm">{discTotal.toLocaleString()}</div>
                        {extraDisc > 0 && (
                            <div className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded border border-rose-100 dark:border-rose-900/30 w-fit font-mono mt-0.5">
                                Extra: -{extraDisc.toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            }
        },
        { 
            accessorKey: "net_total", 
            header: "Net Total",
            cell: ({ row }) => {
                const net = Number(row.original.net_total || 0);
                const extraDisc = Number(row.original.extra_discount || 0);
                const finalNet = net - extraDisc;
                return (
                    <div className="font-mono text-sm font-semibold">
                        {finalNet.toLocaleString()}
                        {extraDisc > 0 && (
                            <div className="text-[9px] text-muted-foreground line-through opacity-70">
                                {net.toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            }
        },
        { 
            accessorKey: "paid_amount", 
            header: "Paid",
            cell: ({ row }) => <span className="font-mono text-emerald-600 font-semibold">{Number(row.original.paid_amount || 0).toLocaleString()}</span>
        },
        { 
            accessorKey: "remaining_amount", 
            header: "Remaining",
            cell: ({ row }) => {
                const rem = Number(row.original.remaining_amount || 0);
                return (
                    <span className={`font-mono font-semibold ${rem > 0 ? 'text-rose-600' : 'text-zinc-500'}`}>
                        {rem.toLocaleString()}
                    </span>
                );
            }
        },
        {
            accessorKey: "status",
            header: () => <div className="text-center w-full">Status</div>,
            cell: ({ row }) => {
                const status = row.original.status || "Completed";
                const config = statusMap[status] || {
                    color: "bg-green-100 text-green-800 border-green-200",
                    icon: <CheckCircle size={14} />,
                };

                const { color, icon } = config;

                return (
                    <div className="flex items-center justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={cn(
                                    "h-7 w-7 rounded-full border flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-sm",
                                    color
                                )}>
                                    {icon}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-none shadow-xl">
                                {status}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                const purchase = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                className="font-medium focus:bg-slate-50"
                                onClick={() => router.visit(`/purchase/${purchase.id}/view`)}
                            >
                                <Eye size={14} className="mr-2 text-slate-500" /> View Invoice
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                                className="font-medium focus:bg-blue-50 text-blue-600"
                                onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=small`, '_blank')}
                            >
                                <Printer size={14} className="mr-2" /> Print Thermal
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                                className="font-medium focus:bg-blue-50 text-blue-600"
                                onClick={() => window.open(`/purchase/${purchase.id}/pdf?format=big`, '_blank')}
                            >
                                <Printer size={14} className="mr-2" /> Print A4
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                                className="font-medium focus:bg-slate-50"
                                onClick={() => router.visit(`/purchase/${purchase.id}/edit`)}
                            >
                                <Edit2 size={14} className="mr-2 text-slate-500" /> Edit Invoice
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="text-rose-600 font-bold focus:text-rose-700 focus:bg-rose-50"
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setPurchaseToDelete(purchase);
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <Trash2 size={14} className="mr-2" /> Delete Permanent
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
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnVisibility, rowSelection },
    });

    return (
        <TooltipProvider>
            <div className="w-full min-w-0">
                <div className="rounded-xl border border-border overflow-x-auto bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                {table.getHeaderGroups().map((headerGroup) =>
                                    headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="whitespace-nowrap px-3 py-2 h-10 text-white font-bold bg-orange-400">
                                            <div onClick={() => header.column.toggleSorting()} className="flex items-center cursor-pointer hover:text-white/80 transition-colors">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getIsSorted() === "asc" && (
                                                    <ChevronUp className="w-4 h-4 ml-1 inline" />
                                                )}
                                                {header.column.getIsSorted() === "desc" && (
                                                    <ChevronDown className="w-4 h-4 ml-1 inline" />
                                                )}
                                            </div>
                                        </TableHead>
                                    )),
                                )}
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id} className="h-10">
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-2 px-3 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center py-6">
                                        No Purchase Records Found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>

                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            {/* Rows per page */}
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label className="text-sm font-medium">Rows per page</Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => table.setPageSize(Number(value))}
                                >
                                    <SelectTrigger size="sm" className="w-20">
                                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Page Info */}
                            <div className="text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                            </div>

                            {/* Pagination Buttons */}
                            <div className="flex items-center gap-2">
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
                                    className="size-8"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <IconChevronLeft className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    className="size-8"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <IconChevronRight className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="outline"
                                    className="hidden size-8 lg:flex"
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

            {/* Deletion Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete bill <span className="font-bold text-foreground">{purchaseToDelete?.invoice}</span>?
                            This action will revert technical stock levels and cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (purchaseToDelete) {
                                    router.delete(`/purchase/${purchaseToDelete.id}/delete`, {
                                        onSuccess: () => setIsDeleteDialogOpen(false)
                                    });
                                }
                            }}
                        >
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
