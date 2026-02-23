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
    Wand2,
    Terminal,
    User,
    Calendar,
    Search,
    ShieldAlert,
    Archive,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    ChevronsLeft as IconChevronsLeft,
    ChevronsRight as IconChevronsRight,
} from "lucide-react";
import { router, usePage } from "@inertiajs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PREMIUM_ROUNDING = "rounded-2xl";

interface AccountType {
    id: number;
    name: string;
    description: string;
    created_at: string;
    created_by: number;
    created_by_name?: string;
}

interface DataTableProps {
    data: AccountType[];
}

export function DataTable({ data }: DataTableProps) {
    const pageProps = usePage().props as unknown as {
        auth: { user: any; permissions: string[] };
        errors: Record<string, string>;
    };
    const permissions = pageProps.auth?.permissions || [];
    const errors = pageProps.errors || {};

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const [editAccountType, setEditAccountType] = useState<AccountType | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);

    // form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // handle update
    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editAccountType) return;
        setIsSubmitting(true);

        router.put(
            `/account-types/${editAccountType.id}`,
            {
                name,
                description,
            },
            {
                onSuccess: () => {
                    toast.success("Registry Modified", { description: "Account type classification has been updated." });
                    setEditAccountType(null);
                },
                onError: () => toast.error("Modification Failed"),
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    // handle delete
    const handleDelete = () => {
        if (!selectedAccountType) return;
        setIsSubmitting(true);
        router.delete(`/account-types/${selectedAccountType.id}`, {
            onSuccess: () => {
                toast.success("Protocol Purged", { description: "Account classification node removed from registry." });
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Purge Failed"),
            onFinish: () => setIsSubmitting(false),
        });
    };

    const columns: ColumnDef<AccountType>[] = [
        {
            accessorKey: "name",
            header: "Identity",
            cell: ({ row }) => {
                const name = row.getValue("name") as string;
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                            <Archive className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">{name}</span>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: {row.original.id}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Technical Scope",
            cell: ({ row }) => (
                <div className="max-w-[300px] truncate text-xs font-bold text-zinc-500 uppercase tracking-tighter italic">
                    {row.getValue("description") || "No functional scope defined"}
                </div>
            )
        },
        {
            accessorKey: "created_at",
            header: "Registry Date",
            cell: ({ row }) => {
                const date = new Date(row.getValue("created_at"));
                return (
                    <div className="flex items-center gap-2 text-zinc-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "created_by",
            header: "Operator",
            cell: ({ row }) => {
                const name = row.original.created_by_name || "System";
                const firstLetter = name.charAt(0).toUpperCase();

                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-zinc-200 dark:border-zinc-800">
                            <AvatarFallback className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-900 text-zinc-500">{firstLetter}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{name}</span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Systems",
            cell: ({ row }) => {
                const accounttype = row.original;
                const canEdit = permissions.includes("edit accounttype");
                const canDelete = permissions.includes("delete accounttype");

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
                                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                            {canEdit && (
                                <DropdownMenuItem
                                    className="rounded-lg gap-2 font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-sky-50 dark:focus:bg-sky-500/10 focus:text-sky-600"
                                    onClick={() => {
                                        setEditAccountType(accounttype);
                                        setName(accounttype.name);
                                        setDescription(accounttype.description);
                                    }}
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Modify Registry
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    className="rounded-lg gap-2 font-bold uppercase tracking-widest text-[10px] py-3 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600"
                                    onClick={() => {
                                        setSelectedAccountType(accounttype);
                                        setOpenDeleteDialog(true);
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Purge Protocol
                                </DropdownMenuItem>
                            )}
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
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnVisibility, rowSelection, columnFilters },
    });

    return (
        <div className="w-full space-y-6">
            {/* Search and Filters Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-zinc-800/50 mb-4">
                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors" />
                    <Input
                        placeholder="SEARCH PROTOCOLS..."
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="pl-10 h-11 bg-zinc-100/50 dark:bg-zinc-950/50 border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Total {data.length} Nodes
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog
                open={!!editAccountType}
                onOpenChange={() => setEditAccountType(null)}
            >
                <DialogContent className="max-w-xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
                    <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <Edit3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Modify Registry</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Update account classification parameters</DialogDescription>
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
                                    className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all text-sm"
                                />
                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-400">Technical specification</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-800 font-medium focus:ring-orange-500/20 transition-all text-sm resize-none"
                                />
                                {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter">{errors.description}</p>}
                            </div>
                        </div>
                        <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                variant="ghost"
                                type="button"
                                onClick={() => setEditAccountType(null)}
                                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel Modification
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
                            >
                                {isSubmitting ? "Updating..." : "Commit Changes"}
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
                        <DialogTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">Confirm Data Purge</DialogTitle>
                        <DialogDescription className="text-zinc-500 text-xs font-bold uppercase tracking-tight py-4">
                            Final warning: You are about to irrevocably purge <span className="text-zinc-900 dark:text-zinc-100 font-black">{selectedAccountType?.name}</span> from the classification registry. This action cannot be reversed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setOpenDeleteDialog(false)}
                            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        >
                            Abort Purge
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                        >
                            {isSubmitting ? "Purging..." : "Confirm Purge"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/20">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="h-14 px-6">
                                        <div
                                            onClick={header.column.getCanSort() ? () => header.column.toggleSorting() : undefined}
                                            className={cn(
                                                "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-colors",
                                                header.column.getCanSort() && "cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100"
                                            )}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {header.column.getIsSorted() === "asc" && (
                                                <ChevronUp className="w-3.5 h-3.5 text-orange-500" />
                                            )}
                                            {header.column.getIsSorted() === "desc" && (
                                                <ChevronDown className="w-3.5 h-3.5 text-orange-500" />
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence mode="wait">
                            {table.getRowModel().rows.length > 0 ? (
                                table.getRowModel().rows.map((row, index) => (
                                    <motion.tr
                                        key={row.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-300"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="px-6 py-4">
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </motion.tr>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-40 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-40">
                                            <Terminal className="h-8 w-8 text-zinc-300" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Registry Match Detected</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Premium */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-4 py-2 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl">
                    Archive Manifest Page {table.getState().pagination.pageIndex + 1} OF {table.getPageCount() || 1}
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-tight text-zinc-400">Scale:</span>
                        <Select
                            value={`${table.getState().pagination.pageSize}`}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-9 w-[80px] rounded-xl border-zinc-200 dark:border-zinc-800 font-bold bg-white/50 dark:bg-zinc-900/50 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                                {[10, 20, 30, 40, 50].map((pageSize) => (
                                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs font-bold font-mono">
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-none"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-none"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-none"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-white dark:hover:bg-zinc-900 transition-all shadow-none"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <IconChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

