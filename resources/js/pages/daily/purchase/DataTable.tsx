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
import {
    MoreHorizontal,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ChevronsLeft as IconChevronsLeft,
    ChevronsRight as IconChevronsRight,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    RotateCw,
    RefreshCcw,
    Calendar,
    Hash,
    User,
    Package,
    Wallet,
    Info,
    History,
    Trash2,
    Edit,
    Eye,
    Receipt
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
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

    const statusMap: Record<PurchaseStatus, { color: string; icon: any; label: string }> = {
        Completed: {
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            icon: CheckCircle,
            label: "Settled"
        },
        "Partial Return": {
            color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
            icon: RotateCw,
            label: "Adjusting"
        },
        Returned: {
            color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
            icon: RefreshCcw,
            label: "Reversed"
        },
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-PK", {
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const columns: ColumnDef<Purchases>[] = [
        {
            accessorKey: "date",
            header: () => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-orange-500" />
                    <span>Temporal Node</span>
                </div>
            ),
            cell: ({ row }) => {
                const date = new Date(row.original.date);
                return (
                    <div className="flex flex-col">
                        <span className="font-black text-zinc-900 dark:text-zinc-100 tabular-nums text-xs">
                            {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter tabular-nums">
                            {date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "invoice",
            header: () => (
                <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-orange-500" />
                    <span>Reference</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-zinc-900 dark:text-zinc-100 tabular-nums text-xs tracking-tight">
                        {row.original.invoice}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest tabular-nums">
                        #{row.original.code}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "supplier.title",
            header: () => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-orange-500" />
                    <span>Provider</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col max-w-[200px]">
                    <span className="font-black text-zinc-900 dark:text-zinc-100 text-xs truncate">
                        {row.original.supplier?.title || "Unknown Entity"}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                        via {row.original.salesman?.name || "System Proxy"}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "no_of_items",
            header: () => (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-orange-500" />
                    <span>Units</span>
                </div>
            ),
            cell: ({ row }) => (
                <span className="font-mono text-xs font-black text-zinc-600 dark:text-zinc-400 tabular-nums">
                    {row.original.no_of_items.toString().padStart(2, '0')}
                </span>
            )
        },
        {
            accessorKey: "net_total",
            header: () => (
                <div className="flex items-center gap-2">
                    <Wallet className="h-3 w-3 text-orange-500" />
                    <span>Valuation</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col items-end min-w-[80px]">
                    <span className="font-mono text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(row.original.net_total)}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Gross: {formatCurrency(row.original.gross_total)}</span>
                </div>
            )
        },
        {
            accessorKey: "paid_amount",
            header: "Cleared",
            cell: ({ row }) => (
                <div className="flex flex-col items-end min-w-[70px]">
                    <span className="font-mono text-xs font-black text-emerald-500 tabular-nums">
                        {formatCurrency(row.original.paid_amount)}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "remaining_amount",
            header: "Deficit",
            cell: ({ row }) => (
                <div className="flex flex-col items-end min-w-[70px]">
                    <span className={cn(
                        "font-mono text-xs font-black tabular-nums",
                        row.original.remaining_amount > 0 ? "text-rose-500 animate-pulse" : "text-zinc-300 dark:text-zinc-700 font-normal"
                    )}>
                        {row.original.remaining_amount > 0 ? formatCurrency(row.original.remaining_amount) : "0"}
                    </span>
                </div>
            )
        },
        {
            accessorKey: "status",
            header: "Lifecycle",
            cell: ({ row }) => {
                const status = row.original.status as PurchaseStatus;
                const safeStatus = statusMap[status] || statusMap.Completed;
                const StatusIcon = safeStatus.icon;

                return (
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                        safeStatus.color
                    )}>
                        <StatusIcon className="h-3 w-3" />
                        {safeStatus.label}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Intelligence</div>,
            enableHiding: false,
            cell: ({ row }) => {
                const purchase = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-orange-500/10 group transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-zinc-400 group-hover:text-orange-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95">
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-2">Registry Protocol</p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <Receipt className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none truncate w-32">{purchase.invoice}</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Reference ID</span>
                                        </div>
                                    </div>
                                </div>
                                <DropdownMenuItem onClick={() => router.visit(`/purchase-return/create?purchase_id=${purchase.id}`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer focus:bg-orange-500 focus:text-white group">
                                    <History className="h-3.5 w-3.5 opacity-50 group-focus:opacity-100" />
                                    Process Return
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.visit(`/purchase/${purchase.id}/view`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer group">
                                    <Eye className="h-3.5 w-3.5 opacity-50 group-focus:text-orange-500" />
                                    Visual Audit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.visit(`/purchase/${purchase.id}/edit`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer group">
                                    <Edit className="h-3.5 w-3.5 opacity-50 group-focus:text-orange-500" />
                                    Modify Record
                                </DropdownMenuItem>
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <DropdownMenuItem onClick={() => router.visit(`/purchase/${purchase.id}/delete`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer text-rose-500 focus:bg-rose-500 focus:text-white group">
                                    <Trash2 className="h-3.5 w-3.5 opacity-70 group-focus:opacity-100" />
                                    Purge Record
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
        <div className="w-full space-y-4">
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-inner">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800 h-14 bg-zinc-50/50 dark:bg-zinc-950/20">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <React.Fragment key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 px-4">
                                            <div
                                                onClick={() => header.column.toggleSorting()}
                                                className={cn(
                                                    "flex items-center gap-1 cursor-pointer transition-colors active:scale-95",
                                                    header.column.getIsSorted() ? "text-orange-500" : "hover:text-zinc-600 dark:hover:text-zinc-300"
                                                )}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                <AnimatePresence>
                                                    {header.column.getIsSorted() === "asc" && (
                                                        <motion.div initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -2 }}>
                                                            <ChevronUp className="w-3 h-3 ml-1" />
                                                        </motion.div>
                                                    )}
                                                    {header.column.getIsSorted() === "desc" && (
                                                        <motion.div initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 2 }}>
                                                            <ChevronDown className="w-3 h-3 ml-1" />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </TableHead>
                                    ))}
                                </React.Fragment>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        <AnimatePresence mode="popLayout">
                            {table.getRowModel().rows.length ? (
                                table.getRowModel().rows.map((row, idx) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="group h-14 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-2 px-4 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center py-24 bg-zinc-50/30 dark:bg-zinc-950/10">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                                                <Info className="h-8 w-8 text-zinc-300" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-none">Inert Registry</p>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">No procurement cycles detected in current matrix</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Pagination HUD */}
            <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {table.getFilteredRowModel().rows.length} Total Core Threads
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    {/* Rows per page */}
                    <div className="hidden md:flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Page Size:</span>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-16 rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-black tabular-nums shadow-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-[11px] font-black tabular-nums">
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                            {table.getState().pagination.pageIndex + 1} <span className="opacity-20 mx-1">/</span> {table.getPageCount() || 1}
                        </div>

                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-20"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-20"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
