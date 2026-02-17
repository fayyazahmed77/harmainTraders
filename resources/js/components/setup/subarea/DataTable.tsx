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
  PencilLine,
  Trash2,
  Mail,
  User,
  Calendar,
  Hash,
  MapPin,
  Activity,
  ShieldCheck,
  Building2,
  Globe,
  Navigation,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import Select from "react-select";

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

interface AreaOption {
  value: number;
  label: string;
}

interface Subarea {
  id: number;
  name: string;
  area_id: number;
  city_id: number;
  province_id: number;
  country_id: number;
  latitude?: string;
  longitude?: string;
  created_by_name?: string;
  created_by_avatar?: string;
  status: string;
  created_at: string;
}

interface Area {
  id: number;
  name: string;
  city_id: number;
  province_id: number;
  country_id: number;
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
    errors: Record<string, string>;
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
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [countryOpt, setCountryOpt] = useState<CountryOption | null>(null);
  const [provinceOpt, setProvinceOpt] = useState<ProvinceOption | null>(null);
  const [cityOpt, setCityOpt] = useState<CityOption | null>(null);
  const [areaOpt, setAreaOpt] = useState<AreaOption | null>(null);

  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [areaOptions, setAreaOptions] = useState<AreaOption[]>([]);

  // Helpers to reset cascades
  const handleCountryChange = (opt: CountryOption | null) => {
    setCountryOpt(opt);
    setProvinceOpt(null);
    setCityOpt(null);
    setAreaOpt(null);
    setProvinceOptions([]);
    setCityOptions([]);
    setAreaOptions([]);

    if (opt) {
      const filtered = provinces
        .filter((p) => p.country_id === opt.value)
        .map((p) => ({ value: p.id, label: p.name, code: "" })); // code not used for province/city in this list
      setProvinceOptions(filtered);
    }
  };

  const handleProvinceChange = (opt: ProvinceOption | null) => {
    setProvinceOpt(opt);
    setCityOpt(null);
    setAreaOpt(null);
    setCityOptions([]);
    setAreaOptions([]);

    if (opt) {
      const filtered = cities
        .filter((c) => c.province_id === opt.value)
        .map((c) => ({ value: c.id, label: c.name, code: "" }));
      setCityOptions(filtered);
    }
  };

  const handleCityChange = (opt: CityOption | null) => {
    setCityOpt(opt);
    setAreaOpt(null);
    setAreaOptions([]);

    if (opt) {
      const filtered = areas
        .filter((a) => a.city_id === opt.value)
        .map((a) => ({ value: a.id, label: a.name }));
      setAreaOptions(filtered);
    }
  };

