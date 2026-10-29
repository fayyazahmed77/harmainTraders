"use client";

import React, { useState } from "react";
import {
    ColumnDef,
    SortingState,
    VisibilityState,
    getCoreRowModel,
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

import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Payment {
    id: number;
    date: string;
    voucher_no: string;
    account: { title: string };
    payment_account?: { title: string };
    cheque: { prefix: string, cheque_no: string };
    amount: number;
    type: string;
    payment_method: string;
    cheque_status: string;
    clear_date: string;
    cheque_no?: string;
}

interface DataTableProps {
    data: Payment[];
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    total?: number;
    filters?: Record<string, any>;
}

export default function DataTable({
    data = [],
    currentPage = 1,
    lastPage = 1,
    perPage = 50,
    total = data?.length || 0,
    filters = {},
}: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant: 'default' | 'destructive' | 'success' | 'warning';
        confirmText: string;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
        variant: 'default',
        confirmText: 'Confirm'
    });

    const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const handleClearCheque = (payment: Payment) => {
        setConfirmModal({
            isOpen: true,
            title: "Clear Cheque",
            description: `Are you sure you want to mark the cheque ${payment.cheque?.prefix ? `${payment.cheque.prefix}-` : ''}${payment.cheque?.cheque_no || payment.cheque_no || ''} as cleared? This will update the bank balance.`,
            confirmText: "Clear Now",
            variant: 'success',
            onConfirm: () => router.put(`/clearing-cheque/${payment.id}/clear`)
        });
    };

    const handleCancelCheque = (payment: Payment) => {
        setConfirmModal({
            isOpen: true,
            title: "Cancel Cheque",
            description: `Are you sure you want to cancel the cheque ${payment.cheque?.prefix ? `${payment.cheque.prefix}-` : ''}${payment.cheque?.cheque_no || payment.cheque_no || ''}? The bill balance will be restored to unpaid.`,
            confirmText: "Cancel Cheque",
            variant: 'destructive',
            onConfirm: () => router.put(`/clearing-cheque/${payment.id}/cancel`)
        });
    };

    const goToPage = (pageNumber: number) => {
        router.get(
            "/clearing-cheque",
            {
                ...filters,
                page: String(pageNumber),
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handlePerPageChange = (val: string) => {
        router.get(
            "/clearing-cheque",
            {
                ...filters,
                per_page: val,
                page: "1",
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

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
        { accessorKey: "payment_account.title", header: "Account" },
        {
            header: "Cheque No",
            cell: ({ row }) => {
                const chequeRel = row.original.cheque;
                const manualChequeNo = row.original.cheque_no; 
                
                if (chequeRel) {
                    const prefix = chequeRel.prefix ? `${chequeRel.prefix}-` : '';
                    return `${prefix}${chequeRel.cheque_no}`;
                }
                
                return manualChequeNo || "-";
            }
        },
        {
            accessorKey: "cheque_date",
            header: "Cheque Date",
            cell: ({ row }) => {
                const dateValue = row.getValue("cheque_date") as string;

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
        {
            accessorKey: "clear_date",
            header: "Clear Date",
            cell: ({ row }) => {
                const dateValue = row.getValue("clear_date") as string;

                if (!dateValue) return "";

                const d = new Date(dateValue);
                const isToday = d.toDateString() === new Date().toDateString();
                const isPending = row.original.cheque_status === 'Pending';

                return (
                    <span className={isToday && isPending ? "text-red-600 font-bold" : ""}>
                        {d.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        }).replace(/ /g, "-")}
                    </span>
                );
            }
        },

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
                const status = row.getValue("cheque_status") as string;
                const config = {
                    'Clear': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    'Pending': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
                    'Canceled': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    'In Hand': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    'Distributed': 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    'Refund': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                }[status] || 'bg-muted text-muted-foreground border-border';

                return (
                    <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${config} w-fit`}>
                        {status}
                    </div>
                );
            }
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                const payment = row.original;

                if (payment.cheque_status !== 'Pending' && payment.cheque_status !== 'In Hand') {
                    return null;
                }

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleClearCheque(payment)}
                            >
                                Clear
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleCancelCheque(payment)}
                            >
                                Cancel
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
        getSortedRowModel: getSortedRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnVisibility, rowSelection },
    });

    return (
        <div className="w-full">
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50 dark:bg-[#26211e]/20">
                        <TableRow className="hover:bg-transparent border-b border-border">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="h-12">
                                            <div
                                                onClick={() => header.column.toggleSorting()}
                                                className="flex items-center gap-1 cursor-pointer select-none group/head"
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#9a3412]/60 dark:text-[#d6d3d1]/40 group-hover/head:text-primary transition-colors">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getIsSorted() === "asc" && (
                                                    <ChevronUp className="w-3 h-3 text-primary" />
                                                )}
                                                {header.column.getIsSorted() === "desc" && (
                                                    <ChevronDown className="w-3 h-3 text-primary" />
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
                            table.getRowModel().rows.map((row) => {
                                const isToday = row.original.clear_date && new Date(row.original.clear_date).toDateString() === new Date().toDateString();
                                const isPending = row.original.cheque_status === 'Pending';

                                return (
                                    <TableRow
                                        key={row.id}
                                        className={isToday && isPending ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500" : ""}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="text-center py-8 text-sm text-muted-foreground">
                                    No Payment Records Found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Server-Side Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t bg-card gap-4">
                    <div className="text-xs font-medium text-muted-foreground">
                        {total > 0 ? (
                            <>
                                Showing{" "}
                                <span className="font-bold text-foreground">
                                    {(currentPage - 1) * perPage + 1}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-foreground">
                                    {Math.min(currentPage * perPage, total)}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-foreground">{total}</span> records
                                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                                    <span className="ml-2 font-semibold text-primary">
                                        ({table.getFilteredSelectedRowModel().rows.length} row(s) selected)
                                    </span>
                                )}
                            </>
                        ) : (
                            "No records found"
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        {/* Rows per page */}
                        <div className="flex items-center gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                Rows per page
                            </Label>
                            <Select
                                value={String(perPage)}
                                onValueChange={handlePerPageChange}
                            >
                                <SelectTrigger size="sm" className="w-[75px] h-8 text-xs font-bold rounded-lg">
                                    <SelectValue placeholder={String(perPage)} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100, 250].map((pageSize) => (
                                        <SelectItem key={pageSize} value={String(pageSize)}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Page info */}
                        <div className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                            Page <span className="text-foreground">{currentPage}</span> of{" "}
                            <span className="text-foreground">{Math.max(lastPage, 1)}</span>
                        </div>

                        {/* Pagination buttons */}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => goToPage(1)}
                                disabled={currentPage <= 1}
                                title="First page"
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage <= 1}
                                title="Previous page"
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage >= lastPage}
                                title="Next page"
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => goToPage(lastPage)}
                                disabled={currentPage >= lastPage}
                                title="Last page"
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
