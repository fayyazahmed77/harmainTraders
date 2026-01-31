import React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Trash2, Eye } from "lucide-react";
import { router } from "@inertiajs/react";

interface PurchaseReturn {
    id: number;
    date: string;
    invoice: string;
    original_invoice: string;
    supplier_id: number;
    salesman_id: number;
    no_of_items: number;
    gross_total: number;
    discount_total: number;
    tax_total: number;
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    supplier: {
        id: number;
        title: string;
    };
    salesman: {
        id: number;
        name: string;
    } | null;
}

interface DataTableProps {
    data: PurchaseReturn[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

    const columns: ColumnDef<PurchaseReturn>[] = [
        {
            accessorKey: "date",
            header: "Date",
        },
        {
            accessorKey: "invoice",
            header: "Invoice",
        },
        {
            accessorKey: "original_invoice",
            header: "Orig. Inv",
        },
        {
            accessorKey: "supplier.title",
            header: "Supplier",
        },
        {
            accessorKey: "net_total",
            header: "Net Total",
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("net_total"));
                return <div className="font-medium">₨ {amount.toFixed(2)}</div>;
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const payment = row.original;
                return (
                    <div className="flex gap-2">
                        {/* <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/purchase-return/${payment.id}/edit`)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button> */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500"
                            onClick={() => {
                                if (confirm("Are you sure you want to delete this return?")) {
                                    router.delete(`/purchase-return/${payment.id}`);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div>
            <div className="flex items-center py-4">
                <Input
                    placeholder="Filter suppliers..."
                    value={(table.getColumn("supplier.title")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("supplier.title")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
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
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
