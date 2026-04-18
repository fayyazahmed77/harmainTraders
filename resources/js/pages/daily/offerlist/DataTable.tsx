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
    ChevronUp,
    ChevronDown,
    ChevronLeft as IconChevronLeft,
    ChevronRight as IconChevronRight,
    Trash2,
    Eye,
    Calendar,
    User,
    Tag,
    Shield,
    Info,
    Sparkles,
    FileSearch,
    DownloadCloud,
    Briefcase,
    Link as LinkIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

interface Offer {
    id: number;
    date: string;
    offertype: string;
    is_live: boolean;
    account: {
        id: number;
        title: string;
    };
    firm: {
        id: number;
        name: string;
    } | null;
    user: {
        id: number;
        name: string;
    };
}

interface DataTableProps {
    data: Offer[];
}

export default function DataTable({ data }: DataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});
    
    // Deletion Modal State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

    const handleDeleteClick = (offer: Offer) => {
        setOfferToDelete(offer);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (offerToDelete) {
            router.delete(`/offer-list/${offerToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setOfferToDelete(null);
                }
            });
        }
    };

    const columns: ColumnDef<Offer>[] = [
        {
            accessorKey: "date",
            header: () => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-orange-500" />
                    <span>Date</span>
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
                            Saved Date
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "firm.name",
            header: () => (
                <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-orange-500" />
                    <span>Firm</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-black text-zinc-900 dark:text-zinc-100 text-xs truncate">
                        {row.original.firm?.name || "Default (Harmain)"}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        Firm Info
                    </span>
                </div>
            )
        },
        {
            accessorKey: "account.title",
            header: () => (
                <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-orange-500" />
                    <span>Offer Type</span>
                </div>  
            ),
            cell: ({ row }) => (
                <div className="flex flex-col max-w-[250px]">
                    <span className="font-black text-zinc-900 dark:text-zinc-100 text-xs truncate">
                        {row.original.offertype === "1" ? "General Offer" : row.original.offertype === "2" ? "Market Offer" : row.original.offertype || "General Offer"}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                        Offer Type
                    </span>
                </div>
            )
        },
        {
            accessorKey: "offertype",
            header: () => (
                <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3 text-orange-500" />
                    <span>Price Type</span>
                </div>
            ),
            cell: ({ row }) => {
                const type = row.original.offertype;
                const isType1 = type === '1';
                const isType2 = type === '2';
                
                return (
                    <div className="flex flex-col gap-1.5">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest w-fit",
                            isType1 ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                                isType2 ? "text-blue-500 bg-blue-500/10 border-blue-500/20" :
                                    "text-orange-500 bg-orange-500/10 border-orange-500/20"
                        )}>
                            <Sparkles className="h-3 w-3" />
                            {isType1 ? "Customer Group" : isType2 ? "Market Offer" : type}
                        </div>
                        {row.original.is_live && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-600 text-white text-[8px] font-black uppercase tracking-[0.2em] w-fit animate-pulse">
                                Live Now
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            accessorKey: "user.name",
            header: () => (
                <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-orange-500" />
                    <span>Prepared By</span>
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 uppercase">
                        {row.original.user?.name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                        {row.original.user?.name || "System"}
                    </span>
                </div>
            )
        },
        {
            id: "actions",
            header: () => <div className="text-right">Actions</div>,
            enableHiding: false,
            cell: ({ row }) => {
                const offer = row.original;

                return (
                    <div className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-orange-500/10 group transition-colors">
                                    <MoreHorizontal className="h-4 w-4 text-zinc-400 group-hover:text-orange-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-60 rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl p-1.5 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95">
                                <div className="px-2 py-1.5 mb-1">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 pb-1 mb-2">Offer Options</p>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                            <Tag className="h-4 w-4 text-orange-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none truncate w-36">{offer.account?.title || "General Offer"}</span>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Reference Node</span>
                                        </div>
                                    </div>
                                </div>

                                <DropdownMenuItem onClick={() => router.visit(`/offer-list/${offer.id}/view`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer focus:bg-orange-500 focus:text-white group">
                                    <Eye className="h-3.5 w-3.5 opacity-50 group-focus:opacity-100" />
                                    View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => router.post(`/offer-list/${offer.id}/toggle-live`)} className="rounded-lg text-xs font-bold gap-2 cursor-pointer focus:bg-orange-500 focus:text-white group">
                                    <Sparkles className={cn("h-3.5 w-3.5 opacity-50 group-focus:opacity-100", offer.is_live ? "text-orange-500" : "")} />
                                    {offer.is_live ? "Unmark Live" : "Mark as Live"}
                                </DropdownMenuItem>

                                {offer.is_live && (
                                    <>
                                        <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-2 py-1">Sharing</p>
                                        
                                        <DropdownMenuItem 
                                            onClick={() => {
                                                const url = `${window.location.origin}/live-offers?id=${offer.id}`;
                                                navigator.clipboard.writeText(url);
                                            }} 
                                            className="rounded-lg text-xs font-bold gap-2 cursor-pointer group"
                                        >
                                            <LinkIcon className="h-3.5 w-3.5 opacity-50 group-focus:text-emerald-500" />
                                            Copy Link
                                        </DropdownMenuItem>
                                        
                                        <DropdownMenuItem 
                                            onClick={() => {
                                                const url = `${window.location.origin}/live-offers?id=${offer.id}`;
                                                const text = encodeURIComponent(`🚨 New Live Offer Available!\n\nCheck out our latest ${offer.offertype === '1' ? 'Group' : 'Market'} offers here:\n${url}`);
                                                window.open(`https://wa.me/?text=${text}`, '_blank');
                                            }} 
                                            className="rounded-lg text-xs font-bold gap-2 cursor-pointer group text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 dark:text-emerald-500 dark:focus:bg-emerald-500/10"
                                        >
                                            <svg className="h-3.5 w-3.5 opacity-70 group-focus:opacity-100" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                            </svg>
                                            WhatsApp Share
                                        </DropdownMenuItem>
                                    </>
                                )}

                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest px-2 py-1">Print Laboratory</p>

                                <DropdownMenuItem onClick={() => window.open(`/offer-list/${offer.id}/pdf?group_by=category`, '_blank')} className="rounded-lg text-xs font-bold gap-2 cursor-pointer group">
                                    <FileSearch className="h-3.5 w-3.5 opacity-50 group-focus:text-orange-500" />
                                    Print (Category wise)
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => window.open(`/offer-list/${offer.id}/pdf?group_by=company`, '_blank')} className="rounded-lg text-xs font-bold gap-2 cursor-pointer group">
                                    <Briefcase className="h-3.5 w-3.5 opacity-50 group-focus:text-orange-500" />
                                    Print (Company wise)
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => window.location.href = `/offer-list/${offer.id}/download`} className="rounded-lg text-xs font-bold gap-2 cursor-pointer group">
                                    <DownloadCloud className="h-3.5 w-3.5 opacity-50 group-focus:text-orange-500" />
                                    Download Vault
                                </DropdownMenuItem>

                                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                                <DropdownMenuItem
                                    onClick={() => handleDeleteClick(offer)}
                                    className="rounded-lg text-xs font-bold gap-2 cursor-pointer text-rose-500 focus:bg-rose-500 focus:text-white group"
                                >
                                    <Trash2 className="h-3.5 w-3.5 opacity-70 group-focus:opacity-100" />
                                    Delete Offer
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
        <>
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
                                                    <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest leading-none">No Offers</p>
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">No price offers found in the list</p>
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
                            {table.getFilteredRowModel().rows.length} Total Offers
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

            {/* Premium Deletion Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden shadow-2xl">
                    <div className="bg-rose-500/10 p-8 flex flex-col items-center text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                            <AlertCircle className="h-8 w-8 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase">
                                Irreversible Action
                            </DialogTitle>
                            <DialogDescription className="text-sm font-bold text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                                You are about to purge this protocol entry. This data will be permanently removed from the ledger.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 bg-white dark:bg-zinc-950 flex flex-col items-center gap-4">
                        <div className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Target Record</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 border-b border-rose-500/50">
                                    ID-{offerToDelete?.id.toString().padStart(4, '0')}
                                </span>
                            </div>
                            <p className="mt-2 text-sm font-black text-zinc-900 dark:text-zinc-100 truncate italic text-center">
                                {offerToDelete?.account?.title || "General Offer"}
                            </p>
                        </div>

                        <DialogFooter className="w-full sm:flex-row gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="flex-1 h-12 rounded-xl font-black text-[11px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"
                            >
                                Abort
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="flex-1 h-12 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-500/20"
                            >
                                Confirm Purge
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
