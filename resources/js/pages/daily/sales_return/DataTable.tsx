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

interface SalesReturn {
    id: number;
    date: string;
    invoice: string;
    original_invoice: string;
    customer_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    customer: {
        id: number;
        title: string;
    };
    salesman: {
        id: number;
        name: string;
    };
}

interface DataTableProps {
    data: SalesReturn[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    const columns: ColumnDef<SalesReturn>[] = [
        { accessorKey: "date", header: "Date" },
        { accessorKey: "invoice", header: "Return Inv" },
        { accessorKey: "original_invoice", header: "Orig. Inv" },
        { accessorKey: "customer.title", header: "Customer" },
        { accessorKey: "salesman.name", header: "Salesman" },
        { accessorKey: "no_of_items", header: "Items" },
        { accessorKey: "gross_total", header: "Gross Total" },
        { accessorKey: "net_total", header: "Net Total" },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                const saleReturn = row.original;

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
                                    router.visit(`/sales-return/${saleReturn.id}/edit`);
                                }}
                            >
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.visit(`/sales-return/${saleReturn.id}/delete`); // Note: Delete route might need confirmation logic
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
                                <TableCell colSpan={12} className="text-center py-6">
                                    No Sales Return Records Found
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
