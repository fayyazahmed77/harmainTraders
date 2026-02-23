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
    getFilteredRowModel,
    ColumnFiltersState,
} from "@tanstack/react-table";
import {
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    Edit3,
    Trash2,
    Percent,
    Tag,
    Activity,
    Search,
    ShieldAlert,
    Layers,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ChevronsLeft as IconChevronsLeft,
    ChevronsRight as IconChevronsRight,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PREMIUM_ROUNDING = "rounded-2xl";

interface AccountCategory {
    id: number;
    name: string;
    percentage: number;
}

interface DataTableProps {
    data: AccountCategory[];
}

export function DataTable({ data }: DataTableProps) {
    const pageProps = usePage().props as unknown as {
        auth: { user: any; permissions: string[] };
        errors: Record<string, string>;
    };
    const errors = pageProps.errors || {};

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [editCategory, setEditCategory] = useState<AccountCategory | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AccountCategory | null>(null);

    // form states
    const [name, setName] = useState("");
    const [percentage, setPercentage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // handle update
    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editCategory) return;
        setIsSubmitting(true);

        router.put(
            `/account-category/${editCategory.id}`,
            {
                name,
                percentage,
            },
            {
                onSuccess: () => {
                    toast.success("Registry Modified", { description: "Category classification has been updated." });
                    setEditCategory(null);
                },
                onError: () => toast.error("Modification Failed"),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // handle delete
    const handleDelete = () => {
        if (!selectedCategory) return;
        setIsSubmitting(true);
        router.delete(`/account-category/${selectedCategory.id}`, {
            onSuccess: () => {
                toast.success("Protocol Purged", { description: "Category node removed from registry." });
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Purge Failed"),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const columns: ColumnDef<AccountCategory>[] = [
        {
            accessorKey: "name",
            header: "Identity",
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                const id = row.original.id;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            <Tag className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{name}</span>
                            <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-widest">UID_{id.toString().padStart(4, '0')}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "percentage",
            header: "Differential",
            cell: ({ row }) => {
                const pct = row.getValue("percentage") as number;
                return (
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                        <span className="text-sm font-black tracking-tighter text-zinc-900 dark:text-zinc-100 italic tabular-nums">
                            {pct}%
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Offset</span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right mr-4">Systems</div>,
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl p-2 shadow-2xl">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setEditCategory(category);
                                        setName(category.name);
                                        setPercentage(String(category.percentage));
                                    }}
                                    className="flex items-center gap-3 rounded-lg focus:bg-zinc-100 dark:focus:bg-zinc-800 cursor-pointer py-3 px-4 group"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Edit3 className="h-4 w-4 text-sky-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Modify Index</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Update classification metadata</span>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedCategory(category);
                                        setOpenDeleteDialog(true);
                                    }}
                                    className="flex items-center gap-3 rounded-lg focus:bg-rose-500/10 cursor-pointer py-3 px-4 group"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-rose-500">Purge Node</span>
                                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Execute permanent registry removal</span>
                                    </div>
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
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 py-4">
                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                    <Input
                        placeholder="Filter registry identity..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-orange-500/20 transition-all text-xs font-bold"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Registry Density</span>
                        <span className="text-xs font-mono font-black text-orange-500 tabular-nums">{data.length.toString().padStart(2, '0')} NODES</span>
                    </div>
                    <div className="h-10 w-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white dark:text-zinc-900" />
                    </div>
                </div>
            </div>

            <div className="overflow-hidden border border-zinc-100 dark:border-zinc-800/50 rounded-2xl shadow-inner bg-zinc-50/30 dark:bg-black/20">
                <Table>
                    <TableHeader className="bg-zinc-100/50 dark:bg-zinc-900/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-14">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="wait">
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row, i) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group border-zinc-100 dark:border-zinc-800/50 hover:bg-white dark:hover:bg-zinc-900/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 py-8">
                                            <div className="h-12 w-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300">
                                                <Layers className="h-6 w-6" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Zero Indices</span>
                                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">No categorization data in registry</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Showing <span className="text-zinc-900 dark:text-zinc-100">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> to <span className="text-zinc-900 dark:text-zinc-100">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)}</span> of <span className="text-zinc-900 dark:text-zinc-100 text-orange-500">{data.length}</span> nodes
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nodes per page</span>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px] rounded-lg border-zinc-200 dark:border-zinc-800 bg-transparent text-[10px] font-black">
                                <SelectValue placeholder={table.getState().pagination.pageSize} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-[10px] font-bold">
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-1.5 px-2">
                            <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">
                                {table.getState().pagination.pageIndex + 1}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">of</span>
                            <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100">
                                {table.getPageCount()}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editCategory} onOpenChange={() => setEditCategory(null)}>
                <DialogContent className="max-w-xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                    <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                                <Edit3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Modify Classification</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Update category offset parameters</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="py-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Classification Label</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-sky-500/20 transition-all text-sm"
                                />
                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Differential Offset (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-sky-500/20 transition-all text-sm"
                                />
                                {errors.percentage && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.percentage}</p>}
                            </div>
                        </div>

                        <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setEditCategory(null)}
                                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel Protocol
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {isSubmitting ? "Syncing..." : "Update Node"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="max-w-md rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl">
                    <DialogHeader className="p-6 pb-0 flex flex-col items-center">
                        <div className="h-16 w-16 rounded-3xl bg-rose-500/10 flex items-center justify-center mb-6">
                            <ShieldAlert className="h-8 w-8 text-rose-500 animate-pulse" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-white">Security Handshake</DialogTitle>
                        <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-2">Executing Destructive Registry Removal</DialogDescription>
                    </DialogHeader>

                    <div className="p-6 text-center">
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            You are about to purge this category node from the central registry. This operation will irrevocably remove all linked classification offsets.
                        </p>
                        <div className="mt-6 p-4 rounded-xl border-2 border-dashed border-rose-500/20 bg-rose-500/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 block mb-1">Target Signature</span>
                            <span className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">{selectedCategory?.name}</span>
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setOpenDeleteDialog(false)}
                            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            Abort Operation
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20"
                        >
                            {isSubmitting ? "Expunging..." : "Execute Purge"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
