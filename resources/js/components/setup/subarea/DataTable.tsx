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
import { ChevronUp, ChevronDown } from "lucide-react";
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

interface Subarea {
  id: number;
  name: string;
  area_id: number;
  city_id: number;
  province_id: number;
  country_id: number;
  created_by_name?: string;
  created_by_avatar?: string;
  status: string;
  created_at: string;
}

interface Area {
  id: number;
  name: string;
}

interface City {
  id: number;
  province_id: number;
  name: string;
}

interface Province {
  id: number;
  country_id: number;
  name: string;
}

interface Country {
  id: number;
  name: string;
  code: string;
}

interface DataTableProps {
  subareas: Subarea[];
  countries: Country[];
  provinces: Province[];
  cities: City[];
  areas: Area[];
}

export function DataTable({
  subareas,
  countries,
  provinces,
  cities,
  areas,
}: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth.permissions;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [editSubarea, setEditSubarea] = useState<Subarea | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedSubarea, setSelectedSubarea] = useState<Subarea | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");

  // ✅ Update subarea
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editSubarea) return;

    router.put(
      `/subareas/${editSubarea.id}`,
      {
        name,
        status,
        country_id: selectedCountry,
        province_id: selectedProvince,
        city_id: selectedCity,
        area_id: selectedArea,
      },
      {
        onSuccess: () => {
          toast.success("Subarea updated successfully!");
          setEditSubarea(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // ✅ Delete subarea
  const handleDelete = () => {
    if (!selectedSubarea) return;
    router.delete(`/subareas/${selectedSubarea.id}`, {
      onSuccess: () => {
        toast.success("Subarea deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  // ✅ Columns
  const columns: ColumnDef<Subarea>[] = [
    {
      header: "Country",
      cell: ({ row }) => {
        const item = row.original;
        const country = countries.find((c) => c.id === item.country_id);
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
        const item = row.original;
        const province = provinces.find((p) => p.id === item.province_id);
        return province ? province.name : "—";
      },
    },
    {
      header: "City",
      cell: ({ row }) => {
        const item = row.original;
        const city = cities.find((c) => c.id === item.city_id);
        return city ? city.name : "—";
      },
    },
    {
      header: "Area",
      cell: ({ row }) => {
        const item = row.original;
        const area = areas.find((a) => a.id === item.area_id);
        return area ? area.name : "—";
      },
    },
    { accessorKey: "name", header: "Subarea Name" },
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
    data: subareas,
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
      {/* ✅ Edit Subarea Dialog */}
      <Dialog open={!!editSubarea} onOpenChange={() => setEditSubarea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subarea</DialogTitle>
            <DialogDescription>Update the subarea details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              {/* Country */}
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
                  <SelectTrigger>
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

              {/* Province */}
              <div>
                <Label>Province</Label>
                <ShadSelect
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                >
                  <SelectTrigger>
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

              {/* City */}
              <div>
                <Label>City</Label>
                <ShadSelect
                  value={selectedCity}
                  onValueChange={setSelectedCity}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities
                      .filter((c) => c.province_id === Number(selectedProvince))
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* Area */}
              <div>
                <Label>Area</Label>
                <ShadSelect
                  value={selectedArea}
                  onValueChange={setSelectedArea}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Area" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* Subarea Name */}
              <div>
                <Label>Subarea Name</Label>
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
                  <SelectTrigger>
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

      {/* ❌ Delete Subarea Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subarea</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedSubarea?.name}</strong>?
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
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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
