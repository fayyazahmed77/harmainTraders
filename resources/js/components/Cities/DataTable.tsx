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

interface City {
  id: number;
  country_id: number;
  province_id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Country {
  id: number;
  name: string;
  code: string; // ISO code for flag
}

interface Province {
  id: number;
  name: string;
  code: string;
  country_id: number;
}

interface DataTableProps {
  data: City[];
  countries: Country[];
  provinces: Province[];
}

export function DataTable({ data, countries, provinces }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };
  const permissions = pageProps.auth.permissions;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [editCity, setEditCity] = useState<City | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string>("");

  // handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editCity) return;

    router.put(
      `/cities/${editCity.id}`,
      {
        name,
        code,
        country_id: selectedCountry,
        province_id: selectedProvince,
      },
      {
        onSuccess: () => {
          toast.success("City updated successfully!");
          setEditCity(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // handle delete
  const handleDelete = () => {
    if (!selectedCity) return;
    router.delete(`/cities/${selectedCity.id}`, {
      onSuccess: () => {
        toast.success("City deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  const columns: ColumnDef<City>[] = [
    {
      accessorKey: "country",
      header: "Country",
      cell: ({ row }) => {
        const city = row.original;
        const country = countries.find((c) => c.id === Number(city.country_id));
        if (!country) return "Unknown";
        return (
          <div className="flex items-center gap-2">
            <img
              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="w-6 h-4 rounded"
            />
            <span>{country.name}</span>
          </div>
        );
      },
    },
    { accessorKey: "province.name", header: "Province" },
    { accessorKey: "name", header: "City" },
    { accessorKey: "code", header: "City Code" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            row.original.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {row.original.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
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
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={name} />
              ) : (
                <AvatarFallback>{firstLetter}</AvatarFallback>
              )}
            </Avatar>
            <span>{name}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      enableHiding: false,
      cell: ({ row }) => {
        const city = row.original;
        const canEdit = permissions.includes("edit cities");
        const canDelete = permissions.includes("delete cities");

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
                    setEditCity(city);
                    setName(city.name);
                    setCode(city.code);
                    setSelectedCountry(city.country_id?.toString() || "");
                    setSelectedProvince(city.province_id?.toString() || "");
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCity(city);
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
      {/* ✅ Edit Dialog */}
      <Dialog open={!!editCity} onOpenChange={() => setEditCity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>Update the city details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              {/* Country Dropdown */}
              <div>
                <Label className="mb-2">Country</Label>
                <ShadSelect
                  value={selectedCountry}
                  onValueChange={(value) => {
                    setSelectedCountry(value);
                    setSelectedProvince("");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem
                        key={country.id}
                        value={country.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                            alt={country.name}
                            className="w-5 h-4 rounded-sm"
                          />
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* Province Dropdown */}
              <div>
                <Label className="mb-2">Province</Label>
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
                      .map((province) => (
                        <SelectItem
                          key={province.id}
                          value={province.id.toString()}
                        >
                          {province.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </ShadSelect>
              </div>

              {/* City Name */}
              <div>
                <Label className="mb-2">City Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* City Code */}
              <div>
                <Label className="mb-2">City Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
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

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete City</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedCity?.name}</strong>?
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
