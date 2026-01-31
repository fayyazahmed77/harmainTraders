import { Head } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Create Permission',
    href: '/permissions/create',
  },
];

export default function Create() {
  const [cat, setcat] = useState('');
  const [icon, seticon] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.post('/permissions', { cat,icon,name });
  };
  

  return (
    <>
      <Head title="Create" />
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader breadcrumbs={breadcrumbs} />

          <div className="mt-4 px-5">
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Create Permission</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Category Name</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={cat}
                    onChange={(e) => setcat(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Category Icon</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={icon}
                    onChange={(e) => seticon(e.target.value)}
                    required
                  />
                </div>
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
                
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Create
                </button>
              </form>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
