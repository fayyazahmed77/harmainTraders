"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/saleman/DataTable";
import { BreadcrumbItem } from "@/types";
import { Plus, Users, CheckCircle, UserMinus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Setup", href: "#" },
  { title: "Salemen", href: "/salemen" },
];

interface Saleman {
  id: number;
  name: string;
  shortname: string;
  code: string;
  date: string;
  status: string | boolean | null;
  defult: string | boolean | null;
  created_by: number;
  created_at: string;
  created_by_name?: string;
}

interface Pagination<T> {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface IndexProps {
  salemen: Pagination<Saleman>;
}

export default function SalemanIndex({ salemen }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [shortname, setShortname] = useState("");
  const [code, setCode] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState(true);
  const [defult, setDefult] = useState(false);

  const totalSalemen = salemen.total || salemen.data.length;
  // This is a simple client-side count for the current page, 
  // in a real app you might want this from the server prop.
  const activeSalemen = salemen.data.filter(s => Number(s.status) === 1 || s.status === true || s.status === "1").length;
  const inactiveSalemen = totalSalemen - activeSalemen;

  const fetchNextCode = async () => {
    try {
      const response = await fetch("/salemen/next-code");
      const data = await response.json();
      if (data.code) {
        setCode(data.code);
      }
    } catch (error) {
      console.error("Error fetching next code:", error);
    }
  };

  const setFormattedDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setDate(`${year}-${month}-${day}`);
  };

  const handleOpenModal = () => {
    setName("");
    setShortname("");
    setFormattedDate();
    fetchNextCode();
    setStatus(true);
    setDefult(false);
    setOpenCreateDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/salemen", { name, shortname, code, date, status, defult }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setShortname("");
        setCode("");
        setDate("");
        setStatus(true);
        setDefult(false);
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create saleman");

  return (
    <>
      <Head title="Salemen - Harnain Traders" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-slate-50/50">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="p-6 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Salemen Directory</h1>
                <p className="text-slate-500 mt-1">
                  Manage and monitor your distribution team performance.
                </p>
              </div>
              <Button
                onClick={handleOpenModal}
                disabled={!canCreate}
                className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200 transition-all active:scale-95"
              >
                <Plus className="mr-2 h-5 w-5" /> Add New Saleman
              </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">Total Salemen</p>
                      <p className="text-3xl font-bold text-slate-900">{totalSalemen}</p>
                    </div>
                    <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600 group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">Active Agents</p>
                      <p className="text-3xl font-bold text-emerald-600">{activeSalemen}</p>
                    </div>
                    <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-500">Inactive/On-Hold</p>
                      <p className="text-3xl font-bold text-orange-600">{inactiveSalemen}</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                      <UserMinus className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* List Section */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="border-b bg-slate-50/50 py-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-600" />
                  Salemen List
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {salemen.data.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Users className="h-12 w-12 mb-4 opacity-20" />
                    <p>No salemen found in the directory.</p>
                  </div>
                ) : (
                  <DataTable data={salemen.data} />
                )}
              </CardContent>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Saleman Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Saleman</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new saleman.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  const val = e.target.value;
                  setName(val);
                  // Generate initials (e.g., "Fayyaz Ahmed" -> "FA")
                  const initials = val
                    .split(" ")
                    .filter((part) => part.length > 0)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();
                  setShortname(initials);
                }}
                placeholder="Enter saleman name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortname">Short Name</Label>
              <Input
                id="shortname"
                value={shortname}
                onChange={(e) => setShortname(e.target.value)}
                placeholder="Enter short name"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={code}
                  readOnly
                  className="bg-muted font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status ? "1" : "0"}
                  onValueChange={(val) => setStatus(val === "1")}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="0">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defult">Default</Label>
                <Select
                  value={defult ? "1" : "0"}
                  onValueChange={(val) => setDefult(val === "1")}
                >
                  <SelectTrigger id="defult" className="w-full">
                    <SelectValue placeholder="Is default?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Yes</SelectItem>
                    <SelectItem value="0">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" className="w-full  transition-colors">
                Add Saleman
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
