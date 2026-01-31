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

interface Area {
  id: number;
  name: string;
  country_id: number;
  province_id: number;
  city_id: number;
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

interface DataTableProps {
   countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
}

export function DataTable({ areas, cities, countries, provinces }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
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
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editArea) return;

    router.put(
      `/areas/${editArea.id}`,
      {
        name,
        status,
        country_id: selectedCountry,
        province_id: selectedProvince,
        city_id: selectedCity,
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
      header: "Country",
      cell: ({ row }) => {
        const area = row.original;
        const country = countries.find((c) => c.id === area.country_id);
        return country ? (
          <div className="flex items-center gap-2">
            <img
              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="w-6 h-4 rounded"
            />
            <span>{country.name}</span>
          </div>
        ) : (
          "—"
        );
      },
    },
    {
      header: "Province",
      cell: ({ row }) => {
        const area = row.original;
        const province = provinces.find((p) => p.id === area.province_id);
        return province ? province.name : "—";
      },
    },
    {
      header: "City",
      cell: ({ row }) => {
        const area = row.original;
        const city = cities.find((c) => c.id === area.city_id);
        return city ? city.name : "—";
      },
    },
    { accessorKey: "name", header: "Area Name" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.original.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    { accessorKey: "created_by_name", header: "Created By" },
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

  return (
    <div className="w-full">
      {/* ✅ Edit Dialog */}
      <Dialog open={!!editArea} onOpenChange={() => setEditArea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area</DialogTitle>
            <DialogDescription>Update the area details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              {/* Country Dropdown */}
              <div>
                <Label>Country</Label>
                <ShadSelect
                  value={selectedCountry}
                  onValueChange={(value) => {
                    setSelectedCountry(value);
                    setSelectedProvince("");
                    setSelectedCity("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id.toString()}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* Province Dropdown */}
              <div>
                <Label>Province</Label>
                <ShadSelect
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces
                      .filter((p) => p.country_id === Number(selectedCountry))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* City Dropdown */}
              <div>
                <Label>City</Label>
                <ShadSelect
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities
                      .filter((c) => c.id === Number(selectedProvince))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* Area Name */}
              <div>
                <Label>Area Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Status */}
              <div>
                <Label>Status</Label>
                <ShadSelect value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </ShadSelect>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ❌ Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Area</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedArea?.name}</strong>?
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

      {/* Table */}
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              {table.getHeaderGroups().map((headerGroup) =>
                headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <div
                      onClick={() => header.column.toggleSorting()}
                      className="flex items-center gap-1 cursor-pointer select-none"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && (
                        <ChevronUp className="w-4 h-4" />
                      )}
                      {header.column.getIsSorted() === "desc" && (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </TableHead>
                ))
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
