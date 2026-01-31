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
import { MoreHorizontal } from "lucide-react";
import {
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ChevronsLeft as IconChevronsLeft,
    ChevronsRight as IconChevronsRight,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    RotateCw,
    RefreshCcw,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";


interface Purchases {
    supplier: any;
    salesman: any;
    id: number;
    date: string;
    invoice: string;
    code: string;
    supplier_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    status: string;
}

interface DataTableProps {
    data: Purchases[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    type PurchaseStatus = "Completed" | "Partial Return" | "Returned";

    const statusMap: Record<PurchaseStatus, { color: string; icon: React.ReactNode }> = {
        Completed: {
            color: "bg-green-100 text-green-800",
            icon: <CheckCircle className="w-4 h-4" />,
        },
        "Partial Return": {
            color: "bg-yellow-100 text-yellow-800",
            icon: <RotateCw className="w-4 h-4" />,
        },
        Returned: {
            color: "bg-red-100 text-red-800",
            icon: <RefreshCcw className="w-4 h-4" />,
        },
    };

    const columns: ColumnDef<Purchases>[] = [
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.date);

                const dateStr = date.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });

                const timeStr = date.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                return (
                    <div>
                        <div>{dateStr}</div>
                        <div className="text-xs text-muted-foreground">Time : {timeStr}</div>
                    </div>
                );
            },
        },
        {
            accessorKey: "invoice",
            header: "Invoice",
            cell: ({ row }) => (
                <div>
                    <div>{row.original.invoice}</div>
                    <div className="text-xs text-muted-foreground">Code: {row.original.code}</div>
                </div>
            )
        },
        // Code column removed as per request
        {
            accessorKey: "supplier.title",
            header: "Supplier Name",
            cell: ({ row }) => (
                <div>
                    <div>{row.original.supplier.title}</div>
                    <div className="text-xs text-muted-foreground">Salesman: {row.original.salesman?.name}</div>
                </div>
            )
        },
        { accessorKey: "no_of_items", header: "Items" },
        { accessorKey: "gross_total", header: "Gross Total" },
        { accessorKey: "discount_total", header: "Discount %" },
        { accessorKey: "net_total", header: "Net Total" },
        { accessorKey: "paid_amount", header: "Paid" },
        { accessorKey: "remaining_amount", header: "Remaining" },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status as PurchaseStatus;

                // Fallback if status is missing or invalid
                const safeStatus = statusMap[status] ? status : "Completed";
                const { color, icon } = statusMap[safeStatus];

                return (
                    <span
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold w-fit ${color}`}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="cursor-help">{icon}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                                {safeStatus}
                            </TooltipContent>
                        </Tooltip>

                    </span>
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
                            <DropdownMenuItem onClick={() => router.visit(`/purchase-return/create?purchase_id=${purchase.id}`)}>
                                Purchase Return
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/purchase/${purchase.id}/view`);
                                }}
                            >
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/purchase/${purchase.id}/edit`);
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/purchase/${purchase.id}/delete`);
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
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
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
                                    ))}
                                </React.Fragment>
                            ))}
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
                                <TableCell colSpan={12} className="text-center py-6">
                                    No Purchase Records Found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
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

                        {/* Page info */}
                        <div className="text-sm font-medium">
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
    );
}
