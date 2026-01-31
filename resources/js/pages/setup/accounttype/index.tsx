"use client";

import { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/accounttype/DataTable";
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
import { Textarea } from "@/components/ui/textarea";
import useToastFromQuery from "@/hooks/useToastFromQuery";


const breadcrumbs: BreadcrumbItem[] = [
  { title: "Account Types", href: "/account-types" },
];

interface AccountType {
  id: number;
  name: string;
  description: string;
  created_at: string;
  created_by: number;
  created_by_name?: string;
}




interface IndexProps {
  accountTypes: AccountType[];
}

export default function Index({ accountTypes }: IndexProps) {
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
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      description: description,
    };

    router.post("/account-types", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setName("");
        setDescription("");
        
      },
    });
  };

  const canCreate = Array.isArray(permissions) && permissions.includes("create accounttype");
console.log(canCreate);
  return (
    <>
      
      <Head title="Account Type" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Account Types</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your Account Types here.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                // disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Account Type
              </Button>
            </div>


            {accountTypes.length === 0 ? (
              <div>No account types found.</div>
            ) : (
              <>
                <DataTable data={accountTypes} />

              </>
            )}

          </div>

        </SidebarInset>
      </SidebarProvider>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account Type</DialogTitle>
            <DialogDescription>
              Fill out the form to add a new account type.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter account type name"
              />
            </div>
            <div className="grid gap-2 mt-4 mb-2">
              <Label htmlFor="code">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter account type description"
              />
            </div>
            

            <DialogFooter>
              <Button type="submit" variant="outline" className="bg-sky-500">
                Add Account Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
