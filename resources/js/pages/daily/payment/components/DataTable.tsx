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
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";
import { route } from 'ziggy-js';

interface Payment {
    id: number;
    date: string;
    voucher_no: string;
    account: { title: string };
    amount: number;
    type: string;
    payment_method: string;
    cheque_status?: string;
}

interface DataTableProps {
    data: Payment[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const columns: ColumnDef<Payment>[] = [
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const dateValue = row.getValue("date") as string;

                if (!dateValue) return "";

                const d = new Date(dateValue);

                return d
                    .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                    })
                    .replace(/ /g, "-"); // 28-Nov-2025
            }
        },

        { accessorKey: "voucher_no", header: "Voucher #" },
        { accessorKey: "account.title", header: "Party" },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => {
                const type = row.getValue("type") as string;
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${type === 'RECEIPT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {type}
                    </span>
                );
            }
        },
        { accessorKey: "payment_method", header: "Method" },
        {
            accessorKey: "amount",
            header: "Amount",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"));
                return <div className="font-bold">{amount.toFixed(2)}</div>;
            }
        },
        {
            accessorKey: "cheque_status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.cheque_status;
                if (!status || status === 'Pending') return null;

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status === 'Clear' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {status}
                    </span>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                const payment = row.original;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem

                                onClick={() => {
                                    router.visit(`/payments/${payment.id}/view`);
                                }}
                            >
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/payments/${payment.id}/edit`);
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/payments/${payment.id}/pdf`);
                                }}
                            >
                                Print
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            <div onClick={() => header.column.toggleSorting()}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getIsSorted() === "asc" && (
                                                    <ChevronUp className="w-4 h-4 inline" />
                                                )}
                                                {header.column.getIsSorted() === "desc" && (
                                                    <ChevronDown className="w-4 h-4 inline" />
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
                                <TableRow
                                    key={row.id}
                                    className={row.original.cheque_status === 'Canceled' ? "opacity-50 grayscale bg-muted/50 line-through decoration-rose-500/50" : ""}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-6">
                                    No Payment Records Found
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
