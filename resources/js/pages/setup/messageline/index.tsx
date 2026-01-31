"use client";

import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/setup/messageline/DataTable";
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
import { Select } from "@/components/ui/select";
import useToastFromQuery from "@/hooks/useToastFromQuery";

const breadcrumbs: BreadcrumbItem[] = [{ title: "Message Lines", href: "/message-lines" }];

interface MessageLine {
  id: number;
  messageline: string;
  status: string;
  created_by_name?: string;
  created_at: string;
}

interface IndexProps {
  messagesline: MessageLine[];
}

export default function Index({ messagesline }: IndexProps) {
  useToastFromQuery();

  const pageProps = usePage().props as unknown as {
    auth: { user: any; permissions: string[] };
    errors: Record<string, string>;
  };

  const permissions = pageProps.auth.permissions;
  const canCreate =
    Array.isArray(permissions) && permissions.includes("create message");

  // Form states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [messageLine, setMessageLine] = useState("");
  const [status, setStatus] = useState("active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageLine.trim()) return;

    const payload = {
      messageline: messageLine,
      status,
    };

    router.post("/message-lines", payload, {
      onSuccess: () => {
        setOpenCreateDialog(false);
        setMessageLine("");
        setStatus("active");
      },
    });
  };

  return (
    <>
      <Head title="Message Lines" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">All Message Lines</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all system message lines.
                </p>
              </div>
              <Button
                className="bg-sky-500 mb-3"
                onClick={() => setOpenCreateDialog(true)}
                disabled={!canCreate}
              >
                <Plus className="mr-2" /> Add Message Line
              </Button>
            </div>

            {messagesline.length === 0 ? (
              <div>No message lines found.</div>
            ) : (
              <DataTable messagesline={messagesline} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Create Message Line Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Message Line</DialogTitle>
            <DialogDescription>
              Enter the message text and select its status.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Message Line */}
            <div className="grid gap-2 mb-4">
              <Label htmlFor="messageline">Message Line</Label>
              <Input
                id="messageline"
                value={messageLine}
                onChange={(e) => setMessageLine(e.target.value)}
                placeholder="Enter message line text"
                required
              />
            </div>

            {/* Status */}
            <div className="grid gap-2 mb-4">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="border rounded p-2"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-sky-500">
                Add Message Line
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
