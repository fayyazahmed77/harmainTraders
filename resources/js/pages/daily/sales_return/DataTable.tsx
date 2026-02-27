"use client";

import React, { useState } from "react";
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
import { toast } from "sonner";
import {
    Edit,
    Trash2,
    Eye,
    Search,
    Calendar,
    Hash,
    Receipt,
    Wallet,
    MoreHorizontal,
    ChevronDown,
    ChevronUp,
    Clock,
    User,
    ArrowUpDown,
    Filter,
    Package,
    ShieldAlert,
    History as HistoryIcon,
    Printer
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";

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

const PREMIUM_ROUNDING = "rounded-xl";

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [returnToDelete, setReturnToDelete] = useState<SalesReturn | null>(null);

    const columns: ColumnDef<SalesReturn>[] = [
        {
            accessorKey: "date",
            header: ({ column }) => (
                <div className="flex items-center gap-2 cursor-pointer select-none hover:text-orange-500 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <Calendar className="h-3 w-3" />
                    <span>Registry Date</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => {
                const date = new Date(row.original.date);
                return (
                    <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                            {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "invoice",
            header: ({ column }) => (
                <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    <span>Protocol ID</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                        {row.original.invoice}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                        Origin: {row.original.original_invoice}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "customer.title",
            header: ({ column }) => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Client Entity</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        {row.original.customer.title}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest opacity-60 italic">
                        Account Node: #{row.original.customer.id.toString().padStart(4, '0')}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "salesman.name",
            header: "Officer",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                        {row.original.salesman.name?.substring(0, 2)}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {row.original.salesman.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "no_of_items",
            header: "Units",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-zinc-400" />
                    <span className="text-[10px] font-black text-zinc-500 uppercase">
                        {row.original.no_of_items} Pcs
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "net_total",
            header: ({ column }) => (
                <div className="flex items-center gap-2 cursor-pointer select-none hover:text-orange-500 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <Wallet className="h-3 w-3" />
                    <span>Credit Value</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                </div>
            ),
            cell: ({ row }) => {
                const amount = Number(row.original.net_total);
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                            ₨ {amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-orange-500" />
                            <span className="text-[8px] font-bold text-orange-600/70 uppercase tracking-widest font-mono">Credit Note Issued</span>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const doc = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all active:scale-95">
                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 py-2">Credit Protocols</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => window.open(`/sales-return/${doc.id}/pdf`, '_blank')}
                            >
                                <Printer className="h-3.5 w-3.5 text-zinc-400 group-focus:text-white transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Print Return</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => router.visit(`/sales-return/${doc.id}/show`)}
                            >
                                <Eye className="h-3.5 w-3.5 text-zinc-400 group-focus:text-white transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => router.visit(`/sales-return/${doc.id}/edit`)}
                            >
                                <Edit className="h-3.5 w-3.5 text-zinc-400 group-focus:text-white transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Edit Return</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-rose-500/10 focus:text-rose-600 group"
                                onClick={() => {
                                    setReturnToDelete(doc);
                                    setIsDeleteDialogOpen(true);
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
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
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    });

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div className="relative max-w-sm w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        placeholder="Filter credit protocols..."
                        className="h-10 pl-10 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20 text-[10px] uppercase font-bold tracking-widest transition-all"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">View size</Label>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-20 rounded-lg text-[10px] font-bold border-zinc-200 dark:border-zinc-800">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl overflow-hidden">
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-[10px] font-bold uppercase tracking-widest py-2">
                                        {pageSize} Units
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2 hidden lg:block" />
                    <Button variant="ghost" size="sm" className="rounded-lg h-9 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">
                        <Filter className="mr-2 h-3.5 w-3.5" /> Filter Logic
                    </Button>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </Button>
                </div>
            </div>

            <div className="rounded-sml border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 overflow-hidden shadow-sm overflow-x-auto custom-scrollbar">
                <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-14 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-all border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-32 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                        <HistoryIcon className="h-8 w-8 text-zinc-300" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Zero Credit Protocols Found</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between py-2 px-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Cycle {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1} — {table.getFilteredRowModel().rows.length} Units Found
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-9 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Prev Sector
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-9 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next Sector
                    </Button>
                </div>
            </div>

            {/* Deletion Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                            Purge Registry Entry
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed pt-2">
                            Are you absolutely sure you want to delete return protocol <span className="text-rose-500 font-black tracking-tighter text-sm italic">{returnToDelete?.invoice}</span>?
                            <br /><br />
                            This action will <span className="text-zinc-900 dark:text-zinc-100 font-black">REVERT STOCK LEVELS</span> and <span className="text-zinc-900 dark:text-zinc-100 font-black">RESTORE INVOICE BALANCE</span>. This process cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button variant="ghost" className="rounded-lg h-10 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel Session
                        </Button>
                        <Button
                            className="rounded-lg h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            onClick={() => {
                                if (returnToDelete) {
                                    router.delete(`/sales-return/${returnToDelete.id}`, {
                                        onSuccess: () => {
                                            setIsDeleteDialogOpen(false);
                                            toast.success("Registry Entry Purged Successfully");
                                        }
                                    });
                                }
                            }}
                        >
                            Execute Purge
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
