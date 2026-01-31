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

interface MessageLine {
  id: number;
  messageline: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}

interface DataTableProps {
  messagesline: MessageLine[];
}

export function DataTable({ messagesline }: DataTableProps) {
  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
  };
  const permissions = pageProps.auth.permissions;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  // edit/delete states
  const [editMessage, setEditMessage] = useState<MessageLine | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageLine | null>(null);

  // form states
  const [messageline, setMessageLine] = useState("");
  const [status, setStatus] = useState("active");

  // 🧩 Handle update
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editMessage) return;

    router.put(
      `/message-lines/${editMessage.id}`,
      { messageline, status },
      {
        onSuccess: () => {
          toast.success("Message Line updated successfully!");
          setEditMessage(null);
        },
        onError: () => toast.error("Update failed"),
      }
    );
  };

  // 🗑 Handle delete
  const handleDelete = () => {
    if (!selectedMessage) return;
    router.delete(`/message-lines/${selectedMessage.id}`, {
      onSuccess: () => {
        toast.success("Message Line deleted successfully!");
        setOpenDeleteDialog(false);
      },
      onError: () => toast.error("Delete failed"),
    });
  };

  // 📊 Table columns
  const columns: ColumnDef<MessageLine>[] = [
    { accessorKey: "messageline", header: "Message Line" },
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
    { accessorKey: "created_at", header: "Created At" },
  ];

  const table = useReactTable({
    data: messagesline,
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
      {/* ✏️ Edit Dialog */}
      <Dialog open={!!editMessage} onOpenChange={() => setEditMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message Line</DialogTitle>
            <DialogDescription>Update the message line details.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 mb-2">
              {/* Message Line */}
              <div>
                <Label>Message Line</Label>
                <Input
                  value={messageline}
                  onChange={(e) => setMessageLine(e.target.value)}
                  placeholder="Enter message line"
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

      {/* 🗑 Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message Line</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{selectedMessage?.messageline}</strong>?
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

      {/* 📋 Table */}
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
              <TableRow
                key={row.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  setEditMessage(row.original);
                  setMessageLine(row.original.messageline);
                  setStatus(row.original.status);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSelectedMessage(row.original);
                  setOpenDeleteDialog(true);
                }}
              >
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
