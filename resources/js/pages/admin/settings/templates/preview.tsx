"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Mail,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
}

interface Props {
  template: EmailTemplate;
  rendered: {
    subject: string;
    content: string;
  };
}

const breadcrumbs = [
  { title: "Settings", href: "#" },
  { title: "Templates", href: "/admin/settings/templates" },
  { title: "Preview", href: "#" },
];

export default function PreviewTemplate({ template, rendered }: Props) {
  const [device, setDevice] = React.useState<'mobile' | 'desktop'>('desktop');

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/admin/settings/templates/${template.id}/edit`}>
                <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800">
                  <ArrowLeft size={14} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Template Preview</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Previewing: {template.name}</p>
              </div>
            </div>
            
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDevice('desktop')}
                className={cn("h-8 px-3 text-xs font-bold", device === 'desktop' && "bg-white dark:bg-zinc-700 shadow-sm")}
              >
                <Monitor size={14} className="mr-2" />
                Desktop
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setDevice('mobile')}
                className={cn("h-8 px-3 text-xs font-bold", device === 'mobile' && "bg-white dark:bg-zinc-700 shadow-sm")}
              >
                <Smartphone size={14} className="mr-2" />
                Mobile
              </Button>
            </div>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 min-h-[800px]">
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100">{rendered.subject}</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">From: System Notifications</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex justify-center p-6 bg-zinc-200/50 dark:bg-zinc-900/50 overflow-auto">
              <div className={cn(
                "bg-white shadow-2xl transition-all duration-500 overflow-hidden rounded-lg",
                device === 'desktop' ? "w-full max-w-[800px]" : "w-[375px]"
              )}>
                {/* Simulated Email Body */}
                <div className="p-8 font-sans">
                  <div className="max-w-[600px] mx-auto whitespace-pre-wrap text-zinc-800 leading-relaxed prose prose-zinc dark:prose-invert">
                    {/* Note: In a real app, we'd use a markdown parser here for the preview */}
                    {rendered.content}
                  </div>
                </div>
                
                {/* Simulated Layout Footer */}
                <div className="bg-zinc-50 p-8 border-t border-zinc-100 text-center">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    This is a preview of the dynamic layout including your Logo & Social Media links.
                  </p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
