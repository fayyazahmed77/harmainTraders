"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { 
  Mail, 
  Edit3, 
  Eye, 
  ChevronRight,
  FileText,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  subject: string;
  updated_at: string;
}

interface Props {
  templates: EmailTemplate[];
}

const breadcrumbs = [
  { title: "Settings", href: "#" },
  { title: "Email Templates", href: "/admin/settings/templates" },
];

export default function TemplateIndex({ templates }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
          
          <div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Email Templates</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage and customize all system-generated email communications.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="group overflow-hidden border-zinc-200 dark:border-zinc-800 hover:border-orange-500 transition-all shadow-sm hover:shadow-md">
                <CardContent className="p-0">
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                        <Mail size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800">
                        {template.slug}
                      </span>
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-orange-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1 italic">
                      Sub: {template.subject}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <Clock size={10} />
                      Updated {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/settings/templates/${template.id}/preview`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-zinc-800 shadow-none border-none">
                          <Eye size={14} className="text-zinc-400 group-hover:text-zinc-600" />
                        </Button>
                      </Link>
                      <Link href={`/admin/settings/templates/${template.id}/edit`}>
                        <Button size="sm" className="h-8 bg-zinc-900 dark:bg-zinc-800 hover:bg-orange-600 text-white font-bold border-none">
                          <Edit3 size={14} className="mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
