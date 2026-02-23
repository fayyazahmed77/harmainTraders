"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/itemcategory/DataTable";
import { type BreadcrumbItem } from "@/types";
import { Plus, Package, Terminal, Sparkles, Wand2, CheckCircle2, Image as ImageIcon, FileText, Info} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Heading } from "@/components/ui/Heading";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import React from "react";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Inventory", href: "#" },
  { title: "Category Registry", href: "/item-categories" },
];

// Interface for category
interface ItemCategory {
  id: number;
  name: string;
  image?: string | null;
  description?: string | null;
  status: "active" | "inactive";
  created_by: number;
  updated_by: number;
  created_at: string;
}

interface PageProps {
  categories: ItemCategory[];
  auth: {
    user: any;
    permissions: string[];
  };
  errors: Record<string, string>;
  [key: string]: any;
}

const PREMIUM_ROUNDING = "rounded-2xl";

export default function Index({ categories }: PageProps) {
  useToastFromQuery();

  const { auth, errors } = usePage<any>().props as unknown as PageProps;

  const permissions = auth?.permissions || [];

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expose trigger globally for DataTable interaction
  React.useEffect(() => {
    (window as any).triggerCreateCategory = () => setOpenCreateDialog(true);
    return () => { delete (window as any).triggerCreateCategory; };
  }, []);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return toast.error("Category Title Required");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("status", status);

    if (image) {
      formData.append("image", image);
    }

    router.post("/item-categories", formData, {
      onSuccess: () => {
        toast.success("Registry Entry Created", { description: "Item category has been successfully inducted." });
        setOpenCreateDialog(false);
        resetForm();
      },
      onError: () => toast.error("Induction Protocol Failed"),
      onFinish: () => setIsSubmitting(false),
      forceFormData: true,
    });
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStatus("active");
    setImage(null);
    setImagePreview(null);
  };

  const canCreate = permissions.includes("create item_categories");

  return (
    <>
      <SidebarProvider>
        <Head title="Category Registry | Inventory Systems" />
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
              {/* Header section with Premium Heading */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <Heading
                  title="Category Registry"
                  description="Manage classification nodes and product hierarchies for inventory management"
                />

                <Button
                  onClick={() => setOpenCreateDialog(true)}
                  className="rounded-xl h-12 px-6 bg-zinc-900 border-orange-500/20 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  New Category
                </Button>
              </motion.div>

              {/* Content Section with Glassmorphism */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className={cn(
                  PREMIUM_ROUNDING,
                  "border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-2xl shadow-zinc-200/50 dark:shadow-none overflow-hidden"
                )}
              >
                <div className="p-1 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent" />
                <div className="p-6">
                  {categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="h-20 w-20 rounded-3xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6">
                        <Package className="h-10 w-10 text-zinc-400" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-2">Zero Registry Nodes</h3>
                      <p className="max-w-xs text-sm font-medium text-zinc-500 uppercase tracking-tighter leading-tight">
                        No item categories detected in the central archive. Initial setup required.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setOpenCreateDialog(true)}
                        className="mt-8 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-widest text-[10px]"
                      >
                        Induct New Category
                      </Button>
                    </div>
                  ) : (
                    <DataTable data={categories} />
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Style for custom scrollbar */}
          <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; border: 1px solid transparent; background-clip: padding-box; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
        `}</style>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog Redesigned */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Terminal className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                  Category Induction
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Define new classification parameters for inventory routing
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="py-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {/* Category Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Registry Title</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Induct title..."
                      className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.name}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Class Specification</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter detailed category specifications..."
                      className="pl-10 min-h-[120px] rounded-xl border-zinc-200 dark:border-zinc-800 font-medium focus:ring-orange-500/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Status Select */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Operating Status</Label>
                  <Select
                    value={status}
                    onValueChange={(v: "active" | "inactive") => setStatus(v)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold focus:ring-orange-500/20 transition-all">
                      <SelectValue placeholder="Identify Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="font-bold rounded-lg m-1">ACTIVE NODE</SelectItem>
                      <SelectItem value="inactive" className="font-bold rounded-lg m-1">SUSPENDED</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Induction */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400">Visual Identifier</Label>
                  <div className="group relative aspect-square w-32 mx-auto rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden transition-all hover:border-orange-500/50 bg-zinc-50 dark:bg-zinc-900">
                    {imagePreview ? (
                      <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="h-6 w-6 text-zinc-300 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-black uppercase text-zinc-400">Upload Icon</span>
                      </div>
                    )}
                    <Input
                      id="image"
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </div>
                  <p className="text-center text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Recommended: 1:1 Aspect Ratio</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
              <Info className="h-4 w-4 text-orange-500 shrink-0" />
              <p className="text-[10px] font-bold text-zinc-500 uppercase leading-snug">
                Confirming induction will distribute this classification node across all inventory management buffers.
              </p>
            </div>

            <DialogFooter className="gap-3 sm:gap-0 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setOpenCreateDialog(false);
                  resetForm();
                }}
                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
              >
                Abort
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-zinc-200/50 dark:shadow-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 border-2 border-t-transparent border-zinc-500 animate-spin rounded-full" />
                    Synchronizing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    Finalize Induction
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
