import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { MoreHorizontal, Pencil, Plus, Mail, Phone, Shield, User as UserIcon, Calendar, Search, MapPin, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, router, Head } from "@inertiajs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    status: string;
    country?: string;
    created_at: string;
    roles: { id: number; name: string }[];
}

interface Props {
    staff: User[];
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "Registry", href: "#" },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5 font-mono">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

export default function StaffIndex({ staff }: Props) {
    const handleDelete = (id: number) => {
        router.delete(`/staff/${id}`);
    };

    return (
        <SidebarProvider>
            <Head title="Staff Registry" />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                        >
                            <Heading
                                title="Staff Registry"
                                description="Manage system operators, field agents and administrative personnel"
                            />
                            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95">
                                <Link href="/staff/create">
                                    <Plus className="mr-2 h-4 w-4" /> Provision Staff
                                </Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className={cn(PREMIUM_ROUNDING, "overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl")}>
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
                                    <div className="flex items-center gap-4 flex-1 max-w-md">
                                        <div className="relative w-full">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                                            <input
                                                type="text"
                                                placeholder="Decrypt signature or mail hash..."
                                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 transition-all outline-none"
                                            />
                                        </div>
                                        <Button variant="outline" size="icon" className="rounded-xl flex-shrink-0">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">System Active</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30">
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Personnel Identification</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Communication</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Security Clearance</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Protocol Status</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400">Deployment</th>
                                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-zinc-400 text-center">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            <AnimatePresence mode="popLayout">
                                                {staff.map((user, index) => (
                                                    <motion.tr
                                                        key={user.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.02] transition-colors"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar className="h-10 w-10 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-105">
                                                                    <AvatarImage src={user.image ? `/storage/${user.image}` : ""} />
                                                                    <AvatarFallback className="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs">
                                                                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">{user.name}</span>
                                                                    <span className="text-[10px] text-zinc-400 font-mono tracking-widest">ID-PROTOCOL: {user.id.toString().padStart(4, '0')}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-0.5">
                                                                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                                                    <Mail className="w-3 h-3 opacity-50 font-bold" />
                                                                    {user.email}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                                                                    <Phone className="w-3 h-3 opacity-50" />
                                                                    {user.phone || "VOID"}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {user.roles.map((role) => (
                                                                    <span key={role.id} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-zinc-700">
                                                                        {role.name}
                                                                    </span>
                                                                ))}
                                                                {user.roles.length === 0 && <span className="text-[10px] text-zinc-400 italic font-mono uppercase tracking-widest">Unassigned</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={cn(
                                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em]",
                                                                user.status === 'active'
                                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                                            )}>
                                                                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", user.status === 'active' ? "bg-emerald-500" : "bg-rose-500")} />
                                                                {user.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                                    <MapPin className="w-3 h-3 text-orange-500" />
                                                                    {user.country || "GLOBAL-OPS"}
                                                                </div>
                                                                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                                                                    INIT: {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-orange-500/10 hover:text-orange-500">
                                                                    <Link href={`/staff/${user.id}/edit`}>
                                                                        <Pencil className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-200 dark:border-zinc-800">
                                                                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-400 p-3">Intelligence Actions</DropdownMenuLabel>
                                                                        <DropdownMenuItem asChild className="rounded-lg m-1 font-bold text-xs uppercase cursor-pointer">
                                                                            <Link href={`/staff/${user.id}`}>View Dossier</Link>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                                                                        <DropdownMenuItem
                                                                            className="rounded-lg m-1 font-bold text-xs uppercase cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                                                                            onClick={() => handleDelete(user.id)}
                                                                        >
                                                                            Terminate Profile
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        Total Personnel Count: {staff.length}
                                    </div>
                                    <div className="flex gap-1.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i === 1 ? "bg-orange-500" : "bg-zinc-300 dark:bg-zinc-700")} />
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>

                <style>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
                `}</style>
            </SidebarInset>
        </SidebarProvider>
    );
}
