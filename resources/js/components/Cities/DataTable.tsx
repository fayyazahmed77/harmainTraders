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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PencilLine,
  Trash2,
  MapPin,
  Building2,
  Globe,
  Navigation,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Select, { SingleValue } from "react-select";
import { toast } from "sonner";

interface City {
  id: number;
  country_id: number;
  province_id: number;
  name: string;
  code: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
  country?: { id: number; name: string; code: string };
  province?: { id: number; name: string; code: string };
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

interface Option {
  value: number;
  label: string;
  code?: string;
}

interface DataTableProps {
  data: City[];
  countries: Country[];
  provinces: Province[];
}

export function DataTable({ data, countries, provinces }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth.permissions || [];
  const canEdit = Array.isArray(permissions) && permissions.includes("edit cities");
  const canDelete = Array.isArray(permissions) && permissions.includes("delete cities");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Dialog states
  const [editCity, setEditCity] = useState<City | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<City | null>(null);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const openEdit = (city: City) => {
    setEditCity(city);
    setEditName(city.name);
    setEditCode(city.code);
    setEditLatitude(city.latitude || "");
    setEditLongitude(city.longitude || "");
    setEditIsActive(Boolean(city.is_active));

    const currentCountry = countries.find((c) => c.id === Number(city.country_id));
    const countryOpt = currentCountry
      ? { value: currentCountry.id, label: currentCountry.name, code: currentCountry.code }
      : null;
    setSelectedCountry(countryOpt);

    const countryProvs = provinces.filter((p) => p.country_id === Number(city.country_id));
    const provOpts = countryProvs.map((p) => ({ value: p.id, label: p.name, code: p.code }));
    setProvinceOptions(provOpts);

    const currentProv = provinces.find((p) => p.id === Number(city.province_id));
    setSelectedProvince(
      currentProv
        ? { value: currentProv.id, label: currentProv.name, code: currentProv.code }
        : null
    );
  };

  const handleEditCountryChange = async (opt: SingleValue<Option>) => {
    setSelectedCountry(opt);
    setSelectedProvince(null);

    if (opt) {
      try {
        const response = await fetch(`/cities/countries/${opt.value}/provinces`);
        if (response.ok) {
          const fetched: Province[] = await response.json();
          setProvinceOptions(fetched.map((p) => ({ value: p.id, label: p.name, code: p.code })));
        } else {
          const fallback = provinces.filter((p) => p.country_id === Number(opt.value));
          setProvinceOptions(fallback.map((p) => ({ value: p.id, label: p.name, code: p.code })));
        }
      } catch {
        const fallback = provinces.filter((p) => p.country_id === Number(opt.value));
        setProvinceOptions(fallback.map((p) => ({ value: p.id, label: p.name, code: p.code })));
      }
    } else {
      setProvinceOptions([]);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCity || !selectedCountry || !selectedProvince) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsUpdating(true);
    router.put(
      `/cities/${editCity.id}`,
      {
        name: editName,
        code: editCode,
        country_id: selectedCountry.value,
        province_id: selectedProvince.value,
        latitude: editLatitude || null,
        longitude: editLongitude || null,
        is_active: editIsActive,
      },
      {
        onSuccess: () => {
          toast.success("City updated successfully!");
          setEditCity(null);
          setIsUpdating(false);
        },
        onError: (err) => {
          setIsUpdating(false);
          const firstErr = Object.values(err)[0];
          toast.error(firstErr || "Failed to update city.");
        },
      }
    );
  };

  const confirmDelete = (city: City) => {
    setCityToDelete(city);
    setOpenDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!cityToDelete) return;
    router.delete(`/cities/${cityToDelete.id}`, {
      onSuccess: () => {
        toast.success("City deleted successfully.");
        setOpenDeleteDialog(false);
        setCityToDelete(null);
      },
      onError: () => toast.error("Failed to delete city."),
    });
  };

