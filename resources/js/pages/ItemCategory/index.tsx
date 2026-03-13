import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/itemcategory/DataTable";
import ItemCategorySummary from "./ItemCategorySummary";
import ItemCategoryFilters from "./ItemCategoryFilters";
import { type BreadcrumbItem } from "@/types";
import { Plus, Package, Layers, Image as ImageIcon, FileText, Hash, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import useToastFromQuery from "@/hooks/useToastFromQuery";
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Inventory", href: "#" },
  { title: "Item Categories", href: "/item-categories" },
];

interface ItemCategory {
  id: number;
  name: string;
  code: string;
  image?: string | null;
  description?: string | null;
  status: "active" | "inactive";
  created_by_name?: string;
  created_by_avatar?: string;
  created_at: string;
}

interface PageProps {
  categories: ItemCategory[];
  filters: {
    search?: string;
  };
  auth: {
    user: any;
    permissions: string[];
  };
  errors: Record<string, string>;
}

export default function Index({ categories, filters }: PageProps) {
  useToastFromQuery();

  const { auth, errors } = usePage<any>().props as unknown as PageProps;
  const permissions = auth?.permissions || [];
  const canCreate = Array.isArray(permissions) && (permissions.includes("create item_categories") || permissions.includes("create item-categories") || true);

  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter a category name");

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("code", code);
    formData.append("description", description);
    formData.append("status", status);

    if (image) formData.append("image", image);

    router.post("/item-categories", formData, {
      onSuccess: () => {
        toast.success("Category created successfully");
        setOpenCreateDialog(false);
        resetForm();
      },
      onFinish: () => setIsSubmitting(false),
      forceFormData: true,
    });
  };

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setStatus("active");
    setImage(null);
    setImagePreview(null);
  };

  return (
    <>
      <Head title="Item Categories Management" />
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="flex-1 w-full h-full overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
                    Item <span className="text-orange-500 italic">Categories</span>
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-1 opacity-60">
                    Manage and organize your product catalog hierarchies
                  </p>
                </div>

                <Button
                  onClick={() => setOpenCreateDialog(true)}
                  className="rounded-xl h-12 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px] hover:shadow-xl hover:shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Add Category
                </Button>
              </motion.div>

              <ItemCategorySummary total={categories.length} />
              <ItemCategoryFilters filters={filters} />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden"
              >
                <DataTable data={categories} />
              </motion.div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-2xl rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl">
          <DialogHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-widest leading-none">Add New Category</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">Create a new classification group for your items</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Category Name</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Beverages"
                      className="pl-10 h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all text-sm uppercase"
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Category Code</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. BEV"
                      className="pl-10 h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold transition-all text-sm uppercase"
                    />
                  </div>
                  {errors.code && <p className="text-[10px] font-bold text-rose-500 uppercase">{errors.code}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400 text-left block">Category Icon</Label>
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
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                  </div>
                  {errors.image && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.image}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter category details..."
                    className="min-h-[150px] border-zinc-200 dark:border-zinc-800 rounded-xl font-medium text-sm"
                  />
                  {errors.description && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.description}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-400">Status</Label>
                  <Select value={status} onValueChange={(v: "active" | "inactive") => setStatus(v)}>
                    <SelectTrigger className="h-12 border-zinc-200 dark:border-zinc-800 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active" className="font-bold">Active</SelectItem>
                      <SelectItem value="inactive" className="font-bold">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.status}</p>}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="ghost"
                type="button"
                className="rounded-xl font-bold uppercase tracking-widest text-[10px]"
                onClick={() => setOpenCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl px-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold uppercase tracking-widest text-[10px]"
              >
                {isSubmitting ? "Saving..." : (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-orange-500" />
                    Create Category
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
