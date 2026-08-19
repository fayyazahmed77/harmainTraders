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
import { MoreHorizontal, Eye, Edit, FileText, Printer, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { router } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

interface Payment {
    id: number;
    date: string;
    voucher_no: string;
    account: { title: string };
    amount: number;
    type: string;
    payment_method: string;
    cheque_status?: string;
    group_id?: number | null;
}

interface DataTableProps {
    data: Payment[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        if (!paymentToDelete) return;
        setIsDeleting(true);
        router.delete(`/payments/${paymentToDelete.id}`, {
            onSuccess: () => {
                toast.success(`Payment voucher ${paymentToDelete.voucher_no} deleted successfully.`);
                setPaymentToDelete(null);
                setIsDeleting(false);
            },
            onError: (err) => {
                console.error(err);
                toast.error("Failed to delete payment voucher.");
                setIsDeleting(false);
            },
        });
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

        { 
            accessorKey: "voucher_no", 
            header: "Voucher #",
            cell: ({ row }) => {
                const voucherNo = row.getValue("voucher_no") as string;
                const groupId = row.original.group_id;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{voucherNo}</span>
                        {groupId && (
                            <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[8px] font-black uppercase tracking-widest rounded border border-orange-500/20 shadow-sm animate-pulse">
                                Multi
                            </span>
                        )}
                    </div>
                );
            }
        },
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

                const colorClasses = (() => {
                    switch (status) {
                        case 'Clear':
                        case 'Cleared':
                        case 'Deposit':
                            return 'bg-emerald-100 text-emerald-800';
                        case 'Withdrawal':
                            return 'bg-rose-100 text-rose-800';
                        default:
                            return 'bg-zinc-100 text-zinc-800';
                    }
                })();

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClasses}`}>
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
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-1 space-y-0.5">
                            {/* View Invoice */}
                            <DropdownMenuItem
                                onClick={() => router.visit(`/payments/${payment.id}/view`)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                            >
                                <Eye className="h-4 w-4 text-zinc-500" />
                                <span>View Invoice</span>
                            </DropdownMenuItem>

                            {/* Print Thermal */}
                            <DropdownMenuItem
                                onClick={() => window.open(`/payments/${payment.id}/pdf?format=small`, '_blank')}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer transition-colors"
                            >
                                <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>Print Thermal</span>
                            </DropdownMenuItem>

                            {/* Print A4 */}
                            <DropdownMenuItem
                                onClick={() => window.open(`/payments/${payment.id}/pdf?format=big`, '_blank')}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg cursor-pointer transition-colors"
                            >
                                <Printer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>Print A4</span>
                            </DropdownMenuItem>

                            {/* Edit Invoice */}
                            <DropdownMenuItem
                                onClick={() => router.visit(`/payments/${payment.id}/edit`)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                            >
                                <Edit className="h-4 w-4 text-zinc-500" />
                                <span>Edit Invoice</span>
                            </DropdownMenuItem>

                            {/* Delete Permanent */}
                            <DropdownMenuItem
                                onClick={() => setPaymentToDelete(payment)}
                                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                            >
                                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                <span>Delete Permanent</span>
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!paymentToDelete} onOpenChange={(open) => { if (!open) setPaymentToDelete(null); }}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 pb-4 bg-rose-500/5 border-b border-rose-500/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-tight">
                                    Delete Payment Voucher
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-500 font-medium">
                                    This action cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {paymentToDelete && (
                        <div className="p-6 space-y-4 text-xs">
                            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Voucher No</span>
                                    <span className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm">
                                        {paymentToDelete.voucher_no}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-zinc-200/60 dark:border-zinc-800 pt-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Party</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                        {paymentToDelete.account?.title || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-t border-zinc-200/60 dark:border-zinc-800 pt-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Amount</span>
                                    <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                                        Rs {Number(paymentToDelete.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>

                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                Deleting this payment voucher will automatically revert any allocated invoice amounts and restore remaining balances.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPaymentToDelete(null)}
                            className="flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20"
                        >
                            {isDeleting ? "Deleting..." : "Delete Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
