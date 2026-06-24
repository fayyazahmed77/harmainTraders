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
import { Switch } from "@/components/ui/switch";
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
  Layers,
  Radio
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
  broadcast_driver?: 'reverb' | 'pusher';
  pusher_app_id?: string;
  pusher_app_key?: string;
  pusher_app_secret?: string;
  pusher_app_cluster?: string;
  two_factor_enabled?: boolean;
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
    broadcast_driver: settings.broadcast_driver || "reverb",
    pusher_app_id: settings.pusher_app_id || "",
    pusher_app_key: settings.pusher_app_key || "",
    pusher_app_secret: settings.pusher_app_secret || "",
    pusher_app_cluster: settings.pusher_app_cluster || "",
    two_factor_enabled: settings.two_factor_enabled !== undefined ? settings.two_factor_enabled : true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<"broadcast" | "notifications" | "security">("broadcast");

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
              onClick={() => setActiveTab("broadcast")}
              className={cn(
                "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer",
                activeTab === "broadcast"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Radio size={14} />
                Broadcasting Setup
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
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "px-5 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer",
                activeTab === "security"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              )}
            >
              <div className="flex items-center gap-2">
                <Shield size={14} />
                Security Setup
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === "broadcast" && (
              <div className="space-y-6">
                {/* Premium Broadcaster Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setData('broadcast_driver', 'reverb')}
                    className={cn(
                      "p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 shadow-sm",
                      data.broadcast_driver === 'reverb' 
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg",
                      data.broadcast_driver === 'reverb' ? "bg-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                    )}>
                      <Server size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">Laravel Reverb</h3>
                      <p className="text-xs text-zinc-500 mt-1">Local self-hosted WebSockets. High speed, no limits, requires running daemon.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setData('broadcast_driver', 'pusher')}
                    className={cn(
                      "p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 shadow-sm",
                      data.broadcast_driver === 'pusher' 
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10" 
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className={cn(
                      "p-3 rounded-lg",
                      data.broadcast_driver === 'pusher' ? "bg-orange-500 text-white" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                    )}>
                      <Radio size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100">Pusher</h3>
                      <p className="text-xs text-zinc-500 mt-1">Managed real-time cloud service. Stable, reliable, ideal for shared cPanel hosting.</p>
                    </div>
                  </div>
                </div>

                {data.broadcast_driver === 'pusher' ? (
                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950/20">
                    <CardHeader>
                      <CardTitle className="text-md font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Radio size={16} className="text-orange-500" />
                        Pusher Credentials Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-zinc-500">Pusher App ID</Label>
                          <Input 
                            value={data.pusher_app_id} 
                            onChange={e => setData('pusher_app_id', e.target.value)} 
                            placeholder="e.g. 2161043"
                            className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-zinc-500">Pusher Key</Label>
                          <Input 
                            value={data.pusher_app_key} 
                            onChange={e => setData('pusher_app_key', e.target.value)} 
                            placeholder="e.g. b6ceba21998c85c46523"
                            className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-zinc-500">Pusher Secret</Label>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              value={data.pusher_app_secret} 
                              onChange={e => setData('pusher_app_secret', e.target.value)} 
                              placeholder="e.g. c3c9271b1d091a3b614d"
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
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase text-zinc-500">Pusher Cluster</Label>
                          <Input 
                            value={data.pusher_app_cluster} 
                            onChange={e => setData('pusher_app_cluster', e.target.value)} 
                            placeholder="e.g. ap1"
                            className="bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950/20">
                    <CardHeader>
                      <CardTitle className="text-md font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Server size={16} className="text-orange-500" />
                        Laravel Reverb Server Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-sm text-zinc-500">
                        <p className="font-bold text-zinc-900 dark:text-zinc-300 mb-2">Reverb Server is Active</p>
                        <p className="text-xs">Laravel Reverb utilizes the settings configured in the system environment file (.env). To customize ports or hostnames, please configure them inside the environment parameters directly.</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono bg-zinc-100 dark:bg-zinc-950 p-3 rounded border border-zinc-200 dark:border-zinc-850">
                          <div>Host: <span className="text-orange-500">localhost</span></div>
                          <div>Port: <span className="text-orange-500">8080</span></div>
                          <div>Scheme: <span className="text-orange-500">http</span></div>
                          <div>Broadcaster: <span className="text-orange-500">reverb</span></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
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

            {activeTab === "security" && (
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm bg-zinc-950/20">
                <CardHeader>
                  <CardTitle className="text-md font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Shield size={16} className="text-orange-500" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="flex items-center justify-between p-5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700">
                    <div className="space-y-1">
                      <Label className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
                        Two-Factor Authentication (2FA)
                      </Label>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-lg leading-relaxed">
                        Enforce a dynamic security verification check. When enabled, users will receive a secure authorization code via email upon login.
                      </p>
                    </div>
                    <div className="flex items-center justify-center p-2">
                      <Switch
                        checked={data.two_factor_enabled}
                        onCheckedChange={(checked) => setData("two_factor_enabled", checked)}
                      />
                    </div>
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
