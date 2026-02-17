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
import { ChevronUp, ChevronDown, MoreHorizontal, PencilLine, Trash2, Globe, Database } from "lucide-react";
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
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Select from "react-select";
import {
  ChevronLeft as IconChevronLeft,
  ChevronRight as IconChevronRight,
  ChevronsLeft as IconChevronsLeft,
  ChevronsRight as IconChevronsRight,
} from "lucide-react";
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
import { toast } from "react-hot-toast";

// ✅ Types
interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface CountryOption {
  value: number;
  label: string;
  code: string;
}

interface DataTableProps {
  data: Province[];
  countries: Country[];
}

export function DataTable({ data, countries }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth.permissions;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(
    null
  );

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [editCountry, setEditCountry] = useState<CountryOption | null>(null);

  // ✅ Build options for country select
  const countryOptions: CountryOption[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  // ✅ Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editProvince) return;

    router.put(
      `/provinces/${editProvince.id}`,
      {
        name,
        code,
        country_id: editCountry?.value,
        latitude,
        longitude,
      },
      {
        onSuccess: () => {
          toast.success("Province updated successfully!");
          setEditProvince(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // ✅ Handle delete
  const handleDelete = () => {
    if (!selectedProvince) return;
    router.delete(`/provinces/${selectedProvince.id}`, {
      onSuccess: () => {
        toast.success("Province deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  // ✅ Table columns
  const columns: ColumnDef<Province>[] = [
    {
      accessorKey: "country",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Parent Jurisdiction</span>
      ),
      cell: ({ row }) => {
        const province = row.original;
        const country = countries.find(
          (c) => c.id === Number(province.country_id)
        );
        if (!country) return <span className="text-[10px] font-black text-muted-foreground opacity-20 uppercase">Unknown Node</span>;

        return (
          <div className="flex items-center gap-3 leading-none group/jurisdiction">
            <div className="relative leading-none">
              <div className="absolute -inset-1 bg-orange-500 rounded-sm blur opacity-0 group-hover/jurisdiction:opacity-20 transition duration-500" />
              <img
                src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                alt={country.name}
                className="relative w-8 h-5 rounded-sm object-cover border border-orange-500/10 shadow-sm transition-transform group-hover/jurisdiction:scale-110 duration-500"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-foreground/70 uppercase tracking-tight leading-none group-hover/jurisdiction:text-orange-600 transition-colors uppercase">{country.name}</span>
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none font-mono">#{country.code}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Province Identity</span>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-black text-foreground tracking-tight uppercase leading-none">{row.original.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase leading-none">Registry #PROV-{row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: "code",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Technical ID</span>
      ),
      cell: ({ row }) => (
        <span className="font-mono font-black text-orange-600 bg-orange-500/5 px-2 py-1 rounded-sm border border-orange-500/10 tracking-widest leading-none block w-fit">{row.original.code}</span>
      )
    },
    {
      accessorKey: "is_active",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Status</span>
      ),
      cell: ({ row }) => (
        <div className="flex items-center leading-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${row.original.is_active
              ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600"
              : "bg-orange-500/5 border-orange-500/20 text-orange-600"
            }`}>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${row.original.is_active ? "bg-emerald-500" : "bg-orange-500"
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
              <span className="text-xs font-black text-foreground/70 uppercase tracking-tight leading-none uppercase">{name}</span>
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none font-mono">Registrar</span>
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
        const province = row.original;
        const canEdit = permissions.includes("edit provinces");
        const canDelete = permissions.includes("delete provinces");

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
                    setEditProvince(province);
                    setName(province.name);
                    setCode(province.code);
                    setLatitude(province.latitude || "");
                    setLongitude(province.longitude || "");

                    const selectedCountry = countryOptions.find(
                      (opt) => opt.value === province.country_id
                    );
                    setEditCountry(selectedCountry || null);
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
                    setSelectedProvince(province);
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

  // ✅ React Table instance
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
    <div className="w-full space-y-6">
      {/* Modification Dialog */}
      <Dialog open={!!editProvince} onOpenChange={() => setEditProvince(null)}>
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
                    Administrative Node Reconfiguration
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Parent Jurisdiction
                  </Label>
                  <Select<CountryOption, false>
                    options={countryOptions}
                    value={editCountry}
                    onChange={(option) => setEditCountry(option)}
                    placeholder="REASSIGNING COUNTRY..."
                    className="technical-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '2px',
                        border: '2px solid rgba(0,0,0,0.1)',
                        '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                        boxShadow: 'none',
                        height: '48px',
                        fontSize: '12px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        backgroundColor: 'rgba(0,0,0,0.02)'
                      })
                    }}
                    formatOptionLabel={(option: CountryOption) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                            alt={option.label}
                            className="w-6 h-4 rounded-sm object-cover border border-orange-500/10 shadow-sm"
                          />
                          <span className="tracking-tight">{option.label}</span>
                        </div>
                        <span className="text-[10px] font-black text-orange-600/40 font-mono">#{option.code}</span>
                      </div>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Province Designation
                    </Label>
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-black uppercase tracking-tight"
                    />
                  </div>
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Technical Code
                    </Label>
                    <Input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-mono font-black uppercase tracking-widest text-orange-600"
                    />
                  </div>
                </div>

                <div className="bg-orange-500/5 p-6 rounded-sm border-2 border-orange-500/10 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Spatial Drift Parameters</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Latitude</Label>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Longitude</Label>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-orange-500/10">
                <DialogFooter className="gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-14 px-8 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => setEditProvince(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 group flex-1 text-white border-b-4 border-orange-800/50"
                  >
                    Apply Reconfiguration
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-sm border-4 border-red-500/20 p-0 overflow-hidden sm:max-w-[450px] bg-white shadow-2xl">
          <div className="h-2 bg-red-600 animate-pulse" />
          <div className="p-8 lg:p-10">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="p-6 bg-red-600 text-white rounded-sm shadow-2xl shadow-red-600/40 animate-bounce">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter uppercase text-foreground leading-none">
                  PURGE <span className="text-red-600">COMMAND</span>
                </h3>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest opacity-60">Critical Node Deletion Protocol</p>
              </div>
              <div className="w-full p-6 bg-red-50 rounded-sm border-2 border-red-200/50 space-y-2">
                <p className="text-xs font-bold text-red-800 uppercase leading-relaxed">
                  You are about to permanently decommission administrative node:
                </p>
                <p className="text-xl font-black text-red-600 uppercase tracking-tight">
                  {selectedProvince?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <Button
                  variant="ghost"
                  className="h-14 font-black uppercase tracking-widest rounded-sm border-2 border-transparent hover:border-border transition-all"
                  onClick={() => setOpenDeleteDialog(false)}
                >
                  Abort
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 h-14 font-black uppercase tracking-widest rounded-sm shadow-xl shadow-red-600/20 text-white border-b-4 border-red-800/50 active:scale-95 transition-all"
                  onClick={handleDelete}
                >
                  Confirm Purge
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Table Assembly */}
      <div className="relative group/table">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/5 to-orange-600/5 rounded-sm blur-xl opacity-50 transition duration-1000 group-hover/table:opacity-100" />
        <div className="relative bg-white border-2 border-orange-500/10 rounded-sm overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-orange-500/5 border-b-2 border-orange-500/20">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none h-14">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6">
                      <div
                        onClick={() => header.column.toggleSorting()}
                        className="flex items-center gap-2 cursor-pointer select-none group/h"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col opacity-0 group-hover/h:opacity-100 transition-opacity">
                            <ChevronUp className={`w-3 h-3 -mb-1 ${header.column.getIsSorted() === 'asc' ? 'text-orange-600' : 'text-orange-600/20'}`} />
                            <ChevronDown className={`w-3 h-3 ${header.column.getIsSorted() === 'desc' ? 'text-orange-600' : 'text-orange-600/20'}`} />
                          </div>
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
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group/row border-b border-orange-500/5 hover:bg-orange-500/[0.02] transition-colors h-16"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 bg-orange-500/5 rounded-sm animate-pulse">
                          <Database className="w-8 h-8 text-orange-500/20" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-foreground uppercase tracking-tighter">No regional data detected</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 italic">Awaiting registry synchronization...</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Technical Footer */}
          <div className="px-6 py-6 bg-[#fafafa] border-t-2 border-orange-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-1">
                <p className="text-[9px] font-black text-muted-foreground uppercase swallow-wider opacity-40 leading-none">Stream Density</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  <div className="flex items-center gap-4">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <button
                        key={pageSize}
                        onClick={() => table.setPageSize(pageSize)}
                        className={`text-xs font-black transition-all hover:text-orange-600 ${table.getState().pagination.pageSize === pageSize
                            ? "text-orange-600 scale-110"
                            : "text-muted-foreground/40"
                          }`}
                      >
                        {pageSize}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="h-8 w-[2px] bg-orange-500/10" />

              <div className="flex flex-col gap-1 invisible sm:visible">
                <p className="text-[9px] font-black text-muted-foreground uppercase swallow-wider opacity-40 leading-none">Segment Information</p>
                <p className="text-xs font-black text-foreground uppercase tracking-tight">
                  PAGE {table.getState().pagination.pageIndex + 1} <span className="text-orange-600/40 font-mono mx-1">/</span> {table.getPageCount()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-4">
                {Array.from({ length: Math.min(table.getPageCount(), 5) }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-500 ${table.getState().pagination.pageIndex === i
                        ? "w-8 bg-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        : "w-2 bg-orange-500/20"
                      }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 rounded-sm border-2 border-orange-500/10 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-600 transition-all active:scale-90 disabled:opacity-20"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <IconChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  className="h-10 w-10 p-0 rounded-sm border-2 border-orange-500/10 hover:border-orange-500/40 hover:bg-orange-500/5 hover:text-orange-600 transition-all active:scale-90 disabled:opacity-20"
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
