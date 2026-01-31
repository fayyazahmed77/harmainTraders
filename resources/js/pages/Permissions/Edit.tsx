import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

type Permission = {
  id: number;
  name: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Create Permission',
    href: '/permissions/create',
  },
];

export default function Edit({ permission }: { permission: Permission }) {
  const [name, setName] = useState(permission.name);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.put(`/permissions/${permission.id}`, { name });
  };

  return (
    <>
      <Head title="Update" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Edit Permission</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Permission Name</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Update</button>
            </form>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
