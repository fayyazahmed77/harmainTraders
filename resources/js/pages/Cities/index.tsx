"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/Cities/DataTable";
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


import Select, { SingleValue } from "react-select";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Cities", href: "/cities" }];

interface City {
  id: number;
  country_id: number;
  province_id: number;
  name: string;
  code: string;
  latitude?: string;
  longitude?: string;
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

interface Province {
  id: number;
  name: string;
  code: string;
  country_id: number;
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

interface IndexProps {
  countries: Country[];
  provinces: Province[];
  cities: City[];
}

export default function Index({ cities, countries, provinces }: IndexProps) {
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
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [country, setCountry] = useState<CountryOption | null>(null);
  const [province, setProvince] = useState<ProvinceOption | null>(null);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);

  // handle country change -> load provinces
  const handleCountryChange = async (option: SingleValue<CountryOption>) => {
    setCountry(option);
    setProvince(null);
    setProvinceOptions([]);

    if (option) {
      try {
        const response = await fetch(`cities/countries/${option.value}/provinces`);

        const data: Province[] = await response.json();
        setProvinceOptions(
          data.map((p) => ({
            value: p.id,
            label: p.name,
            code: p.code,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch provinces:", error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!country || !province) return;

    const payload = {
      name,
      code,
      country_id: country.value,
      province_id: province.value,
      latitude,
      longitude,
    };

    router.post("/cities", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setCode("");
        setLatitude("");
        setLongitude("");
        setCountry(null);
        setProvince(null);
        setProvinceOptions([]);
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create cities");

  const countryOptions: CountryOption[] = countries.map((c) => ({
    value: c.id,
    label: c.name,
    code: c.code,
  }));

  return (
    <>

      <Head title="Cities" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Cities list </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Cities here.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add City
              </Button>
            </div>


            {cities.length === 0 ? (
              <div>No cities found.</div>
            ) : (
              <DataTable data={cities} countries={countries} provinces={provinces} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create City</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new city.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {/* Country */}
            <div className="grid gap-2">
              <Label htmlFor="country">Select Country</Label>
              <Select<CountryOption, false>
                id="country"
                options={countryOptions}
                value={country}
                onChange={handleCountryChange}
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

            {/* Province */}
            <div className="grid gap-2 mt-4">
              <Label htmlFor="province">Select Province</Label>
              <Select<ProvinceOption, false>
                id="province"
                options={provinceOptions}
                value={province}
                onChange={(option: SingleValue<ProvinceOption>) =>
                  setProvince(option)
                }
                placeholder={
                  country ? "Select a province..." : "Select country first..."
                }
                isDisabled={!country}
                isSearchable
                formatOptionLabel={(option: ProvinceOption) => (
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      ({option.code})
                    </span>
                  </div>
                )}
              />
            </div>

            {/* City Name */}
            <div className="grid gap-2 mt-4">
              <Label htmlFor="name">City Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter city name"
              />
            </div>

            {/* City Code */}
            <div className="grid gap-2 mt-4 mb-2">
              <Label htmlFor="code">City Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter short city code"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-2 mb-2">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 30.3753"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 69.3451"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" variant="outline" className="bg-sky-500">
                Add City
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
