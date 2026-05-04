"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Search, 
  User, 
  Activity, 
  Eye, 
  Clock,
  ArrowRight,
  Monitor
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: number;
  user: { name: string } | null;
  action: string;
  module: string;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface Props {
  logs: {
    data: ActivityLog[];
    links: any;
    current_page: number;
    last_page: number;
  };
  filters: any;
  modules: string[];
  actions: string[];
}

const breadcrumbs = [
  { title: "Administration", href: "#" },
  { title: "Activity Logs", href: "/admin/activity-logs" },
];

export default function ActivityLogIndex({ logs, modules, actions }: Props) {
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created': return 'bg-emerald-500/10 text-emerald-600';
      case 'updated': return 'bg-blue-500/10 text-blue-600';
      case 'deleted': return 'bg-rose-500/10 text-rose-600';
      default: return 'bg-zinc-500/10 text-zinc-600';
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Activity Logs</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Audit trail of all administrative actions and system modifications.</p>
            </div>
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-600 border border-orange-500/20">
              <History size={24} />
            </div>
          </div>

          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Timestamp</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Admin</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Module</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Description</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest px-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.data.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          <User size={12} className="text-zinc-500" />
                        </div>
                        <span className="text-xs font-bold">{log.user?.name || 'System'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        getActionColor(log.action)
                      )}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-zinc-500">{log.module}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">{log.description}</span>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedLog(log)}
                            className="h-8 w-8 p-0 hover:bg-white dark:hover:bg-zinc-800 shadow-none"
                          >
                            <Eye size={14} className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Activity size={18} className="text-orange-500" />
                              Activity Details
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedLog && (
                            <div className="space-y-6 pt-4">
                              <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Admin</p>
                                  <p className="text-sm font-bold">{selectedLog.user?.name || 'System'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Timestamp</p>
                                  <p className="text-sm font-bold">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">IP Address</p>
                                  <p className="text-xs font-mono">{selectedLog.ip_address}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Action</p>
                                  <span className={cn(
                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                    getActionColor(selectedLog.action)
                                  )}>
                                    {selectedLog.action}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Monitor size={14} className="text-zinc-400" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">User Agent</p>
                                </div>
                                <p className="text-[11px] text-zinc-500 leading-relaxed font-mono p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                  {selectedLog.user_agent}
                                </p>
                              </div>

                              {(selectedLog.old_values || selectedLog.new_values) && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                    <Clock size={14} className="text-orange-500" />
                                    <h4 className="text-[10px] font-black uppercase tracking-widest">Changes Captured</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black uppercase text-rose-500">Before</p>
                                      <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg overflow-auto max-h-40 custom-scrollbar">
                                        <pre className="text-[10px] font-mono text-rose-700 leading-relaxed">
                                          {JSON.stringify(selectedLog.old_values, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black uppercase text-emerald-500">After</p>
                                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-lg overflow-auto max-h-40 custom-scrollbar">
                                        <pre className="text-[10px] font-mono text-emerald-700 leading-relaxed">
                                          {JSON.stringify(selectedLog.new_values, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {logs.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {/* Simple Pagination Placeholder */}
              <p className="text-xs text-zinc-500">Page {logs.current_page} of {logs.last_page}</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
