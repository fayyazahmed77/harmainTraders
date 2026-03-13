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
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
    Select as ShadSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ChevronsLeft as IconChevronsLeft,
    ChevronsRight as IconChevronsRight,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { route } from "ziggy-js";
interface Account {
    id: number;
    code: string;
    title: string;
    type: string | number;
    account_type?: { id: number; name: string };
    opening_balance: number;
    created_at: string;
    created_by_name?: string;
    city?: { id: number; name: string };
    area?: { id: number; name: string };
    saleman?: { id: number; name: string };
    credit_limit?: number;
    status?: boolean;
}

interface DataTableProps {
    data: Account[];
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
    const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null);

    const handleDelete = () => {
        if (!selectedAccount) return;
        router.delete(`/account/${selectedAccount.id}`, {
            onSuccess: () => {
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Delete failed"),
        });
    };

    const columns: ColumnDef<Account>[] = [
        { accessorKey: "code", header: "Code" },
        { accessorKey: "title", header: "Title" },
        {
            accessorKey: "type",
            header: "Type",
            cell: ({ row }) => <span>{row.original.account_type?.name || row.original.type}</span>
        },
        {
            accessorKey: "city.name",
            header: "City",
            cell: ({ row }) => row.original.city?.name || "-"
        },
        {
            accessorKey: "area.name",
            header: "Area",
            cell: ({ row }) => row.original.area?.name || "-"
        },
        {
            accessorKey: "saleman.name",
            header: "Saleman",
            cell: ({ row }) => row.original.saleman?.name || "-"
        },
        {
            accessorKey: "opening_balance",
            header: "Opening Balance",
            cell: ({ row }) => (
                <span className={(row.original.opening_balance || 0) > 0 ? "text-green-600 font-medium" : ""}>
                    {(row.original.opening_balance || 0).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "credit_limit",
            header: "Credit Limit",
            cell: ({ row }) => (
                <span>
                    {(row.original.credit_limit || 0).toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const isActive = !!row.original.status;
                return (
                    <button
                        type="button"
                        onClick={() => {
                            router.patch(`/account/${row.original.id}/toggle-status`, {}, {
                                preserveScroll: true,
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
                const account = row.original;
                const canEdit = permissions.includes("edit account");
                const canDelete = permissions.includes("delete account");

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {/* ✅ View */}
                            <DropdownMenuItem
                                onClick={() => router.visit(`/account/${account.id}/show`)}
                            >
                                View
                            </DropdownMenuItem>

                            {/* ✅ Edit (only if user can edit) */}
                            {canEdit && (
                                <DropdownMenuItem
                                    onClick={() => router.visit(`/account/${account.id}/edit`)}
                                >
                                    Edit
                                </DropdownMenuItem>
                            )}

                            {/* ✅ Delete (only if user can delete) */}
                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedAccount(account);
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
        }

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
            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Account</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{selectedAccount?.title}</strong>?
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

            {/* Data Table */}
            <div className="rounded-md border shadow-sm mb-3 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none">
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
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center py-6 text-muted-foreground"
                                >
                                    No records found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {/* ✅ Dynamic Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
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
                            Page {table.getState().pagination.pageIndex + 1} of{" "}
                            {table.getPageCount()}
                        </div>

                        {/* Pagination buttons */}
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
