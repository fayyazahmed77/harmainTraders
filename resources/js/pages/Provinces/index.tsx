"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Provinces/DataTable"; // ✅ use Provinces table
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


// ✅ react-select import
import Select, { SingleValue } from "react-select";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Provinces", href: "/provinces" },
];

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
  code: string; // ISO code (e.g. "PK")
}

interface CountryOption {
  value: number;
  label: string;
  code: string;
}

interface IndexProps {
  countries: Country[];
  provinces: Province[];
}

export default function Index({ provinces, countries }: IndexProps) {
  useToastFromQuery();
  const pageProps = usePage().props as unknown as {
    auth: {
      user: any;
      permissions: string[];
    };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;

  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  // form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState<CountryOption | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!country) return;

    const payload = {
      name,
      code,
      country_id: country.value,
    };

    router.post("/provinces", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setCountry(null);
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create provinces");

  // ✅ Map countries for react-select
  const countryOptions: CountryOption[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  return (
    <>
      
      <Head title="Provinces" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="mt-4 px-5">
             <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Provinces list </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Provinces here.
                </p>
              </div>
              <Button
              className="bg-sky-500 mb-3"
              onClick={() => setOpenCreateDialog(true)}
              disabled={!canCreate}
            >
              <Plus className="mr-2" /> Add Province
            </Button>
            </div>
            

            {provinces.length === 0 ? (
              <div>No provinces found.</div>
            ) : (
              <DataTable data={provinces} countries={countries} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Province</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new province.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="country">Select Country</Label>
              <Select<CountryOption, false>
                id="country"
                options={countryOptions}
                value={country}
                onChange={(option: SingleValue<CountryOption>) =>
                  setCountry(option)
                }
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

            <div className="grid gap-2 mt-4">
              <Label htmlFor="name">Province Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter province name"
              />
            </div>

            <div className="grid gap-2 mt-4 mb-2">
              <Label htmlFor="code">Province Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter short province code"
              />
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline" className="bg-sky-500">
                Add Province
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
