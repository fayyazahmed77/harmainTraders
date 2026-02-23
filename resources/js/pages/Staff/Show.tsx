import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import {
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Globe,
    Linkedin,
    Facebook,
    Instagram,
    Twitter,
    ExternalLink,
    Edit,
    Calendar,
    Shield,
    Fingerprint,
    Activity,
    User as UserIcon,
    ChevronRight,
    Star,
    Zap,
    Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/Heading";

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    job_title: string;
    department: string;
    bio: string;
    country: string;
    status: string;
    linkedin_url: string;
    facebook_url: string;
    instagram_url: string;
    twitter_url: string;
    portfolio_url: string;
    image: string;
    roles: Role[];
    created_at: string;
}

interface Props {
    staff: User;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "Dossier", href: "#" },
];

const PREMIUM_ROUNDING = "rounded-2xl";

const InfoBadge = ({ icon: Icon, label, value, color = "orange" }: { icon: any, label: string, value: string, color?: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 transition-all hover:border-orange-500/30 group">
        <div className={cn(
            "p-2.5 rounded-lg transition-transform group-hover:scale-110",
            color === "orange" ? "bg-orange-100 dark:bg-orange-500/10 text-orange-600" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
        )}>
            <Icon size={18} />
        </div>
        <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-mono">{label}</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value || "NOT_DEFINED"}</p>
        </div>
    </div>
);

const SocialLink = ({ icon: Icon, label, href }: { icon: any, label: string, href?: string }) => {
    if (!href) return null;
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/5 transition-all group"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    <Icon size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase font-mono">
                    {label}
                </span>
            </div>
            <ExternalLink size={14} className="text-zinc-300 group-hover:text-orange-500 transition-colors" />
        </a>
    );
};

export default function StaffShow({ staff }: Props) {
    return (
        <SidebarProvider>
            <Head title={`Personnel Dossier: ${staff.name}`} />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                        {/* Header Section */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-6"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                    <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden shadow-2xl">
                                        {staff.image ? (
                                            <img
                                                src={`/storage/${staff.image}`}
                                                alt={staff.name}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <UserIcon size={48} className="text-zinc-300 dark:text-zinc-700" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-lg">
                                        <Activity size={14} className="text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{staff.name}</h1>
                                        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                                            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest font-mono">LVL-MAX</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                            <Briefcase size={14} />
                                            <span className="text-xs font-bold uppercase tracking-widest">{staff.job_title || "OPERATIVE"}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                                            <Globe size={14} />
                                            <span className="text-xs font-bold uppercase tracking-widest">{staff.department || "CENTRAL_UNIT"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button asChild className="h-12 px-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 shadow-xl">
                                    <Link href={`/staff/${staff.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" /> Reconfigure Profile
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-12 gap-8">
                            {/* Left Panel: Primary Intel */}
                            <div className="col-span-12 lg:col-span-8 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InfoBadge icon={Mail} label="Comms Vector" value={staff.email} />
                                        <InfoBadge icon={Phone} label="Terminal Uplink" value={staff.phone} />
                                        <InfoBadge icon={MapPin} label="Deployment Zone" value={staff.country} />
                                        <InfoBadge icon={Calendar} label="Induction Date" value={new Date(staff.created_at).toLocaleDateString()} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-6")}>
                                        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600">
                                                    <Fingerprint size={18} />
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Tactical Summary</h2>
                                                    <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Personnel psychological & functional profile</p>
                                                </div>
                                            </div>
                                            <Cpu size={24} className="text-zinc-100 dark:text-zinc-800" />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-orange-500/20 rounded-full"></div>
                                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium italic pl-4">
                                                {staff.bio || "No professional dossier data available for this operative. System record remains encrypted."}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 pt-4">
                                            <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Loyalty</p>
                                                <div className="flex justify-center gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} className="fill-orange-500 text-orange-500" />)}
                                                </div>
                                            </div>
                                            <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Efficiency</p>
                                                <div className="flex justify-center gap-0.5 text-orange-500">
                                                    <Zap size={10} className="fill-orange-500" />
                                                    <Zap size={10} className="fill-orange-500" />
                                                    <Zap size={10} className="fill-orange-500" />
                                                    <Zap size={10} className="fill-zinc-300 dark:fill-zinc-700 text-zinc-300 dark:text-zinc-700" />
                                                    <Zap size={10} className="fill-zinc-300 dark:fill-zinc-700 text-zinc-300 dark:text-zinc-700" />
                                                </div>
                                            </div>
                                            <div className="text-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Reliability</p>
                                                <span className="text-xs font-black text-orange-600 font-mono">98.4%</span>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Right Panel: Security & Social */}
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-6")}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                                <Shield size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Security Clearance</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Active privilege protocols</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {staff.roles && staff.roles.length > 0 ? (
                                                staff.roles.map(role => (
                                                    <div key={role.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.03] border border-emerald-500/10 group hover:border-emerald-500/30 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">{role.name}</span>
                                                        </div>
                                                        <ChevronRight size={14} className="text-emerald-300 transition-transform group-hover:translate-x-1" />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-center">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">No Authorized Roles</span>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-6")}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                                <Globe size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Web Presence</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">External communication matrix</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <SocialLink icon={Linkedin} label="LinkedIn" href={staff.linkedin_url} />
                                            <SocialLink icon={Facebook} label="Facebook" href={staff.facebook_url} />
                                            <SocialLink icon={Instagram} label="Instagram" href={staff.instagram_url} />
                                            <SocialLink icon={Twitter} label="X (Twitter)" href={staff.twitter_url} />
                                            <SocialLink icon={ExternalLink} label="Portfolio" href={staff.portfolio_url} />

                                            {![staff.linkedin_url, staff.facebook_url, staff.instagram_url, staff.twitter_url, staff.portfolio_url].some(url => !!url) && (
                                                <div className="p-8 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-2xl">
                                                    <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase tracking-[0.2em]">No Active Nodes</p>
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>

                                <div className="p-6 rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700">
                                        <Shield size={120} />
                                    </div>
                                    <h3 className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Zap size={14} /> Security Notice
                                    </h3>
                                    <p className="text-[10px] leading-relaxed font-bold opacity-90 uppercase tracking-tight">
                                        This dossier contains sensitive personnel data. Unauthorized access or duplication is a level 4 security violation.
                                    </p>
                                </div>
                            </div>
                        </div>
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
