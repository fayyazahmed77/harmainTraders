"use client";

import React, { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Trash2, 
  Building2, 
  UserCircle,
  Package,
  Check
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";

interface Company {
  id: number;
  title: string;
  items_count: number;
}

interface Supplier {
  id: number;
  title: string;
  code: string;
  assigned_companies: Company[];
}

interface Props {
  suppliers: Supplier[];
  allCompanies: Company[];
}

const breadcrumbs = [
  { title: "Orders", href: "#" },
  { title: "Supplier Companies", href: "/admin/supplier-companies" },
];

export default function SupplierCompanies({ suppliers, allCompanies }: Props) {
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(suppliers[0]?.id || null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);

  const selectedSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId), 
  [suppliers, selectedSupplierId]);

  const filteredSuppliers = useMemo(() => 
    suppliers.filter(s => 
      s.title.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(supplierSearch.toLowerCase())
    ),
  [suppliers, supplierSearch]);

  const availableCompanies = useMemo(() => {
    if (!selectedSupplier) return [];
    const assignedIds = selectedSupplier.assigned_companies.map(c => c.id);
    return allCompanies.filter(c => 
      !assignedIds.includes(c.id) &&
      c.title.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [allCompanies, selectedSupplier, companySearch]);

  const handleAddCompanies = () => {
    if (!selectedSupplierId || selectedCompanyIds.length === 0) return;

    router.post('/admin/supplier-companies', {
      supplier_id: selectedSupplierId,
      company_ids: selectedCompanyIds
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setSelectedCompanyIds([]);
      }
    });
  };

  const handleRemoveCompany = (companyId: number) => {
    if (!selectedSupplierId) return;
    if (confirm('Are you sure you want to remove this company assignment?')) {
      router.delete(`/admin/supplier-companies/${selectedSupplierId}/${companyId}`);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full h-[calc(100vh-80px)]">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">Supplier Companies</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Map and manage relationships between suppliers and their respective companies.</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 border border-blue-500/20">
              <Building2 size={24} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 overflow-hidden">
            {/* Left Pane: Suppliers */}
            <Card className="md:col-span-4 border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <UserCircle size={14} className="text-blue-500" />
                  Suppliers
                </CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  <Input 
                    placeholder="Search suppliers..." 
                    className="pl-9 h-9 text-xs border-zinc-200 dark:border-zinc-800 shadow-none focus-visible:ring-blue-500"
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredSuppliers.map((supplier) => (
                    <button
                      key={supplier.id}
                      onClick={() => setSelectedSupplierId(supplier.id)}
                      className={cn(
                        "w-full text-left p-4 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group",
                        selectedSupplierId === supplier.id ? "bg-blue-50/50 dark:bg-blue-500/5 border-l-4 border-blue-500" : "border-l-4 border-transparent"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={cn(
                            "text-xs font-bold uppercase",
                            selectedSupplierId === supplier.id ? "text-blue-600" : "text-zinc-900 dark:text-zinc-100"
                          )}>{supplier.title}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{supplier.code}</p>
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {supplier.assigned_companies.length} Co.
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Right Pane: Assigned Companies */}
            <Card className="md:col-span-8 border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={14} className="text-blue-500" />
                    Assigned Companies
                  </CardTitle>
                  <p className="text-[10px] text-zinc-400 font-medium mt-1 uppercase tracking-wider">
                    {selectedSupplier?.title || 'Select a supplier'}
                  </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20"
                      disabled={!selectedSupplierId}
                    >
                      <Plus size={14} />
                      Add Company
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md border-zinc-200 dark:border-zinc-800 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Plus size={16} className="text-blue-600" />
                        Assign Companies
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                        <Input 
                          placeholder="Filter companies..." 
                          className="pl-9 h-10 text-xs border-zinc-200 dark:border-zinc-800 shadow-none focus-visible:ring-blue-500"
                          value={companySearch}
                          onChange={(e) => setCompanySearch(e.target.value)}
                        />
                      </div>
                      
                      <div className="max-h-60 overflow-auto border border-zinc-100 dark:border-zinc-800 rounded-xl divide-y divide-zinc-100 dark:divide-zinc-800 custom-scrollbar">
                        {availableCompanies.length > 0 ? (
                          availableCompanies.map((company) => (
                            <div key={company.id} className="flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                              <Checkbox 
                                id={`co-${company.id}`}
                                checked={selectedCompanyIds.includes(company.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setSelectedCompanyIds([...selectedCompanyIds, company.id]);
                                  else setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== company.id));
                                }}
                                className="border-zinc-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <label htmlFor={`co-${company.id}`} className="flex-1 flex justify-between items-center cursor-pointer">
                                <span className="text-xs font-bold uppercase text-zinc-800 dark:text-zinc-200">{company.title}</span>
                                <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                                  <Package size={10} />
                                  {company.items_count} Items
                                </span>
                              </label>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No available companies</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsDialogOpen(false)}
                        className="text-[10px] font-black uppercase tracking-widest rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleAddCompanies}
                        disabled={selectedCompanyIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-[10px] font-black uppercase tracking-widest rounded-lg px-6 shadow-lg shadow-blue-500/20"
                      >
                        Assign Selected ({selectedCompanyIds.length})
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-auto custom-scrollbar">
                {selectedSupplier ? (
                  selectedSupplier.assigned_companies.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Company Name</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Items Count</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedSupplier.assigned_companies.map((company) => (
                          <TableRow key={company.id} className="group transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                            <TableCell className="py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                  <Building2 size={14} className="text-zinc-500" />
                                </div>
                                <span className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100">{company.title}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-[10px] font-black px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                {company.items_count} Items
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRemoveCompany(company.id)}
                                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg shadow-none"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className="h-16 w-16 rounded-3xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4">
                        <Building2 size={32} className="text-zinc-300" />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No Companies Assigned</h3>
                      <p className="text-xs text-zinc-500 mt-1 max-w-[240px]">This supplier hasn't been mapped to any companies yet. Assign companies to track their orders.</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-6 text-[10px] font-black uppercase tracking-widest rounded-lg gap-2"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus size={14} />
                        Get Started
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-zinc-400">
                    <UserCircle size={48} className="mb-4 opacity-20" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Select a supplier from the list</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
