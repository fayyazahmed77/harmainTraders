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
import { ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
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
      header: "Country",
      cell: ({ row }) => {
        const province = row.original;
        const country = countries.find(
          (c) => c.id === Number(province.country_id)
        );
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
    { accessorKey: "name", header: "Province Name" },
    { accessorKey: "code", header: "Province Code" },
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
        const province = row.original;
        const canEdit = permissions.includes("edit provinces");
        const canDelete = permissions.includes("delete provinces");

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
                    setEditProvince(province);
                    setName(province.name);
                    setCode(province.code);

                    // ✅ Preselect country
                    const selectedCountry = countryOptions.find(
                      (opt) => opt.value === province.country_id
                    );
                    setEditCountry(selectedCountry || null);
                  }}
                >
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedProvince(province);
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
    <div className="w-full">
      {/* ✅ Edit Dialog */}
      <Dialog open={!!editProvince} onOpenChange={() => setEditProvince(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Province</DialogTitle>
            <DialogDescription>
              Update the province details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              {/* ✅ Country Dropdown */}
              <div>
                <Label htmlFor="edit-country">Select Country</Label>
                <Select<CountryOption, false>
                  id="edit-country"
                  options={countryOptions}
                  value={editCountry}
                  onChange={(option) => setEditCountry(option)}
                  placeholder="Select a country..."
                  isSearchable
                  formatOptionLabel={(option: CountryOption) => (
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                        alt={option.label}
                        className="w-5 h-5 rounded-sm object-cover"
                      />
                      <span>{option.label}</span>
                      <span className="text-gray-400 text-xs ml-2">
                        ({option.code})
                      </span>
                    </div>
                  )}
                />
              </div>

              <div>
                <Label className="mb-2">Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="mb-2">Code</Label>
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

      {/* ✅ Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Province</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedProvince?.name}</strong>?
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

      {/* ✅ Table */}
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
