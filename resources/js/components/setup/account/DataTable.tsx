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
    Users,
    Building2,
    Landmark,
    Banknote,
    Ticket,
    ShieldCheck
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { router, usePage, Link } from "@inertiajs/react";
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
    MapPin,
    Phone,
    Calendar,
    History,
    User,
    Info,
    ArrowUpRight,
    ArrowDownLeft
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
    current_balance?: number;
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

    const [sorting, setSorting] = React.useState<SortingState>([{ id: "title", desc: false }]);
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
       
        {
            accessorKey: "title",
            header: "Account Info",
            cell: ({ row }) => {
                const title = row.getValue("title") as string;
                const code = row.original.code;
                const firstLetter = title?.charAt(0).toUpperCase() || "?";
                return (
                    <div className="flex items-center gap-3 group py-1">
                        <Link
                            href={`/account/${row.original.id}/show`}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-sm shadow-md group-hover:scale-105 transition-all duration-300"
                        >
                            {firstLetter}
                        </Link>
                        <div className="flex flex-col">
                            <Link
                                href={`/account/${row.original.id}/show`}
                                className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-orange-500 transition-colors"
                            >
                                {title}
                            </Link>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tight">
                                ID: {code}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "type",
            header: "Category",
            cell: ({ row }) => {
                const typeName = row.original.account_type?.name || row.original.type || "Other";
                const type = typeof typeName === 'string' ? typeName.toLowerCase() : String(typeName).toLowerCase();
                
                let styles = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                let Icon = Building2;

                if (type.includes("customer")) {
                    styles = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
                    Icon = Users;
                } else if (type.includes("supplier")) {
                    styles = "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
                    Icon = Building2;
                } else if (type.includes("bank")) {
                    styles = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800";
                    Icon = Landmark;
                } else if (type.includes("cash")) {
                    styles = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
                    Icon = Banknote;
                } else if (type.includes("cheque")) {
                    styles = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
                    Icon = Ticket;
                } else if (type.includes("company")) {
                    styles = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
                    Icon = ShieldCheck;
                }

                return (
                    <Badge variant="outline" className={`flex w-fit items-center gap-1.5 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-tighter ${styles}`}>
                        <Icon className="h-3 w-3" />
                        {typeName}
                    </Badge>
                );
            }
        },
        {
            id: "context",
            header: "Reference & Location",
            cell: ({ row }) => {
                const city = row.original.city?.name;
                const area = row.original.area?.name;
                const saleman = row.original.saleman?.name;

                return (
                    <div className="flex flex-col gap-1 text-[11px]">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 font-medium whitespace-nowrap">
                            <MapPin className="h-3 w-3 text-orange-500" />
                            {city || area ? `${city || '-'} / ${area || '-'}` : "No Location"}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground italic">
                            <User className="h-3 w-3" />
                            {saleman || "Direct Account"}
                        </div>
                    </div>
                );
            }
        },
        {
            accessorKey: "current_balance",
            header: "Financial Status",
            cell: ({ row }) => {
                const balance = row.original.current_balance || 0;
                const typeName = row.original.account_type?.name || "";
                
                // DR/CR logic simplified for display
                // Customers: + is DR (Receivable)
                // Suppliers: + is CR (Payable)
                const isCustomer = typeName.toLowerCase().includes('customer');
                const isSupplier = typeName.toLowerCase().includes('supplier');
                
                let indicator = "";
                let indicatorColor = "";
                
                if (balance !== 0) {
                    if (isCustomer) {
                        indicator = balance > 0 ? "DR" : "CR";
                        indicatorColor = balance > 0 ? "bg-emerald-500" : "bg-rose-500";
                    } else if (isSupplier) {
                        indicator = balance > 0 ? "CR" : "DR";
                        indicatorColor = balance > 0 ? "bg-rose-500" : "bg-emerald-500";
                    } else {
                        indicator = balance > 0 ? "BAL" : "OD";
                        indicatorColor = balance > 0 ? "bg-zinc-500" : "bg-zinc-700";
                    }
                }

                return (
                    <div className="flex items-center gap-2 py-1">
                        <span className={`text-sm font-black tracking-tight ${balance > 0 ? "text-emerald-600 dark:text-emerald-400" : balance < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-400"}`}>
                            {Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {indicator && (
                            <span className={`px-1 py-0.5 rounded text-[8px] font-black text-white ${indicatorColor}`}>
                                {indicator}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const isActive = !!row.original.status;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                router.patch(`/account/${row.original.id}/toggle-status`, {}, {
                                    preserveScroll: true,
                                });
                            }}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus:ring-0 ${
                                isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            role="switch"
                            aria-checked={isActive}
                        >
                            <span
                                className={`pointer-events-none block h-2.5 w-2.5 rounded-full bg-white shadow-lg transition-transform ${
                                    isActive ? 'translate-x-3' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        
                    </div>
                );
            },
        },
        {
            accessorKey: "created_at",
            header: "Origin Info",
            cell: ({ row }) => {
                const date = new Date(row.original.created_at);
                const creator = row.original.created_by_name;
                return (
                    <div className="flex flex-col gap-0.5 text-[10px]">
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {date.toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground italic">
                            <History className="h-3 w-3" />
                            Created by {creator || "System"}
                        </div>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const account = row.original;
                const canEdit = permissions.includes("edit account");
                const canDelete = permissions.includes("delete account");

                return (
                    <div className="flex items-center justify-end pr-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-40">
                                {/* ✅ View */}
                                <DropdownMenuItem
                                    onClick={() => router.visit(`/account/${account.id}/show`)}
                                    className="cursor-pointer font-medium"
                                >
                                    View Details
                                </DropdownMenuItem>

                                {/* ✅ Edit (only if user can edit) */}
                                {canEdit && (
                                    <DropdownMenuItem
                                        onClick={() => router.visit(`/account/${account.id}/edit`)}
                                        className="cursor-pointer font-medium"
                                    >
                                        Edit Account
                                    </DropdownMenuItem>
                                )}

                                {/* ✅ Delete (only if user can delete) */}
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setSelectedAccount(account);
                                            setOpenDeleteDialog(true);
                                        }}
                                        className="cursor-pointer font-medium text-rose-600 focus:text-rose-600"
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
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
            <div className="rounded-xl border shadow-sm mb-3 overflow-x-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-none">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-orange-400 to-orange-600 dark:from-orange-600 dark:to-orange-800 sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-white font-black uppercase text-[10px] tracking-widest py-3 first:rounded-tl-lg last:rounded-tr-lg">
                                        <div
                                            className={`flex items-center gap-1.5 cursor-pointer select-none group/head ${header.id === 'actions' ? 'justify-end pr-1' : ''}`}
                                            onClick={() => header.column.toggleSorting()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            <div className="flex flex-col opacity-30 group-hover/head:opacity-100 transition-opacity">
                                                <ChevronUp className={`w-3 h-3 -mb-1 ${header.column.getIsSorted() === "asc" ? "opacity-100" : ""}`} />
                                                <ChevronDown className={`w-3 h-3 ${header.column.getIsSorted() === "desc" ? "opacity-100" : ""}`} />
                                            </div>
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
                                    className="group hover:bg-orange-50/50 dark:hover:bg-zinc-800/50 transition-all duration-200 border-zinc-100 dark:border-zinc-800"
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
