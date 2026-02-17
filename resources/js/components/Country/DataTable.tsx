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
import { ChevronUp, ChevronDown, MoreHorizontal, PencilLine, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface Country {
  id: number;
  name: string;
  code: string;
  phone_code: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Pagination<T> {
  data: T[];
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface DataTableProps {
  data: Country[];
}

export function DataTable({ data }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [editCountry, setEditCountry] = useState<Country | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [currency, setCurrency] = useState("");

  // handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCountry) return;

    router.put(
      `/countries/${editCountry.id}`,
      {
        name,
        code,
        phone_code: phoneCode,
        currency,
      },
      {
        onSuccess: () => {
          toast.success("Country updated successfully!");
          setEditCountry(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // handle delete
  const handleDelete = () => {
    if (!selectedCountry) return;
    router.delete(`/countries/${selectedCountry.id}`, {
      onSuccess: () => {
        toast.success("Country deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: "flag",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Flag</span>
      ),
      cell: ({ row }) => (
        <div className="relative group/flag inline-block leading-none">
          <div className="absolute -inset-1 bg-orange-500 rounded-sm blur opacity-0 group-hover/flag:opacity-20 transition duration-500" />
          <img
            src={`https://flagcdn.com/w80/${row.original.code.toLowerCase()}.png`}
            alt={row.original.name}
            className="relative w-10 h-7 rounded-sm object-cover border border-orange-500/10 shadow-sm transition-transform group-hover/flag:scale-110 group-hover/flag:rotate-2 duration-500"
          />
        </div>
      ),
    },
    { 
      accessorKey: "name", 
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Country Identity</span>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-black text-foreground tracking-tight uppercase leading-none">{row.original.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase leading-none">Registry #ID-{row.original.id}</span>
        </div>
      )
    },
    { 
      accessorKey: "code", 
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Code</span>
      ),
      cell: ({ row }) => (
        <span className="font-mono font-black text-orange-600 bg-orange-500/5 px-2 py-1 rounded-sm border border-orange-500/10 tracking-widest leading-none block w-fit">{row.original.code}</span>
      )
    },
    { 
      accessorKey: "phone_code", 
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Dial Parameter</span>
      ),
      cell: ({ row }) => (
        <span className="font-mono font-bold text-foreground/70 tracking-tighter leading-none">{row.original.phone_code}</span>
      )
    },
    { 
      accessorKey: "currency", 
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Economic Unit</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 leading-none">
          <div className="h-1 w-3 rounded-full bg-orange-500/30" />
          <span className="font-black text-foreground/80 tracking-widest leading-none">{row.original.currency}</span>
        </div>
      )
    },
    {
      accessorKey: "is_active",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Status</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center leading-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${
            row.original.is_active 
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
              : "bg-orange-500/5 border-orange-500/20 text-orange-600"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
              row.original.is_active ? "bg-emerald-500" : "bg-orange-500"
            }`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {row.original.is_active ? "Verified" : "Offline"}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "created_by",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Origin Author</span>
      ),
      cell: ({ row }) => {
        const name = row.original.created_by_name || "Unknown";
        const imageUrl = row.original.created_by_avatar || "";
        const firstLetter = name.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-3 leading-none">
             <div className="relative group/avatar leading-none invisible sm:visible">
              <div className="absolute -inset-0.5 bg-orange-500 rounded-sm blur opacity-0 group-hover/avatar:opacity-30 transition duration-300" />
              <Avatar className="h-8 w-8 rounded-sm border border-orange-500/20 relative">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={name} className="object-cover" />
                ) : (
                  <AvatarFallback className="bg-orange-500 text-white font-black text-xs rounded-none">{firstLetter}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-foreground/70 uppercase tracking-tight leading-none">{name}</span>
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Registrar</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Interlink</span>
      ),
      enableHiding: false,
      cell: ({ row }) => {
        const country = row.original;
        const canEdit = Array.isArray(permissions) && permissions.includes("edit countries");
        const canDelete = Array.isArray(permissions) && permissions.includes("delete countries");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-orange-500/5 hover:text-orange-600 rounded-sm transition-colors border-2 border-transparent hover:border-orange-500/20">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-sm border-2 border-orange-500/20 p-2 min-w-[180px] shadow-2xl bg-white">
              <div className="px-2 py-1.5 mb-1.5 border-b border-orange-500/10">
                <p className="text-[9px] font-black text-orange-600/60 uppercase tracking-widest leading-none">Record Operations</p>
              </div>
              {canEdit && (
                <DropdownMenuItem
                  className="flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest p-3 transition-all hover:bg-orange-600 hover:text-white cursor-pointer rounded-sm mb-1 group"
                  onClick={() => {
                    setEditCountry(country);
                    setName(country.name);
                    setCode(country.code);
                    setPhoneCode(country.phone_code);
                    setCurrency(country.currency);
                  }}
                >
                  <PencilLine className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Modify Identity</span>
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-3 font-bold uppercase text-[10px] tracking-widest p-3 transition-all hover:bg-red-600 hover:text-white cursor-pointer rounded-sm group"
                  onClick={() => {
                    setSelectedCountry(country);
                    setOpenDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Purge Record</span>
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
      <Dialog
        open={!!editCountry}
        onOpenChange={() => setEditCountry(null)}
      >
        <DialogContent className="rounded-sm border-2 border-orange-500/20 p-0 overflow-hidden sm:max-w-[550px] bg-white shadow-2xl">
          <div className="h-2 bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
          <div className="p-8 lg:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-600 text-white rounded-sm shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 rotate-3 flex-shrink-0">
                  <PencilLine className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">
                    IDENTITY <span className="text-orange-500 italic">MODIFICATION</span>
                  </DialogTitle>
                  <DialogDescription className="font-black text-orange-600 uppercase text-[10px] tracking-widest opacity-70">
                    Registry Reconfiguration Protocol
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="grid grid-cols-2 gap-6 relative">
                 <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Country Full Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-bold uppercase tracking-tight transition-all"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      ISO Identity Code
                    </Label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-bold uppercase tracking-widest"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Dialing Parameter
                    </Label>
                    <Input
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-bold"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Economic Unit
                    </Label>
                    <Input
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-bold uppercase tracking-tight"
                    />
                  </div>
              </div>
              <div className="pt-6 border-t-2 border-orange-500/10">
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 px-8 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => setEditCountry(null)}
                  >
                    Abort
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 group flex-1"
                  >
                    Commit Changes
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-sm border-2 border-red-500/20 p-0 overflow-hidden sm:max-w-[450px] bg-white shadow-2xl">
          <div className="h-2 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
          <div className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-red-100 text-red-600 rounded-sm shadow-xl shadow-red-600/10 ring-8 ring-red-500/5 rotate-12 flex-shrink-0 animate-bounce">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none text-red-600">
                  PURGE <span className="text-foreground italic">RECORD</span>
                </DialogTitle>
                <DialogDescription className="font-black text-red-600 uppercase text-[10px] tracking-[0.2em] opacity-70">
                  Critical Destruction Protocol
                </DialogDescription>
              </div>
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-sm w-full">
                <p className="text-xs font-bold text-red-700 uppercase tracking-tight">
                  Proceed with the permanent removal of identity:
                </p>
                <p className="text-xl font-black text-red-800 uppercase tracking-tighter mt-1">
                  {selectedCountry?.name}
                </p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                Warning: This action will permanently erase this record and all associated interlinks from the central registry.
              </p>
            </div>
            <div className="mt-8 pt-6 border-t-2 border-red-500/10 flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                className="h-12 flex-1 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all order-2 sm:order-1"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Cancel Protocol
              </Button>
              <Button
                variant="destructive"
                className="h-12 flex-1 bg-red-600 hover:bg-red-700 rounded-sm font-black uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95 order-1 sm:order-2"
                onClick={handleDelete}
              >
                Execute Purge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Container */}
      <div className="relative group/table mt-8">
        <div className="absolute -inset-1 bg-gradient-to-b from-orange-500/10 to-transparent rounded-sm blur-xl opacity-0 group-hover/table:opacity-100 transition duration-1000" />
        <div className="relative bg-white/50 backdrop-blur-sm border-2 border-orange-500/10 rounded-sm overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-orange-500/5 hover:bg-orange-500/10 transition-colors border-b-2 border-orange-500/10">
              <TableRow className="hover:bg-transparent border-none h-14">
                {table.getHeaderGroups().map((headerGroup) => (
                  <React.Fragment key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-6">
                        <div
                          onClick={() => header.column.toggleSorting()}
                          className="flex items-center gap-2 cursor-pointer select-none group/head"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <div className="flex flex-col opacity-0 group-hover/head:opacity-100 transition-opacity">
                            <ChevronUp className={`w-3 h-3 -mb-1 ${header.column.getIsSorted() === "asc" ? "text-orange-600" : "text-orange-300"}`} />
                            <ChevronDown className={`w-3 h-3 ${header.column.getIsSorted() === "desc" ? "text-orange-600" : "text-orange-300"}`} />
                          </div>
                        </div>
                      </TableHead>
                    ))}
                  </React.Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="wait">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group/row border-b border-orange-500/5 hover:bg-orange-500/[0.02] transition-colors h-16"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6">
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
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-sm bg-orange-500/5 flex items-center justify-center">
                          <Plus className="w-6 h-6 text-orange-500/20" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No Registry Data Detected</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Technical Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-orange-500/[0.03] border-t-2 border-orange-500/10 gap-6">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-orange-600/40 uppercase tracking-widest mb-0.5">Live Identity Count</span>
                <span className="text-xs font-black text-foreground tracking-tight">DISPLAYING {table.getRowModel().rows.length} OF {data.length} UNITS</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-3 border-l-2 border-orange-500/10 pl-6">
                <span className="text-[9px] font-black text-orange-600/40 uppercase tracking-widest">Density</span>
                <div className="flex items-center gap-2">
                  {[10, 20, 50].map((size) => (
                    <button
                      key={size}
                      onClick={() => table.setPageSize(size)}
                      className={`text-[10px] font-black px-2 py-1 rounded-sm transition-all border ${
                        table.getState().pagination.pageSize === size
                          ? "bg-orange-600 border-orange-700 text-white shadow-lg shadow-orange-600/20 scale-110"
                          : "bg-white border-orange-500/10 text-orange-600/60 hover:border-orange-500/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col items-end hidden sm:flex mr-4">
                <span className="text-[9px] font-black text-orange-600/40 uppercase tracking-widest mb-0.5">Registry Stream</span>
                <span className="text-xs font-black text-foreground tracking-tight uppercase">Segment {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}</span>
              </div>

              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 border-2 border-orange-500/10 hover:border-orange-500/30 hover:bg-orange-500/5 text-orange-600 rounded-sm disabled:opacity-20 transition-all"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <IconChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(3, table.getPageCount()) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = table.getState().pagination.pageIndex + 1 === pageNum;
                    return (
                      <div
                        key={pageNum}
                        className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${
                          isActive ? "bg-orange-600 w-6 shadow-[0_0_8px_rgba(249,115,22,0.4)]" : "bg-orange-500/20"
                        }`}
                      />
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 border-2 border-orange-500/10 hover:border-orange-500/30 hover:bg-orange-500/5 text-orange-600 rounded-sm disabled:opacity-20 transition-all"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <IconChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
