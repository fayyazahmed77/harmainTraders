"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Link } from "@inertiajs/react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  Info,
  Code,
  Type,
  Layout
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

interface Props {
  template: EmailTemplate;
}

const breadcrumbs = [
  { title: "Settings", href: "#" },
  { title: "Templates", href: "/admin/settings/templates" },
  { title: "Edit Template", href: "#" },
];

export default function EditTemplate({ template }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    subject: template.subject,
    content: template.content,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/settings/templates/${template.id}`, {
      onSuccess: () => toast.success("Template updated successfully!"),
      onError: () => toast.error("Failed to update template."),
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/settings/templates">
                <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0 border-zinc-200 dark:border-zinc-800">
                  <ArrowLeft size={14} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Edit Template</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{template.name} ({template.slug})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href={`/admin/settings/templates/${template.id}/preview`}>
                <Button variant="outline" className="font-bold border-zinc-200 dark:border-zinc-800">Preview</Button>
              </Link>
              <Button 
                onClick={handleSubmit} 
                disabled={processing}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 shadow-lg shadow-orange-500/20"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Type size={12} /> Email Subject
                    </Label>
                    <Input 
                      value={data.subject} 
                      onChange={e => setData('subject', e.target.value)} 
                      placeholder="Enter email subject"
                      className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 h-12 font-bold"
                    />
                    {errors.subject && <p className="text-[10px] text-rose-500 font-bold">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Code size={12} /> Content (Markdown / HTML)
                    </Label>
                    <Textarea 
                      value={data.content} 
                      onChange={e => setData('content', e.target.value)} 
                      placeholder="Write your email content here..."
                      className="min-h-[500px] bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 font-mono text-sm leading-relaxed custom-scrollbar p-6"
                    />
                    {errors.content && <p className="text-[10px] text-rose-500 font-bold">{errors.content}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                    <Info size={16} className="text-orange-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Available Variables</h3>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                    Use these tags in your subject or content. They will be replaced with actual data when the email is sent.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {template.variables?.map((variable) => (
                      <code key={variable} className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded text-[11px] font-bold border border-zinc-300 dark:border-zinc-700">
                        {`{{${variable}}}`}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                    <Layout size={16} className="text-orange-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Editor Tips</h3>
                  </div>
                  <ul className="text-xs space-y-3 text-zinc-500 dark:text-zinc-400">
                    <li className="flex gap-2">
                      <span className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                      Use <strong>Markdown</strong> for headers, lists, and bold text.
                    </li>
                    <li className="flex gap-2">
                      <span className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                      Laravel components like <code>&lt;x-mail::button&gt;</code> are supported.
                    </li>
                    <li className="flex gap-2">
                      <span className="h-1.5 w-1.5 bg-orange-500 rounded-full mt-1.5 shrink-0" />
                      Logo and footer are automatically added from Site Settings.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
