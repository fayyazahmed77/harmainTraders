"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "@inertiajs/react";
import { toast } from "sonner";
import { route } from 'ziggy-js';
import { 
  Mail, 
  Settings, 
  Server, 
  Lock, 
  Save, 
  Eye, 
  EyeOff,
  Bell,
  Shield,
  Clock,
  Package,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteSetting {
  company_name?: string;
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
  notification_settings?: Record<string, string[]>;
}

interface Props {
  settings: SiteSetting;
}

const breadcrumbs = [
  { title: "Settings", href: "#" },
  { title: "System Configuration", href: "/admin/settings/configuration" },
];

export default function SystemConfiguration({ settings }: Props) {
  // Initialize default channels if not set
  const initialNotificationSettings = settings.notification_settings || {
    workflow: ["database", "broadcast"],
    security: ["database", "broadcast"],
    sla: ["database", "broadcast"],
    inventory: ["database", "broadcast"],
  };

  const { data, setData, post, processing } = useForm({
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
    notification_settings: initialNotificationSettings,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "notifications">("email");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('admin.settings.email.update'), {
      onSuccess: () => toast.success("Configuration updated successfully!"),
      onError: () => toast.error("Failed to update configuration. Please check the form."),
    });
  };

  const handleChannelToggle = (category: string, channel: string, checked: boolean) => {
    const currentChannels = data.notification_settings[category] || [];
    let updatedChannels: string[];

    if (checked) {
      updatedChannels = [...currentChannels, channel];
    } else {
      updatedChannels = currentChannels.filter(c => c !== channel);
    }

    setData("notification_settings", {
      ...data.notification_settings,
      [category]: updatedChannels,
    });
  };

  const categories = [
    { id: "workflow", label: "Workflow & Access Requests", icon: Layers, desc: "Triggers on new privilege requests, approval signoffs, and delegation tasks." },
    { id: "security", label: "Security & Access Alerts", icon: Shield, desc: "Triggers on suspicious logins, signature replay attempts, and key overrides." },
    { id: "sla", label: "SLA & Escalation Warnings", icon: Clock, desc: "Triggers when requests approach expiration thresholds without supervisor resolution." },
    { id: "inventory", label: "Inventory & stock alerts", icon: Package, desc: "Triggers when supply levels fall below threshold values." },
  ];

  const channels = [
    { id: "database", label: "In-App Database" },
    { id: "broadcast", label: "Real-time Browser Bell" },
    { id: "email", label: "Email Dispatch" },
    { id: "sms", label: "SMS (Twilio Log Stub)" },
  ];

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">System Configuration</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage global SMTP and notification dispatch configurations.</p>
            </div>
            <Button 
              onClick={handleSubmit} 
              disabled={processing}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 shadow-md transition-all duration-200 cursor-pointer"
            >
              <Save size={16} className="mr-2" />
              Save Configuration
            </Button>
          </div>

          {/* Premium Navigation Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800">
            <button
              onClick={() => setActiveTab("email")}
              className={cn(
                "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer",
                activeTab === "email"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Server size={14} />
                Email / SMTP Setup
              </div>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer",
                activeTab === "notifications"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Bell size={14} />
                Notification Setup
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === "email" && (
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-md font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Server size={16} className="text-orange-500" />
                    SMTP Server Configuration Table
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 w-1/4">Parameter</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 w-1/3">Description</th>
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500">Value Input</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">Mail Host</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">The IP address or domain hostname of your SMTP mail server.</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_host} 
                              onChange={e => setData('mail_host', e.target.value)} 
                              placeholder="smtp.mailtrap.io"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">Mail Port</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">The port number used to connect to your SMTP provider (e.g. 587, 465).</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_port} 
                              onChange={e => setData('mail_port', e.target.value)} 
                              placeholder="465"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">SMTP Username</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">Username credential needed to authenticate against the SMTP host.</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_username} 
                              onChange={e => setData('mail_username', e.target.value)} 
                              placeholder="user@provider.com"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">SMTP Password</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">Password credential corresponding to the authentication username.</td>
                          <td className="px-6 py-4">
                            <div className="relative max-w-lg">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                value={data.mail_password} 
                                onChange={e => setData('mail_password', e.target.value)} 
                                className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                              >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">Mail Encryption</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">The encryption protocol protecting your SMTP transmission (e.g. tls, ssl).</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_encryption} 
                              onChange={e => setData('mail_encryption', e.target.value)} 
                              placeholder="ssl"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">Sender From Address</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">Global outbound email sender address (e.g. noreply@company.com).</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_from_address} 
                              onChange={e => setData('mail_from_address', e.target.value)} 
                              placeholder="noreply@harmaintraders.com"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 font-bold text-sm text-zinc-900 dark:text-zinc-200">Sender From Name</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">Friendly name displayed as the email sender in user clients.</td>
                          <td className="px-6 py-4">
                            <Input 
                              value={data.mail_from_name} 
                              onChange={e => setData('mail_from_name', e.target.value)} 
                              placeholder="Harmain Traders"
                              className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 max-w-lg"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-md font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Bell size={16} className="text-orange-500" />
                    Global Notification Dispatch Matrix Table
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                          <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 w-1/3">Notification Category</th>
                          {channels.map(channel => (
                            <th key={channel.id} className="px-6 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 text-center">
                              {channel.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {categories.map(cat => {
                          const CategoryIcon = cat.icon;
                          const activeChannels = data.notification_settings[cat.id] || [];

                          return (
                            <tr key={cat.id} className="hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-900 text-orange-500 mt-1">
                                    <CategoryIcon size={16} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm text-zinc-900 dark:text-zinc-200">{cat.label}</p>
                                    <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">{cat.desc}</p>
                                  </div>
                                </div>
                              </td>
                              {channels.map(channel => {
                                const isChecked = activeChannels.includes(channel.id);
                                return (
                                  <td key={channel.id} className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center">
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => 
                                          handleChannelToggle(cat.id, channel.id, !!checked)
                                        }
                                        className="h-5 w-5 border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 rounded cursor-pointer"
                                      />
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
