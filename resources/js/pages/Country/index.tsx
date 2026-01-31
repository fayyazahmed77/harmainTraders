"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Country/DataTable";
import { type BreadcrumbItem } from "@/types";
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
  { title: "Countries", href: "/countries" },
];

interface Country {
  id: number;
  name: string;
  code: string;
  phone_code: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  created_by: number;
  created_by_name?: string;
  created_by_avatar?: string;
}

interface Pagination<T> {
  data: T[];
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}


interface IndexProps {
  countries: Pagination<Country>;
}

export default function Index({ countries }: IndexProps) {
  useToastFromQuery();
  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const errors = pageProps.errors;

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [currency, setCurrency] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      code,
      phone_code: phoneCode,
      currency,
    };

    router.post("/countries", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setPhoneCode("");
        setCurrency("");
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create countries");
console.log(canCreate);
  return (
    <>
      
      <Head title="Countries" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Countries list </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Countries  here.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                // disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Country
              </Button>
            </div>


            {countries.data.length === 0 ? (
              <div>No countries found.</div>
            ) : (
              <>
                <DataTable data={countries.data} />

              </>
            )}

          </div>

        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Country</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new country.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter country name"
              />
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor="code">ISO Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PK, US, GB"
              />
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor="phoneCode">Phone Code</Label>
              <Input
                id="phoneCode"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                placeholder="e.g. +92, +1"
              />
            </div>
            <div className="grid gap-2 mt-4 mb-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="e.g. PKR, USD"
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline" className="bg-sky-500">
                Add Country
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
