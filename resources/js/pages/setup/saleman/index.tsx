"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/saleman/DataTable";
import { BreadcrumbItem } from "@/types";
import { Plus } from "lucide-react";
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
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Salemen", href: "/salemen" },
];

interface Saleman {
  id: number;
  name: string;
  shortname: string;
  code: string;
  date: string;
  status: string;
  defult: string;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.post("/salemen", { name, shortname, code, date }, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setShortname("");
        setCode("");
        setDate("");
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create saleman");

  return (
    <>
      <Head title="Salemen" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Salemen</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your salemen here.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Saleman
              </Button>
            </div>

            {salemen.data.length === 0 ? (
              <div>No salemen found.</div>
            ) : (
              <DataTable data={salemen.data} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Saleman Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Saleman</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new saleman.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter saleman name"
              />
            </div>

            <div>
              <Label htmlFor="shortname">Short Name</Label>
              <Input
                id="shortname"
                value={shortname}
                onChange={(e) => setShortname(e.target.value)}
                placeholder="Enter short name"
              />
            </div>

            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code"
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="YYYY-MM-DD"
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline" className="bg-sky-500">
                Add Saleman
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
