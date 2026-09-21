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
  Map,
  Building2,
  Globe,
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

interface Country {
  id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
  latitude?: string;
  longitude?: string;
  is_active: boolean;
  cities_count?: number;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
  country?: Country;
}

interface Option {
  value: number;
  label: string;
  code?: string;
}

interface DataTableProps {
  data: Province[];
  countries: Country[];
}

export function DataTable({ data, countries }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth?.permissions || [];
  const canEdit =
    Array.isArray(permissions) &&
    (permissions.includes("edit areas") || permissions.includes("edit provinces"));
  const canDelete =
    Array.isArray(permissions) &&
    (permissions.includes("delete areas") || permissions.includes("delete provinces"));

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // Dialog states
  const [editProvince, setEditProvince] = useState<Province | null>(null);
  const [deleteProvince, setDeleteProvince] = useState<Province | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<Option | null>(null);

  const countryOptions: Option[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  const openEditDialog = (province: Province) => {
    setEditProvince(province);
    setEditName(province.name);
    setEditCode(province.code);
    setEditLatitude(province.latitude || "");
    setEditLongitude(province.longitude || "");
    setEditIsActive(Boolean(province.is_active));

    const matchedCountry = countryOptions.find(
      (c) => c.value === province.country_id
    );
    setSelectedCountry(matchedCountry || null);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProvince) return;

    if (!editName.trim()) {
      toast.error("Province name is required");
      return;
    }
    if (!editCode.trim()) {
      toast.error("Province code is required");
      return;
    }
    if (!selectedCountry) {
      toast.error("Please select a Country");
      return;
    }

    setIsUpdating(true);

    router.put(
      `/provinces/${editProvince.id}`,
      {
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        country_id: selectedCountry.value,
        latitude: editLatitude.trim() || null,
        longitude: editLongitude.trim() || null,
        is_active: editIsActive,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success("Province updated successfully");
          setEditProvince(null);
        },
        onError: (errs) => {
          const msg = Object.values(errs)[0] || "Failed to update province";
          toast.error(msg);
        },
        onFinish: () => {
          setIsUpdating(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteProvince) return;

    setIsDeleting(true);

    router.delete(`/provinces/${deleteProvince.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success("Province deleted successfully");
        setDeleteProvince(null);
      },
      onError: (errs) => {
        const msg = Object.values(errs)[0] || "Failed to delete province";
        toast.error(msg);
      },
      onFinish: () => {
        setIsDeleting(false);
      },
    });
  };

  const columns: ColumnDef<Province>[] = [
    {
      accessorKey: "country",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Country
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => {
        const country = row.original.country;
        const code = country?.code;
        return (
          <div className="flex items-center gap-2.5">
            {code ? (
              <img
                src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
                alt={code}
                className="w-5 h-3.5 rounded-xs object-cover border border-border shadow-2xs"
              />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
            <div className="flex flex-col">
              <span className="font-medium text-xs text-foreground">
                {country?.name || "Unassigned"}
              </span>
              {code && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {code}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Province / Region
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-foreground">
            {row.original.name}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border/60">
            {row.original.code}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "cities_count",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cities
          {column.getIsSorted() === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary" />
          ) : column.getIsSorted() === "desc" ? (
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
          ) : null}
        </button>
      ),
      cell: ({ row }) => {
        const count = row.original.cities_count || 0;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
                count > 0
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                  : "bg-muted text-muted-foreground border border-border/60"
              }`}
            >
              <Building2 className="w-3 h-3" />
              {count} {count === 1 ? "City" : "Cities"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "coordinates",
      header: "Coordinates",
      cell: ({ row }) => {
        const lat = row.original.latitude;
        const lng = row.original.longitude;
        if (!lat && !lng) {
          return (
            <span className="text-[11px] text-muted-foreground/60 italic">
              Unmapped
            </span>
          );
        }
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono bg-muted/40 text-muted-foreground border border-border/50">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span>
              {lat || "—"}, {lng || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.original.is_active;
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              active
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-muted text-muted-foreground border border-border/60"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/60"
              }`}
            />
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: "Created By",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 border border-border">
            <AvatarImage src={row.original.created_by_avatar} />
            <AvatarFallback className="text-[10px] font-bold">
              {row.original.created_by_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {row.original.created_by_name || "System"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {row.original.created_at
                ? new Date(row.original.created_at).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const province = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-lg">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => openEditDialog(province)}
                    className="gap-2 cursor-pointer text-xs font-medium"
                  >
                    <PencilLine className="w-3.5 h-3.5 text-muted-foreground" />
                    Edit Province
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteProvince(province)}
                    className="gap-2 cursor-pointer text-xs font-medium text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
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
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: "var(--background, #ffffff)",
      borderColor: state.isFocused ? "var(--ring, #e8941a)" : "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      minHeight: "40px",
      fontSize: "0.875rem",
      boxShadow: "none",
      "&:hover": {
        borderColor: "var(--ring, #e8941a)",
      },
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: "var(--popover, #ffffff)",
      color: "var(--popover-foreground, #080706)",
      borderColor: "var(--border, #e5e7eb)",
      borderRadius: "0.5rem",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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
      cursor: "pointer",
      fontSize: "0.875rem",
      padding: "6px 12px",
      borderRadius: "0.375rem",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: "var(--foreground, #080706)",
      fontSize: "0.875rem",
    }),
    placeholder: (base: any) => ({
      ...base,
      color: "var(--muted-foreground, #71717a)",
      fontSize: "0.875rem",
    }),
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/70 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 text-xs font-semibold text-muted-foreground"
                  >
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 px-4 text-xs">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground text-xs"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Map className="w-8 h-8 text-muted-foreground/40 mb-1" />
                    <p className="font-medium">No provinces found matching criteria</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Try clearing filters or adding a new province
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/60 bg-muted/20">
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              (data.length > 0 ? 1 : 0)}
          </span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              data.length
            )}
          </span>{" "}
          of <span className="font-medium text-foreground">{data.length}</span>{" "}
          provinces
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rows per page:</span>
            <ShadSelect
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-16 text-xs rounded-md">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 25, 50, 100].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadSelect>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium px-2">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Province Modal */}
      <Dialog
        open={Boolean(editProvince)}
        onOpenChange={(open) => !open && setEditProvince(null)}
      >
        <DialogContent className="rounded-xl border border-border sm:max-w-[540px] p-0 overflow-hidden bg-card text-card-foreground shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-border/60 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">
                  Edit Province
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Update administrative territory specifications and country alignment
                </DialogDescription>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                Country <span className="text-destructive">*</span>
              </Label>
              <Select<Option, false>
                options={countryOptions}
                value={selectedCountry}
                onChange={(opt) => setSelectedCountry(opt)}
                placeholder="Select country..."
                styles={customSelectStyles}
                menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                formatOptionLabel={(option: Option) => (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {option.code && (
                        <img
                          src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 rounded-xs object-cover"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {option.code}
                    </span>
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Province Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Punjab, Sindh"
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Province Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PB, SD"
                  className="h-10 rounded-lg font-mono text-sm uppercase"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-border/70 bg-muted/20 space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">
                  Geospatial Coordinates (Optional)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    placeholder="31.1704"
                    className="h-9 text-xs font-mono rounded-md bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    placeholder="72.7097"
                    className="h-9 text-xs font-mono rounded-md bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-card">
              <div className="space-y-0.5">
                <Label className="text-xs font-semibold cursor-pointer">
                  Operational Status
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Active regions can register cities and areas
                </p>
              </div>
              <Switch
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
            </div>

            <DialogFooter className="pt-3 border-t border-border/60 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-lg"
                onClick={() => setEditProvince(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-10 rounded-lg px-6 font-semibold"
                disabled={isUpdating}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deleteProvince)}
        onOpenChange={(open) => !open && setDeleteProvince(null)}
      >
        <DialogContent className="rounded-xl border border-border sm:max-w-[420px] p-6 bg-card text-card-foreground shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Delete Province?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{deleteProvince?.name}"
            </span>
            ? All linked cities and geographical hierarchies may be affected.
          </p>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg"
              onClick={() => setDeleteProvince(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 rounded-lg px-4 font-semibold"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
