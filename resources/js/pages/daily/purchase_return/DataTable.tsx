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
import { toast } from "sonner";

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
    net_total: number;
    paid_amount: number;
    remaining_amount: number;
    total_cartons?: number;
    total_pcs?: number;
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

const PREMIUM_ROUNDING = "rounded-xl";

const toNum = (v: any) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [returnToDelete, setReturnToDelete] = useState<PurchaseReturn | null>(null);

    const columns: ColumnDef<PurchaseReturn>[] = [
        {
            accessorKey: "date",
            header: ({ column }) => (
                <div className="flex items-center gap-2 cursor-pointer select-none hover:text-orange-500 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <Calendar className="h-3 w-3" />
                    <span>Return Date</span>
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
                    <span>Return No</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100">
                        {row.original.invoice}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">
                        Original Bill: {row.original.original_invoice}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "supplier.title",
            header: ({ column }) => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>Supplier / Vendor</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                        {row.original.supplier.title}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest opacity-60 italic">
                        ID: #{row.original.supplier.id.toString().padStart(4, '0')}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "no_of_items",
            header: "Items Info",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Package className="h-3 w-3 text-zinc-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase">
                            {row.original.no_of_items} Products
                        </span>
                    </div>
                    <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                        {toNum(row.original.total_cartons)} Full / {toNum(row.original.total_pcs)} Pcs
                    </div>
                </div>
            ),
        },
        {
            accessorKey: "net_total",
            header: ({ column }) => (
                <div className="flex items-center gap-2 cursor-pointer select-none hover:text-orange-500 transition-colors" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    <Wallet className="h-3 w-3" />
                    <span>Total Amount</span>
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
                            <div className="h-1 w-1 rounded-full bg-emerald-500" />
                            <span className="text-[8px] font-bold text-emerald-600/70 uppercase tracking-widest font-mono">Verified Refund</span>
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
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 px-3 py-2">Select Action</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => window.open(`/purchase-return/${doc.id}/pdf`, '_blank')}
                            >
                                <Printer className="h-3.5 w-3.5 text-zinc-400 group-focus:text-white transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Print Return</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => router.visit(`/purchase-return/${doc.id}/show`)}
                            >
                                <Eye className="h-3.5 w-3.5 text-zinc-400 group-focus:text-white transition-colors" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-lg m-1 gap-2 cursor-pointer transition-colors focus:bg-orange-500 focus:text-white group"
                                onClick={() => router.visit(`/purchase-return/${doc.id}/edit`)}
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
                                <span className="text-[10px] font-bold uppercase tracking-widest">Delete Return</span>
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
                        placeholder="Search returns..."
                        className="h-10 pl-10 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20 text-[10px] uppercase font-bold tracking-widest transition-all"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="rounded-lg h-10 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors">
                        <Filter className="mr-2 h-3.5 w-3.5" /> Filters
                    </Button>
                    <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-2" />
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                        <ShieldAlert className="h-4 w-4 text-orange-500" />
                    </Button>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 overflow-hidden shadow-sm">
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
                                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-0"
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
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">No returns found</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between py-2 px-1">
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    Showing {table.getFilteredRowModel().rows.length} records in active cache
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg h-8 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Deletion Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                            Confirm Delete
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed pt-2">
                            Are you absolutely sure you want to delete this return <span className="text-rose-500 font-black tracking-tighter text-sm italic">{returnToDelete?.invoice}</span>?
                            <br /><br />
                            This action will <span className="text-zinc-900 dark:text-zinc-100 font-black">REVERT STOCK LEVELS</span> and <span className="text-zinc-900 dark:text-zinc-100 font-black">RESTORE INVOICE BALANCE</span>. This process cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0 pt-4">
                        <Button variant="ghost" className="rounded-lg h-10 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-lg h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            onClick={() => {
                                if (returnToDelete) {
                                    router.delete(`/purchase-return/${returnToDelete.id}`, {
                                        onSuccess: () => {
                                            setIsDeleteDialogOpen(false);
                                            toast.success("Return deleted successfully");
                                        }
                                    });
                                }
                            }}
                        >
                            Delete Now
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
