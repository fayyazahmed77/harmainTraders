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
  PencilLine,
  Trash2,
  Mail,
  User,
  Calendar,
  Hash,
  MapPin,
  Activity,
  ShieldCheck,
  Building2,
  Globe,
  Navigation
} from "lucide-react";
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
import Select from "react-select";

interface CountryOption {
  value: number;
  label: string;
  code: string;
}

interface ProvinceOption {
  value: number;
  label: string;
  code: string;
}

interface CityOption {
  value: number;
  label: string;
  code: string;
}

interface Area {
  id: number;
  name: string;
  country_id: number;
  province_id: number;
  city_id: number;
  latitude?: string;
  longitude?: string;
  status: string;
  created_by_name?: string;
  created_by_avatar?: string;
  created_at: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
  code: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
  code: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface DataTableProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
}

export function DataTable({ areas, cities, countries, provinces }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth.permissions;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [editArea, setEditArea] = useState<Area | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  // form states
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [countryOpt, setCountryOpt] = useState<CountryOption | null>(null);
  const [provinceOpt, setProvinceOpt] = useState<ProvinceOption | null>(null);
  const [cityOpt, setCityOpt] = useState<CityOption | null>(null);

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);

  // Helpers to reset cascades
  const handleCountryChange = (opt: CountryOption | null) => {
    setCountryOpt(opt);
    setProvinceOpt(null);
    setCityOpt(null);
    setProvinceOptions([]);
    setCityOptions([]);

    if (opt) {
      const filtered = provinces
        .filter((p) => p.country_id === opt.value)
        .map((p) => ({ value: p.id, label: p.name, code: p.code }));
      setProvinceOptions(filtered);
    }
  };

  const handleProvinceChange = (opt: ProvinceOption | null) => {
    setProvinceOpt(opt);
    setCityOpt(null);
    setCityOptions([]);

    if (opt) {
      const filtered = cities
        .filter((c) => c.province_id === opt.value)
        .map((c) => ({ value: c.id, label: c.name, code: c.code }));
      setCityOptions(filtered);
    }
  };

  // Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editArea) return;

    router.put(
      `/areas/${editArea.id}`,
      {
        name,
        status,
        country_id: countryOpt?.value,
        province_id: provinceOpt?.value,
        city_id: cityOpt?.value,
        latitude,
        longitude,
      },
      {
        onSuccess: () => {
          toast.success("Area updated successfully!");
          setEditArea(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // Handle delete
  const handleDelete = () => {
    if (!selectedArea) return;
    router.delete(`/areas/${selectedArea.id}`, {
      onSuccess: () => {
        toast.success("Area deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  const columns: ColumnDef<Area>[] = [
    {
      accessorKey: "country",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</span>
      ),
      cell: ({ row }) => {
        const area = row.original;
        const country = countries.find((c) => c.id === Number(area.country_id));
        if (!country) return <span className="text-xs text-muted-foreground italic">Isolated Node</span>;

        return (
          <div className="flex items-center gap-2">
            <img
              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="w-5 h-3.5 rounded-sm object-cover border border-border"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{country.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">#{country.code}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "province",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Province</span>
      ),
      cell: ({ row }) => {
        const province = provinces.find((p) => p.id === Number(row.original.province_id));
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">{province?.name || "Unknown Zone"}</span>
            {province && <span className="text-[10px] text-muted-foreground font-mono">SEC-{province.code}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "city",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</span>
      ),
      cell: ({ row }) => {
        const city = cities.find((c) => c.id === Number(row.original.city_id));
        return (
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">{city?.name || "Unassigned"}</span>
            {city && <span className="text-[10px] text-muted-foreground font-mono">NODE-{city.code}</span>}
          </div>
        );
      }
    },
    {
      accessorKey: "name",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Area Name</span>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">{row.original.name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">#AREA-{row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</span>
      ),
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            <span className={`text-xs font-medium ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Created By</span>
      ),
      cell: ({ row }) => {
        const name = row.original.created_by_name || "System";
        const email = row.original.created_by_name ? `${row.original.created_by_name.toLowerCase().replace(' ', '.')}@harnain.com` : "harnain.sys@cloud.io";
        const imageUrl = row.original.created_by_avatar || "";
        const firstLetter = name.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 rounded-full">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">{firstLetter}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground leading-none">{name}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-1">{email}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</span>
      ),
      cell: ({ row }) => {
        const area = row.original;
        const canEdit = permissions.includes("edit areas");
        const canDelete = permissions.includes("delete areas");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-md border shadow-md">
              <div className="px-2 py-1.5 border-b mb-1">
                <p className="text-[10px] font-medium text-muted-foreground">Operations</p>
                <p className="text-xs font-semibold text-foreground truncate">{area.name}</p>
              </div>
              {canEdit && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-xs"
                  onClick={() => {
                    setEditArea(area);
                    setName(area.name);
                    setLatitude(area.latitude || "");
                    setLongitude(area.longitude || "");
                    setStatus(area.status);

                    // Setup cascades
                    const c = countries.find(co => co.id === area.country_id);
                    const p = provinces.find(pr => pr.id === area.province_id);
                    const ci = cities.find(ct => ct.id === area.city_id);

                    if (c) {
                      setCountryOpt({ value: c.id, label: c.name, code: c.code });
                      const filteredP = provinces
                        .filter(prov => prov.country_id === c.id)
                        .map(prov => ({ value: prov.id, label: prov.name, code: prov.code }));
                      setProvinceOptions(filteredP);
                    }
                    if (p) {
                      setProvinceOpt({ value: p.id, label: p.name, code: p.code });
                      const filteredCi = cities
                        .filter(city => city.province_id === p.id)
                        .map(city => ({ value: city.id, label: city.name, code: city.code }));
                      setCityOptions(filteredCi);
                    }
                    if (ci) {
                      setCityOpt({ value: ci.id, label: ci.name, code: ci.code });
                    }
                  }}
                >
                  <PencilLine className="w-3.5 h-3.5 text-muted-foreground" />
                  Edit Area
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer text-xs text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={() => {
                    setSelectedArea(area);
                    setOpenDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Area
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: areas,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnVisibility, rowSelection },
  });

  const dialogSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      borderRadius: 'var(--radius)',
      borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
      '&:hover': { borderColor: state.isFocused ? 'var(--ring)' : 'var(--border-hover, #a1a1aa)' },
      boxShadow: 'none',
      height: '40px',
      fontSize: '0.875rem',
      fontWeight: '400',
      backgroundColor: state.isDisabled ? 'var(--muted)' : 'var(--background)',
      color: 'var(--foreground)',
      opacity: state.isDisabled ? 0.5 : 1
    }),
    singleValue: (base: any) => ({
      ...base,
      color: 'inherit'
    }),
    placeholder: (base: any) => ({
      ...base,
      color: 'var(--muted-foreground)'
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: 'var(--popover)',
      color: 'var(--popover-foreground)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      zIndex: 50
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? 'var(--accent)' 
        : state.isFocused 
          ? 'var(--accent)' 
          : 'transparent',
      color: state.isSelected 
        ? 'var(--accent-foreground)' 
        : 'inherit',
      fontSize: '0.875rem',
      cursor: 'pointer'
    })
  };

  return (
    <div className="w-full space-y-4">
      {/* Modify Identity Dialog */}
      <Dialog open={!!editArea} onOpenChange={() => setEditArea(null)}>
        <DialogContent className="rounded-lg max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Update area details and regional node configuration.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Globe className="w-3 h-3" />
                    Country
                  </Label>
                  <Select<CountryOption, false>
                    options={countries.map(c => ({ value: c.id, label: c.name, code: c.code }))}
                    value={countryOpt}
                    onChange={handleCountryChange}
                    placeholder="Select Country"
                    styles={dialogSelectStyles}
                    formatOptionLabel={(option: CountryOption) => (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                            alt={option.label}
                            className="w-4 h-3 rounded-sm object-cover border border-border"
                          />
                          <span>{option.label}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">#{option.code}</span>
                      </div>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Navigation className="w-3 h-3" />
                    Province
                  </Label>
                  <Select<ProvinceOption, false>
                    options={provinceOptions}
                    value={provinceOpt}
                    onChange={handleProvinceChange}
                    placeholder={countryOpt ? "Select Province" : "Awaiting Country..."}
                    isDisabled={!countryOpt}
                    styles={dialogSelectStyles}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    City
                  </Label>
                  <Select<CityOption, false>
                    options={cityOptions}
                    value={cityOpt}
                    onChange={(opt) => setCityOpt(opt)}
                    placeholder={provinceOpt ? "Select City" : "Awaiting Province..."}
                    isDisabled={!provinceOpt}
                    styles={dialogSelectStyles}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Area Designation</Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Geospatial Fixation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Latitude</Label>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="h-9 text-xs font-mono bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] text-muted-foreground">Longitude</Label>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="h-9 text-xs font-mono bg-background"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
                    Node Status
                  </Label>
                  <ShadSelect value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-10 text-sm">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" className="text-xs">Active / Operational</SelectItem>
                      <SelectItem value="inactive" className="text-xs text-destructive">Inactive / Decommissioned</SelectItem>
                    </SelectContent>
                  </ShadSelect>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditArea(null)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[450px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Area
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this area? This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1">Warning</p>
            <p className="text-xs text-destructive">
              You are about to purge <span className="font-bold">{selectedArea?.name}</span>. 
              This will permanently decommission this regional node segment.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Data Table Container */}
      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6 py-3 h-auto">
                      <div
                        onClick={() => header.column.toggleSorting()}
                        className="flex items-center gap-2 cursor-pointer select-none group/header"
                      >
                        <div className="flex flex-col">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </div>
                        <div className="flex flex-col opacity-0 group-hover/header:opacity-100 transition-opacity">
                          {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3 h-3 text-muted-foreground" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                        </div>
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
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2, delay: index * 0.01 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-3.5 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Activity className="w-8 h-8 animate-pulse text-muted-foreground/60" />
                        <p className="text-xs uppercase tracking-wider">No nodes detected in local segment</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Navigation Footer */}
        <div className="px-6 py-4 bg-muted/20 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <ShadSelect
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()} className="text-xs">
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            <div className="text-xs text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Live</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
