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
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
    Edit3,
    Trash2,
    Tag,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ShieldAlert,
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
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
        errors: Record<string, string>;
    };
    const errors = pageProps.errors || {};

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

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
                    toast.success("Account category updated", { description: "Category has been updated successfully." });
                    setEditCategory(null);
                },
                onError: () => toast.error("Failed to update category"),
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
                toast.success("Account category deleted", { description: "Category has been removed successfully." });
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Failed to delete category"),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const columns: ColumnDef<AccountCategory>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="hover:bg-transparent p-0 font-black"
                >
                    NAME
                    {column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-2 h-4 w-4" />
                    ) : (
                        <ChevronDown className="ml-2 h-4 w-4" />
                    )}
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                        <Tag className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                        {row.getValue("name")}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: "percentage",
            header: "PERCENTAGE",
            cell: ({ row }) => (
                <div className="font-bold text-sm tabular-nums">
                    {row.getValue("percentage")}%
                </div>
            ),
        },
        {
            id: "actions",
            header: () => <div className="text-right mr-4">ACTIONS</div>,
            cell: ({ row }) => {
                const category = row.original;
                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setEditCategory(category);
                                        setName(category.name);
                                        setPercentage(String(category.percentage));
                                    }}
                                    className="rounded-lg gap-2 font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer"
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-sky-500" />
                                    Edit Category
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedCategory(category);
                                        setOpenDeleteDialog(true);
                                    }}
                                    className="rounded-lg gap-2 font-bold uppercase tracking-widest text-[10px] py-3 cursor-pointer focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                    Delete
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
        state: {
            sorting,
            columnVisibility,
        },
    });

    return (
        <div className="space-y-4">
            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 shadow-sm">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-zinc-200 dark:border-zinc-800">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-[10px] font-black uppercase tracking-widest  h-12 px-6">
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
                                        className="border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="py-4 px-6">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                                        No categories found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2 mb-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-4 py-2 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl">
                    Account Category Page {table.getState().pagination.pageIndex + 1} OF {table.getPageCount() || 1}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
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
                            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Edit3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Edit Category</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Update the details of this category</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="py-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm"
                                />
                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Percentage (%)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={percentage}
                                    onChange={(e) => setPercentage(e.target.value)}
                                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm"
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
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="max-w-md rounded-2xl border-rose-100 dark:border-rose-900/30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                    <DialogHeader>
                        <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
                            <ShieldAlert className="h-6 w-6 text-rose-500" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">Confirm delete</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold uppercase tracking-tight py-4">
                            Are you sure you want to delete <span className="text-zinc-900 dark:text-zinc-100 font-black">{selectedCategory?.name}</span>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setOpenDeleteDialog(false)}
                            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                        >
                            {isSubmitting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
