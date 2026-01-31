"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/itemcategory/DataTable";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Item Categories", href: "/item-categories" },
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

interface IndexProps {
  categories: ItemCategory[];
}

export default function Index({ categories }: IndexProps) {
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

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      name,
      description,
      status,
    };

    const formData = new FormData();
    Object.keys(payload).forEach((key) => {
      formData.append(key, (payload as any)[key]);
    });

    if (image) {
      formData.append("image", image);
    }

    router.post("/item-categories", formData, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setDescription("");
        setStatus("active");
        setImage(null);
      },
      forceFormData: true,
    });
  };

  const canCreate =
    Array.isArray(permissions) &&
    permissions.includes("create item_categories");

  return (
    <>
      <Head title="Item Categories" />

      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">Item Categories</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your product categories here.
                </p>
              </div>

              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                // disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Category
              </Button>
            </div>

            {categories.length === 0 ? (
              <div>No categories found.</div>
            ) : (
              <DataTable data={categories} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Item Category</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new category.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>

            <div className="grid gap-2 mt-4">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="grid gap-2 mt-4">
              <Label>Status</Label>
              <Select
                defaultValue="active"
                onValueChange={(v: "active" | "inactive") => setStatus(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 mt-4">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImage(e.target.files ? e.target.files[0] : null)
                }
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-sky-500">
                Add Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
