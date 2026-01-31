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
    ChevronUp,
    ChevronDown,
    MoreHorizontal,
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
    Select as ShadSelect,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";

interface Saleman {
    id: number;
    name: string;
    shortname: string;
    code: string;
    date?: string | null;
    status?: string | null;
    defult?: string | null;
    created_by?: number;
    created_at: string;
    created_by_name?: string;
    created_by_avatar?: string;
}

interface DataTableProps {
    data: Saleman[];
}

export function DataTable({ data }: DataTableProps) {
    // safe access to page props
    const pageProps = usePage().props as unknown as {
        auth?: { user?: any; permissions?: string[] };
        errors?: Record<string, string>;
    };

    const permissions = Array.isArray(pageProps?.auth?.permissions)
        ? (pageProps.auth!.permissions as string[])
        : [];

    // table state
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // dialogs & selection
    const [editSaleman, setEditSaleman] = useState<Saleman | null>(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedSaleman, setSelectedSaleman] = useState<Saleman | null>(null);

    // edit form state
    const [name, setName] = useState("");
    const [shortname, setShortname] = useState("");
    const [code, setCode] = useState("");
    const [date, setDate] = useState("");

    // update handler
    const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editSaleman) return;

        router.put(
            `/salemen/${editSaleman.id}`,
            { name, shortname, code, date },
            {
                onSuccess: () => {
                    toast.success("Saleman updated successfully!");
                    setEditSaleman(null);
                },
                onError: () => toast.error("Update failed"),
            }
        );
    };

    // delete handler
    const handleDelete = () => {
        if (!selectedSaleman) return;

        router.delete(`/salemen/${selectedSaleman.id}`, {
            onSuccess: () => {
                toast.success("Saleman deleted successfully!");
                setOpenDeleteDialog(false);
            },
            onError: () => toast.error("Delete failed"),
        });
    };

    // table columns
    const columns: ColumnDef<Saleman>[] = [
        {
            accessorKey: "name",
            header: "Salemen Name",
            cell: ({ row }) => {
                const name = row.original.name || "Unknown";

                // ✅ Extract first letter (e.g., "Fayyaz Ahmed" → "F")
                const firstLetter = name.charAt(0).toUpperCase();

                // ✅ A–Z color mapping
                const letterColors: Record<string, { bg: string; border: string }> = {
                    A: { bg: "bg-red-400", border: "border-red-600" },
                    B: { bg: "bg-orange-400", border: "border-orange-600" },
                    C: { bg: "bg-amber-400", border: "border-amber-600" },
                    D: { bg: "bg-yellow-400", border: "border-yellow-600" },
                    E: { bg: "bg-lime-400", border: "border-lime-600" },
                    F: { bg: "bg-green-400", border: "border-green-600" },
                    G: { bg: "bg-emerald-400", border: "border-emerald-600" },
                    H: { bg: "bg-teal-400", border: "border-teal-600" },
                    I: { bg: "bg-cyan-400", border: "border-cyan-600" },
                    J: { bg: "bg-sky-400", border: "border-sky-600" },
                    K: { bg: "bg-blue-400", border: "border-blue-600" },
                    L: { bg: "bg-indigo-400", border: "border-indigo-600" },
                    M: { bg: "bg-violet-400", border: "border-violet-600" },
                    N: { bg: "bg-purple-400", border: "border-purple-600" },
                    O: { bg: "bg-fuchsia-400", border: "border-fuchsia-600" },
                    P: { bg: "bg-pink-400", border: "border-pink-600" },
                    Q: { bg: "bg-rose-400", border: "border-rose-600" },
                    R: { bg: "bg-red-600", border: "border-red-700" },
                    S: { bg: "bg-orange-600", border: "border-orange-700" },
                    T: { bg: "bg-yellow-600", border: "border-yellow-700" },
                    U: { bg: "bg-green-600", border: "border-green-700" },
                    V: { bg: "bg-emerald-600", border: "border-emerald-700" },
                    W: { bg: "bg-cyan-600", border: "border-cyan-700" },
                    X: { bg: "bg-blue-600", border: "border-blue-700" },
                    Y: { bg: "bg-purple-600", border: "border-purple-700" },
                    Z: { bg: "bg-pink-600", border: "border-pink-700" },
                };

                // ✅ Get matching colors or fall back to gray
                const { bg, border } = letterColors[firstLetter] || {
                    bg: "bg-gray-400",
                    border: "border-gray-500",
                };

                return (
                    <div className="flex items-center gap-3">
                        <Avatar
                            className={`h-7 w-7 rounded-full ${border} border-2 font-semibold flex items-center justify-center shadow-sm`}
                        >
                            <AvatarFallback className={`${bg} text-white`}>
                                {firstLetter}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{name}</span>
                    </div>
                );
            },
        },



        { accessorKey: "shortname", header: "Short Name" },
        { accessorKey: "code", header: "Code" },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const raw = row.getValue("date") as string | undefined | null;
                return raw ? new Date(raw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const s = Number(row.original.status); // convert to number just in case

                const isActive = s === 1;

                return (
                    <span
                        className={`px-2 py-1 rounded text-xs font-medium ${isActive
                                ? "bg-green-100 text-green-700 border border-green-300"
                                : "bg-red-100 text-red-700 border border-red-300"
                            }`}
                    >
                        {isActive ? "Active" : "Inactive"}
                    </span>
                );
            },

        },

        {
            accessorKey: "defult",
            header: "Default",
            cell: ({ row }) => (row.original.defult === "1" || row.original.defult === "true" ? "Yes" : "No"),
        },
        {
            accessorKey: "created_at",
            header: "Created At",
            cell: ({ row }) => {
                const v = row.getValue("created_at") as string;
                return v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";
            },
        },
        {
            accessorKey: "created_by",
            header: "Created By",
            cell: ({ row }) => {
                const name = row.original.created_by_name || "Unknown";
                const imageUrl = row.original.created_by_avatar || "";
                const firstLetter = name.charAt(0).toUpperCase();

                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                            {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : <AvatarFallback>{firstLetter}</AvatarFallback>}
                        </Avatar>
                        <div className="text-sm">{name}</div>
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableHiding: false,
            cell: ({ row }) => {
                const saleman = row.original;
                const canEdit = permissions.includes("edit saleman");
                const canDelete = permissions.includes("delete saleman");

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                            {canEdit && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        setEditSaleman(saleman);
                                        setName(saleman.name || "");
                                        setShortname(saleman.shortname || "");
                                        setCode(saleman.code || "");
                                        setDate(saleman.date || "");
                                    }}
                                >
                                    Edit
                                </DropdownMenuItem>
                            )}

                            {canDelete && (
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedSaleman(saleman);
                                        setOpenDeleteDialog(true);
                                    }}
                                >
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // react-table
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
            {/* Edit Dialog */}
            <Dialog open={!!editSaleman} onOpenChange={() => setEditSaleman(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Saleman</DialogTitle>
                        <DialogDescription>Update saleman details.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <Label>Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div>
                            <Label>Short Name</Label>
                            <Input value={shortname} onChange={(e) => setShortname(e.target.value)} />
                        </div>

                        <div>
                            <Label>Code</Label>
                            <Input value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>

                        <div>
                            <Label>Date</Label>
                            <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="YYYY-MM-DD" />
                        </div>

                        <DialogFooter>
                            <Button type="submit" variant="outline">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Saleman</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedSaleman?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Table */}
            <div className="rounded-md border mt-4">
                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        key={header.id}
                                        className="cursor-pointer select-none"
                                        onClick={() => header.column.toggleSorting()}
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <ChevronUp className="w-4 h-4" />}
                                            {header.column.getIsSorted() === "desc" && <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>

                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
                                    No salemen found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-background">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>

                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        {/* Rows per page */}
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label htmlFor="rows-per-page" className="text-sm font-medium">Rows per page</Label>
                            <ShadSelect value={`${table.getState().pagination.pageSize}`} onValueChange={(value) => table.setPageSize(Number(value))}>
                                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>{pageSize}</SelectItem>
                                    ))}
                                </SelectContent>
                            </ShadSelect>
                        </div>

                        {/* Page info */}
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </div>

                        {/* Pagination Controls */}
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                                <span className="sr-only">Go to first page</span>
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                                <span className="sr-only">Previous page</span>
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                                <span className="sr-only">Next page</span>
                                <IconChevronRight className="h-4 w-4" />
                            </Button>

                            <Button variant="outline" className="hidden size-8 lg:flex" size="icon" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
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
