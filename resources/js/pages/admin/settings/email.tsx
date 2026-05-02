"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { 
  Mail, 
  Settings, 
  Image as ImageIcon, 
  Globe, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  ShieldCheck,
  Server,
  Lock,
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteSetting {
  company_name: string;
  logo_path?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  mail_host?: string;
  mail_port?: string;
  mail_username?: string;
  mail_password?: string;
  mail_encryption?: string;
  mail_from_address?: string;
  mail_from_name?: string;
}

interface Props {
  settings: SiteSetting;
}

const breadcrumbs = [
  { title: "Settings", href: "#" },
  { title: "Email Configuration", href: "/admin/settings/email" },
];

const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-6">
    <Icon size={18} className="text-orange-500" />
    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">{title}</h3>
  </div>
);

export default function EmailSettings({ settings }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    company_name: settings.company_name || "",
    contact_email: settings.contact_email || "",
    contact_phone: settings.contact_phone || "",
    address: settings.address || "",
    facebook_url: settings.facebook_url || "",
    twitter_url: settings.twitter_url || "",
    linkedin_url: settings.linkedin_url || "",
    instagram_url: settings.instagram_url || "",
    mail_host: settings.mail_host || "",
    mail_port: settings.mail_port || "",
    mail_username: settings.mail_username || "",
    mail_password: settings.mail_password || "",
    mail_encryption: settings.mail_encryption || "",
    mail_from_address: settings.mail_from_address || "",
    mail_from_name: settings.mail_from_name || "",
    logo: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.settings.email.update'), {
      forceFormData: true,
      onSuccess: () => toast.success("Settings updated successfully!"),
      onError: () => toast.error("Failed to update settings. Please check the form."),
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Email Configuration</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your SMTP settings and global email branding.</p>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={processing}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6"
            >
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: SMTP SETTINGS */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6">
                  <SectionTitle icon={Server} title="SMTP Configuration" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Mail Host</Label>
                      <Input 
                        value={data.mail_host} 
                        onChange={e => setData('mail_host', e.target.value)} 
                        placeholder="smtp.mailtrap.io"
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Mail Port</Label>
                      <Input 
                        value={data.mail_port} 
                        onChange={e => setData('mail_port', e.target.value)} 
                        placeholder="2525"
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Username</Label>
                      <Input 
                        value={data.mail_username} 
                        onChange={e => setData('mail_username', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Password</Label>
                      <div className="relative">
                        <Input 
                          type="password"
                          value={data.mail_password} 
                          onChange={e => setData('mail_password', e.target.value)} 
                          className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 pr-10"
                        />
                        <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Encryption</Label>
                      <Input 
                        value={data.mail_encryption} 
                        onChange={e => setData('mail_encryption', e.target.value)} 
                        placeholder="tls / ssl"
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">From Address</Label>
                      <Input 
                        value={data.mail_from_address} 
                        onChange={e => setData('mail_from_address', e.target.value)} 
                        placeholder="noreply@harmaintraders.com"
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">From Name</Label>
                      <Input 
                        value={data.mail_from_name} 
                        onChange={e => setData('mail_from_name', e.target.value)} 
                        placeholder="Harmain Traders"
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6">
                  <SectionTitle icon={Globe} title="Social Media Links" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Facebook size={12} className="text-blue-600" /> Facebook URL
                      </Label>
                      <Input 
                        value={data.facebook_url} 
                        onChange={e => setData('facebook_url', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Twitter size={12} className="text-sky-500" /> Twitter URL
                      </Label>
                      <Input 
                        value={data.twitter_url} 
                        onChange={e => setData('twitter_url', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Linkedin size={12} className="text-blue-700" /> LinkedIn URL
                      </Label>
                      <Input 
                        value={data.linkedin_url} 
                        onChange={e => setData('linkedin_url', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Instagram size={12} className="text-pink-600" /> Instagram URL
                      </Label>
                      <Input 
                        value={data.instagram_url} 
                        onChange={e => setData('instagram_url', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN: BRANDING & CONTACT */}
            <div className="space-y-6">
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6">
                  <SectionTitle icon={ImageIcon} title="Branding" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Company Logo</Label>
                      <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950">
                        {settings.logo_path ? (
                          <img src={`/${settings.logo_path}`} alt="Logo" className="max-h-20 object-contain" />
                        ) : (
                          <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-900 rounded flex items-center justify-center text-zinc-400">
                            <ImageIcon size={32} />
                          </div>
                        )}
                        <Input 
                          type="file" 
                          onChange={e => setData('logo', e.target.files?.[0] || null)}
                          className="text-xs file:bg-zinc-200 dark:file:bg-zinc-800 file:border-none file:px-2 file:py-1 file:rounded file:text-[10px] file:font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-zinc-500">Company Name</Label>
                      <Input 
                        value={data.company_name} 
                        onChange={e => setData('company_name', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 font-bold"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardContent className="pt-6">
                  <SectionTitle icon={MapPin} title="Contact Info" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Mail size={12} /> Contact Email
                      </Label>
                      <Input 
                        value={data.contact_email} 
                        onChange={e => setData('contact_email', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <Phone size={12} /> Contact Phone
                      </Label>
                      <Input 
                        value={data.contact_phone} 
                        onChange={e => setData('contact_phone', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500">
                        <MapPin size={12} /> Office Address
                      </Label>
                      <Input 
                        value={data.address} 
                        onChange={e => setData('address', e.target.value)} 
                        className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