  const columns: ColumnDef<City>[] = [
    {
      accessorKey: "country",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
        >
          Country
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => {
        const city = row.original;
        const country = countries.find((c) => c.id === Number(city.country_id));
        if (!country) return <span className="text-xs text-muted-foreground italic">Isolated</span>;

        return (
          <div className="flex items-center gap-2.5">
            <img
              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="w-5 h-3.5 object-cover rounded-xs border border-border/70 shadow-xs"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {country.name}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                #{country.code}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "province",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
        >
          Province
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => {
        const province = provinces.find((p) => p.id === Number(row.original.province_id));
        return (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-foreground leading-tight">
              {province?.name || "Unknown"}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {province?.code ? `SEC-${province.code}` : "---"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground p-0 hover:bg-transparent"
        >
          City Name
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="ml-1 h-3.5 w-3.5" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          ) : null}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-tight">
            {row.original.name}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            #CITY-{row.original.id}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-muted text-foreground border border-border/80">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: "coordinates",
      header: "Coordinates",
      cell: ({ row }) => {
        const { latitude, longitude } = row.original;
        if (!latitude || !longitude) {
          return <span className="text-[11px] text-muted-foreground/60 italic">Unmapped</span>;
        }
        return (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <MapPin className="h-3 w-3" />
            <span>{Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = Boolean(row.original.is_active);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
              active
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
              }`}
            />
            {active ? "Active" : "Offline"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created By",
      cell: ({ row }) => {
        const city = row.original;
        const dateStr = city.created_at
          ? new Date(city.created_at).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "---";

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarImage src={city.created_by_avatar} />
              <AvatarFallback className="text-[10px] font-bold">
                {city.created_by_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-foreground leading-tight">
                {city.created_by_name || "Admin"}
              </span>
              <span className="text-[10px] text-muted-foreground">{dateStr}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const city = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => openEdit(city)}
                    className="cursor-pointer gap-2 text-xs font-semibold"
                  >
                    <PencilLine className="h-3.5 w-3.5 text-blue-500" />
                    Edit City
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => confirmDelete(city)}
                    className="cursor-pointer gap-2 text-xs font-semibold text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                    Delete
                  </DropdownMenuItem>
                )}
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
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
  });

  const selectModalStyles = {
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "42px",
      fontSize: "13px",
      backgroundColor: "var(--background, #ffffff)",
      borderColor: state.isFocused ? "var(--ring, #e8941a)" : "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--ring, #e8941a)",
      },
    }),
    singleValue: (base: any) => ({ ...base, color: "var(--foreground, #080706)" }),
    placeholder: (base: any) => ({ ...base, color: "var(--muted-foreground, #71717a)" }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      color: "var(--popover-foreground, #080706)",
      border: "1px solid var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    menuList: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      borderRadius: "0.5rem",
      padding: "4px",
    }),
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--primary, #e8941a)"
        : state.isFocused
        ? "var(--accent, #f4f4f5)"
        : "transparent",
      color: state.isSelected
        ? "var(--primary-foreground, #ffffff)"
        : "var(--foreground, #080706)",
      fontSize: "13px",
      cursor: "pointer",
      borderRadius: "0.375rem",
    }),
  };

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border/80">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-11 px-4 text-xs font-bold text-muted-foreground uppercase">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                  className="hover:bg-muted/30 border-b border-border/60 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm font-semibold text-muted-foreground">
                      No matching cities found.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Try adjusting your search criteria or filter options.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Console */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-muted/20 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <ShadSelect
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(val) => table.setPageSize(Number(val))}
            >
              <SelectTrigger className="h-8 w-[70px] text-xs bg-background">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 15, 25, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`} className="text-xs">
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
            <span className="ml-2 font-medium">
              Showing {data.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{" "}
              of {data.length} records
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modern Edit Dialog */}
      <Dialog open={Boolean(editCity)} onOpenChange={(open) => !open && setEditCity(null)}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-xl bg-card border-border shadow-xl">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-foreground">
                    Edit City
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Update jurisdiction, naming, and coordinate details for #{editCity?.code}.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Country *</Label>
                  <Select<Option, false>
                    options={countryOptions}
                    value={selectedCountry}
                    onChange={handleEditCountryChange}
                    styles={selectModalStyles}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                    placeholder="Select country..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Province *</Label>
                  <Select<Option, false>
                    options={provinceOptions}
                    value={selectedProvince}
                    onChange={(opt) => setSelectedProvince(opt)}
                    isDisabled={!selectedCountry}
                    styles={selectModalStyles}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                    placeholder={selectedCountry ? "Select province..." : "Choose country first"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">City Name *</Label>
                  <Input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">City Code *</Label>
                  <Input
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LHE"
                    className="h-10 text-xs font-mono font-bold uppercase bg-background"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>GPS Coordinates (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Latitude</Label>
                    <Input
                      value={editLatitude}
                      onChange={(e) => setEditLatitude(e.target.value)}
                      placeholder="e.g. 31.5204"
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Longitude</Label>
                    <Input
                      value={editLongitude}
                      onChange={(e) => setEditLongitude(e.target.value)}
                      placeholder="e.g. 74.3587"
                      className="h-9 text-xs font-mono bg-background"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold cursor-pointer">Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Inactive cities will be hidden from new transaction forms.
                  </p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditCity(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[420px] rounded-xl bg-card border-border shadow-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Confirm Deletion
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Are you sure you want to delete <span className="font-bold text-foreground">{cityToDelete?.name}</span>? This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenDeleteDialog(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="text-xs font-bold"
            >
              Delete City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