  // ✅ Update subarea
  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editSubarea) return;

    router.put(
      `/subareas/${editSubarea.id}`,
      {
        name,
        status,
        country_id: countryOpt?.value,
        province_id: provinceOpt?.value,
        city_id: cityOpt?.value,
        area_id: areaOpt?.value,
        latitude,
        longitude,
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
      accessorKey: "country",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Parent Jurisdiction</span>
      ),
      cell: ({ row }) => {
        const subarea = row.original;
        const country = countries.find((c) => c.id === Number(subarea.country_id));
        if (!country) return <span className="text-xs font-black text-muted-foreground/30 uppercase tracking-widest italic leading-none group-hover/row:text-orange-600">Isolated node</span>;

        return (
          <div className="flex items-center gap-3 leading-none group/jurisdiction">
            <div className="relative leading-none">
              <div className="absolute -inset-1 bg-orange-500 rounded-sm blur opacity-0 group-hover/jurisdiction:opacity-20 transition duration-500" />
              <img
                src={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png`}
                alt={country.name}
                className="relative w-8 h-5 rounded-sm object-cover border border-orange-500/10 shadow-sm transition-transform group-hover/jurisdiction:scale-110 duration-500"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-foreground/70 uppercase tracking-tight leading-none group-hover/jurisdiction:text-orange-600 transition-colors uppercase">{country.name}</span>
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none font-mono">#{country.code}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "province",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Regional Zone</span>
      ),
      cell: ({ row }) => {
        const province = provinces.find((p) => p.id === Number(row.original.province_id));
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-foreground uppercase tracking-tight leading-none italic">{province?.name || "Unknown Zone"}</span>
            <span className="text-[8px] font-black text-orange-600/40 uppercase tracking-widest leading-none font-mono">SEC-PROV</span>
          </div>
        );
      }
    },
    {
      accessorKey: "city",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">City Node</span>
      ),
      cell: ({ row }) => {
        const city = cities.find((c) => c.id === Number(row.original.city_id));
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-foreground uppercase tracking-tight leading-none italic">{city?.name || "Unassigned"}</span>
            <span className="text-[8px] font-black text-orange-600/40 uppercase tracking-widest leading-none font-mono">NODE-CITY</span>
          </div>
        );
      }
    },
    {
      accessorKey: "area",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Area Segment</span>
      ),
      cell: ({ row }) => {
        const area = areas.find((a) => a.id === Number(row.original.area_id));
        return (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-foreground uppercase tracking-tight leading-none">{area?.name || "Unlinked Segment"}</span>
            <span className="text-[8px] font-black text-orange-600/40 uppercase tracking-widest leading-none font-mono tracking-tighter italic">FRAGMENTAL</span>
          </div>
        );
      }
    },
    {
      accessorKey: "name",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Subarea Identity</span>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="font-black text-foreground tracking-tight uppercase leading-none group-hover/row:text-orange-600 transition-colors">{row.original.name}</span>
          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-widest uppercase leading-none font-mono">Registry #SUB-{row.original.id}</span>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Node Status</span>
      ),
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <div className="flex items-center gap-2.5 group/status">
            <div className={`relative w-2 h-2 rounded-full leading-none overflow-visible`}>
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isActive ? 'bg-orange-500' : 'bg-rose-500'}`} />
              <div className={`relative w-2 h-2 rounded-full border border-white/20 shadow-[0_0_8px_rgba(0,0,0,0.1)] ${isActive ? 'bg-orange-500' : 'bg-rose-500'}`} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isActive ? 'text-orange-600' : 'text-rose-600'}`}>
              {isActive ? 'Operational' : 'Decommissioned'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "created_by",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Origin registrar</span>
      ),
      cell: ({ row }) => {
        const name = row.original.created_by_name || "System";
        const email = row.original.created_by_name ? `${row.original.created_by_name.toLowerCase().replace(' ', '.')}@harnain.com` : "harnain.sys@cloud.io";
        const imageUrl = row.original.created_by_avatar || "";
        const firstLetter = name.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-3 group/registrar">
            <div className="relative">
              <div className="absolute -inset-1 bg-orange-500 rounded-full blur opacity-0 group-hover/registrar:opacity-20 transition duration-500" />
              <Avatar className="h-9 w-9 border-2 border-white ring-2 ring-orange-500/10 ring-offset-1 group-hover/registrar:ring-orange-500/40 transition-all duration-500 rounded-sm">
                {imageUrl ? (
                  <AvatarImage src={imageUrl} alt={name} className="object-cover rounded-sm" />
                ) : (
                  <AvatarFallback className="bg-orange-600 text-[10px] font-black text-white rounded-sm">{firstLetter}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-foreground/80 uppercase tracking-tight leading-none mb-1">{name}</span>
              <div className="flex items-center gap-1.5 opacity-40 group-hover/registrar:opacity-100 transition-opacity">
                <Mail className="w-2.5 h-2.5 text-orange-600" />
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-600/60 leading-none">Interlink</span>
      ),
      cell: ({ row }) => {
        const subarea = row.original;
        const canEdit = permissions.includes("edit subareas");
        const canDelete = permissions.includes("delete subareas");

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-orange-500/10 hover:text-orange-600 border border-transparent hover:border-orange-500/20 rounded-sm transition-all focus-visible:ring-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-sm border-2 border-orange-500/10 bg-white/95 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="px-3 py-2 border-b border-orange-500/5 mb-1">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none mb-1">Node Operations</p>
                <p className="text-[10px] font-bold text-foreground truncate uppercase tracking-tight leading-none">{subarea.name}</p>
              </div>
              {canEdit && (
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-orange-600 hover:bg-orange-500/5 cursor-pointer rounded-sm transition-all group/item"
                  onClick={() => {
                    setEditSubarea(subarea);
                    setName(subarea.name);
                    setLatitude(subarea.latitude || "");
                    setLongitude(subarea.longitude || "");
                    setStatus(subarea.status);

                    // Setup cascades
                    const c = countries.find(co => co.id === subarea.country_id);
                    const p = provinces.find(pr => pr.id === subarea.province_id);
                    const ci = cities.find(ct => ct.id === subarea.city_id);
                    const ar = areas.find(a => a.id === subarea.area_id);

                    if (c) {
                      setCountryOpt({ value: c.id, label: c.name, code: c.code });
                      const filteredP = provinces
                        .filter(prov => prov.country_id === c.id)
                        .map(prov => ({ value: prov.id, label: prov.name, code: "" }));
                      setProvinceOptions(filteredP);
                    }
                    if (p) {
                      setProvinceOpt({ value: p.id, label: p.name, code: "" });
                      const filteredCi = cities
                        .filter(city => city.province_id === p.id)
                        .map(city => ({ value: city.id, label: city.name, code: "" }));
                      setCityOptions(filteredCi);
                    }
                    if (ci) {
                      setCityOpt({ value: ci.id, label: ci.name, code: "" });
                      const filteredAr = areas
                        .filter(area => area.city_id === ci.id)
                        .map(area => ({ value: area.id, label: area.name }));
                      setAreaOptions(filteredAr);
                    }
                    if (ar) {
                      setAreaOpt({ value: ar.id, label: ar.name });
                    }
                  }}
                >
                  <PencilLine className="w-4 h-4 text-muted-foreground group-hover/item:text-orange-600 transition-colors" />
                  Modify Identity
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:text-white hover:bg-rose-600 cursor-pointer rounded-sm transition-all group/item-delete mt-1"
                  onClick={() => {
                    setSelectedSubarea(subarea);
                    setOpenDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 group-hover/item-delete:scale-110 transition-transform" />
                  Purge record
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
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
    <div className="w-full space-y-4">
      {/* Modify Identity Dialog */}
      <Dialog open={!!editSubarea} onOpenChange={() => setEditSubarea(null)}>
        <DialogContent className="rounded-sm border-2 border-orange-500/20 p-0 overflow-hidden sm:max-w-[650px] bg-white shadow-2xl max-h-[95vh] flex flex-col">
          <div className="h-2 bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] flex-shrink-0" />
          <div className="p-8 lg:p-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-orange-600 text-white rounded-sm shadow-xl shadow-orange-600/20 ring-4 ring-orange-500/10 rotate-3 transition-transform hover:rotate-0 duration-500">
                  <PencilLine className="w-8 h-8" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">
                    MODIFY <span className="text-orange-500 italic">IDENTITY</span>
                  </DialogTitle>
                  <DialogDescription className="font-black text-orange-600 uppercase text-[10px] tracking-widest opacity-70">
                    Administrative Node Reconfiguration
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleUpdate} className="space-y-8">
              <div className="space-y-6">
                {/* Quadruple Cascade Selection */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Globe className="w-3 h-3" />
                      Jurisdiction
                    </Label>
                    <Select<CountryOption, false>
                      options={countries.map(c => ({ value: c.id, label: c.name, code: c.code }))}
                      value={countryOpt}
                      onChange={handleCountryChange}
                      placeholder="SELECT COUNTRY..."
                      className="technical-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '11px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: 'rgba(0,0,0,0.02)'
                        }),
                        menu: (base) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(249,115,22,0.1)',
                          boxShadow: 'z-50'
                        })
                      }}
                      formatOptionLabel={(option: CountryOption) => (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                              alt={option.label}
                              className="w-5 h-3.5 rounded-sm object-cover border border-orange-500/10 shadow-sm"
                            />
                            <span className="tracking-tight">{option.label}</span>
                          </div>
                          <span className="text-[10px] font-black text-orange-600/40 font-mono">#{option.code}</span>
                        </div>
                      )}
                    />
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Navigation className="w-3 h-3" />
                      Regional Zone
                    </Label>
                    <Select<ProvinceOption, false>
                      options={provinceOptions}
                      value={provinceOpt}
                      onChange={handleProvinceChange}
                      placeholder={countryOpt ? "PROVINCE..." : "AWAIT..."}
                      isDisabled={!countryOpt}
                      className="technical-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '11px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: state.isDisabled ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                          opacity: state.isDisabled ? 0.5 : 1
                        })
                      }}
                    />
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Building2 className="w-3 h-3" />
                      City Node
                    </Label>
                    <Select<CityOption, false>
                      options={cityOptions}
                      value={cityOpt}
                      onChange={handleCityChange}
                      placeholder={provinceOpt ? "CITY..." : "AWAIT..."}
                      isDisabled={!provinceOpt}
                      className="technical-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '11px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: state.isDisabled ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                          opacity: state.isDisabled ? 0.5 : 1
                        })
                      }}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                      <Layers className="w-3 h-3" />
                      Area Segment
                    </Label>
                    <Select<AreaOption, false>
                      options={areaOptions}
                      value={areaOpt}
                      onChange={(opt) => setAreaOpt(opt)}
                      placeholder={cityOpt ? "AREA..." : "AWAIT..."}
                      isDisabled={!cityOpt}
                      className="technical-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderRadius: '2px',
                          border: '2px solid rgba(0,0,0,0.1)',
                          '&:hover': { borderColor: 'rgba(249,115,22,0.4)' },
                          boxShadow: 'none',
                          height: '48px',
                          fontSize: '11px',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          backgroundColor: state.isDisabled ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)',
                          opacity: state.isDisabled ? 0.5 : 1
                        })
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 text-left w-full block mb-2">
                    Subarea Designation
                  </Label>
                  <Input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-black uppercase tracking-tight transition-all"
                  />
                </div>

                <div className="bg-orange-500/5 p-6 rounded-sm border-2 border-orange-500/10 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.2)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Geospatial Fixation</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Latitude</Label>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Longitude</Label>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="h-10 border-2 border-border/20 focus:border-orange-500 rounded-sm bg-white font-mono text-xs shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2 text-left mb-2">
                    <ShieldCheck className="w-3 h-3 text-orange-600" />
                    Node Status
                  </Label>
                  <ShadSelect value={status} onValueChange={setStatus}>
                    <SelectTrigger className="h-12 border-2 border-border/40 focus:border-orange-500 rounded-sm bg-muted/20 font-black uppercase tracking-tight transition-all">
                      <SelectValue placeholder="Operational Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-2 border-orange-500/10 shadow-2xl">
                      <SelectItem value="active" className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-sm focus:bg-orange-50">Operational</SelectItem>
                      <SelectItem value="inactive" className="px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-sm focus:bg-rose-50 text-rose-600">Decommissioned</SelectItem>
                    </SelectContent>
                  </ShadSelect>
                </div>
              </div>

              <DialogFooter className="pt-6 border-t-2 border-orange-500/10 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-14 px-8 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                  onClick={() => setEditSubarea(null)}
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 h-14 px-10 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-orange-600/20 active:scale-95 transition-all text-white border-b-4 border-orange-800/50 flex-1"
                >
                  Commit Changes
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purge Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="rounded-sm border-4 border-red-500/20 p-0 overflow-hidden sm:max-w-[450px] bg-white shadow-2xl">
          <div className="h-2 bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
          <div className="p-8 lg:p-10 text-center">
            <div className="mx-auto w-20 h-20 bg-red-600/10 text-red-600 rounded-sm flex items-center justify-center mb-6 ring-4 ring-red-500/5 rotate-45 group hover:rotate-0 transition-transform duration-500">
              <Trash2 className="w-10 h-10 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">
              CRITICAL <span className="text-red-600 italic">PURGE</span>
            </DialogTitle>
            <DialogDescription className="font-black text-rose-600 uppercase text-[10px] tracking-widest opacity-70 mb-8">
              Critical Node Deletion Protocol
            </DialogDescription>

            <div className="p-6 bg-red-50 border-2 border-red-500/10 rounded-sm mb-10 text-left">
              <p className="text-xs font-black text-red-950 uppercase leading-relaxed mb-1">Warning: Irreversible Operation</p>
              <p className="text-xs font-bold text-red-900/60 leading-relaxed uppercase tracking-tight">
                Are you absolutely sure you want to purge <span className="text-red-600 font-black">{selectedSubarea?.name}</span>?
                This action will permanently decommission the node.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full pt-4">
              <Button
                variant="ghost"
                className="h-14 rounded-sm font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all"
                onClick={() => setOpenDeleteDialog(false)}
              >
                Abort
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 h-14 rounded-sm font-black uppercase tracking-widest shadow-2xl shadow-red-600/20 active:scale-95 transition-all text-white border-b-4 border-red-800/50"
                onClick={handleDelete}
              >
                Confirm Purge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Technical Console Table */}
      <div className="bg-white/80 backdrop-blur-xl border-2 border-orange-500/10 rounded-sm shadow-2xl shadow-orange-500/5 overflow-hidden group/table hover:border-orange-500/20 transition-all duration-700 mt-4">
        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
          <Table>
            <TableHeader className="bg-muted/30 sticky top-0 z-10 border-b-2 border-orange-500/10 h-14">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="px-6 py-0">
                      <div
                        onClick={() => header.column.toggleSorting()}
                        className="flex items-center gap-3 cursor-pointer select-none group/header py-4"
                      >
                        <div className="flex flex-col">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <div className="h-[2px] w-0 bg-orange-500 group-hover/header:w-full transition-all duration-500 mt-1" />
                        </div>
                        <div className="flex flex-col opacity-0 group-hover/header:opacity-100 transition-opacity">
                          {header.column.getIsSorted() === "asc" && <ChevronUp className="w-3 h-3 text-orange-600 font-black" />}
                          {header.column.getIsSorted() === "desc" && <ChevronDown className="w-3 h-3 text-orange-600 font-black" />}
                          {!header.column.getIsSorted() && <div className="w-3 h-3 border-2 border-orange-600/20 rounded-full" />}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="wait">
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row, index) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className="group/row border-b border-orange-500/5 hover:bg-orange-500/[0.02] transition-colors h-16"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-6 py-0 align-middle">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-[400px] text-center">
                      <div className="flex flex-col items-center justify-center opacity-20">
                        <Activity className="w-12 h-12 mb-4 animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">No nodes detected in local segment</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Technical Footer */}
        <div className="px-6 py-6 bg-[#fafafa] border-t-2 border-orange-500/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-8">
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none">Density selection</p>
              <ShadSelect
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-9 w-[100px] bg-white border-2 border-orange-500/10 focus:ring-0 rounded-sm text-[10px] font-black uppercase shadow-sm group hover:border-orange-500/30 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-sm border-2 border-orange-500/10 bg-white">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={pageSize.toString()} className="text-[10px] font-black uppercase focus:bg-orange-50 rounded-sm py-2 italic font-black">
                      {pageSize} Nodes
                    </SelectItem>
                  ))}
                </SelectContent>
              </ShadSelect>
            </div>

            <div className="h-10 w-[2px] bg-orange-500/10 hidden sm:block" />

            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 leading-none group-hover/table:text-orange-600 transition-colors">Segment Information</p>
              <div className="h-9 flex items-center px-4 bg-white border-2 border-orange-500/10 rounded-sm shadow-sm group hover:border-orange-500/30 transition-all">
                <p className="text-[10px] font-black text-foreground uppercase tracking-tighter">
                  Index {table.getState().pagination.pageIndex + 1} <span className="text-orange-600/40 font-mono mx-1">/</span> {table.getPageCount()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border-2 border-orange-500/10 rounded-sm p-1 shadow-sm mr-2 group/stream">
              <div className="flex items-center gap-1.5 px-3 border-r border-orange-500/10 mr-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest leading-none">Live stream</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 opacity-40 group-hover/stream:opacity-100 transition-opacity">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-3 bg-orange-600/20 rounded-full group-hover/stream:animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white border-2 border-orange-500/10 rounded-sm p-1 shadow-sm overflow-hidden group/pagination">
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-orange-500/10 hover:text-orange-600 rounded-sm disabled:opacity-20 transition-all active:scale-95"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-orange-500/10 hover:text-orange-600 rounded-sm disabled:opacity-20 transition-all active:scale-95"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div className="h-5 w-[1px] bg-orange-500/10 mx-1" />
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-orange-500/10 hover:text-orange-600 rounded-sm disabled:opacity-20 transition-all active:scale-95"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0 hover:bg-orange-500/10 hover:text-orange-600 rounded-sm disabled:opacity-20 transition-all active:scale-95"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
