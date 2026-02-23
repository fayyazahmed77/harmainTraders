import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { Camera, ChevronRight, Globe, Linkedin, Facebook, Instagram, Twitter, ExternalLink, Save, Plus, Eye, EyeOff, Shield, User as UserIcon, Briefcase, Mail, Phone, MapPin, Sparkles, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link, router, useForm, Head } from "@inertiajs/react";
import { motion, AnimatePresence } from "framer-motion";
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
}

interface Props {
    staff: User;
    roles: Role[];
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "Configuration", href: "#" },
];

const PREMIUM_ROUNDING = "rounded-xl";

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

export default function StaffEdit({ staff, roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: "PUT",
        name: staff.name,
        email: staff.email,
        phone: staff.phone || "",
        password: "",
        password_confirmation: "",
        country: staff.country || "",
        status: staff.status === "active",
        job_title: staff.job_title || "",
        department: staff.department || "",
        bio: staff.bio || "",
        linkedin_url: staff.linkedin_url || "",
        facebook_url: staff.facebook_url || "",
        instagram_url: staff.instagram_url || "",
        twitter_url: staff.twitter_url || "",
        portfolio_url: staff.portfolio_url || "",
        roles: staff.roles.map(r => r.name),
        image: null as File | null,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/staff/${staff.id}`);
    };

    const handleRoleChange = (roleName: string) => {
        const currentRoles = [...data.roles];
        if (currentRoles.includes(roleName)) {
            setData("roles", currentRoles.filter(r => r !== roleName));
        } else {
            setData("roles", [...currentRoles, roleName]);
        }
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to terminate this staff profile? This action is IRREVERSIBLE.")) {
            router.delete(`/staff/${staff.id}`);
        }
    };

    return (
        <SidebarProvider>
            <Head title={`Update Profile: ${staff.name}`} />
            <AppSidebar variant="inset" />
            <SidebarInset className="bg-zinc-50 dark:bg-zinc-950">
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
                        >
                            <Heading
                                title="Profile Configuration"
                                description={`Modify credentials and authorization levels for ${staff.name}`}
                            />
                            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] font-mono">STAFF-ID: {staff.id.toString().padStart(4, '0')}</span>
                            </div>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-8 pb-20">
                            {/* Left Column: Form Details */}
                            <div className="col-span-12 lg:col-span-8 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-8")}>
                                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                                                <UserIcon size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Core Credentials</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Authentication & Identification Layer</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <TechLabel label="Legal Identity" icon={UserIcon}>
                                                <Input
                                                    placeholder="Full personnel name"
                                                    value={data.name}
                                                    onChange={e => setData("name", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20"
                                                />
                                                {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.name}</p>}
                                            </TechLabel>

                                            <TechLabel label="Primary Comms" icon={Mail}>
                                                <Input
                                                    type="email"
                                                    placeholder="personnel@system.com"
                                                    value={data.email}
                                                    onChange={e => setData("email", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20"
                                                />
                                                {errors.email && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.email}</p>}
                                            </TechLabel>

                                            <TechLabel label="Terminal Access" icon={Phone}>
                                                <Input
                                                    placeholder="+1.000.000.0000"
                                                    value={data.phone}
                                                    onChange={e => setData("phone", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20"
                                                />
                                            </TechLabel>

                                            <TechLabel label="Deployment Zone" icon={MapPin}>
                                                <Select onValueChange={val => setData("country", val)} value={data.country}>
                                                    <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800 w-full">
                                                        <SelectValue placeholder="Select Sector" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                                                        <SelectItem value="United States">United States</SelectItem>
                                                        <SelectItem value="Germany">Germany</SelectItem>
                                                        <SelectItem value="India">India</SelectItem>
                                                        <SelectItem value="Kenya">Kenya</SelectItem>
                                                        <SelectItem value="Iran">Iran</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TechLabel>

                                            <TechLabel label="Rotate Access Key" icon={Shield}>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Leave blank to maintain current"
                                                        value={data.password}
                                                        onChange={e => setData("password", e.target.value)}
                                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 pr-10 focus:ring-orange-500/20"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-orange-500 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="text-[10px] font-bold text-rose-500 uppercase mt-1">{errors.password}</p>}
                                            </TechLabel>

                                            <TechLabel label="Confirm Rotate" icon={Shield}>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Confirm new key"
                                                        value={data.password_confirmation}
                                                        onChange={e => setData("password_confirmation", e.target.value)}
                                                        className="rounded-xl border-zinc-200 dark:border-zinc-800 pr-10 focus:ring-orange-500/20"
                                                    />
                                                </div>
                                            </TechLabel>
                                        </div>

                                        <div className="flex items-center space-x-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors hover:border-emerald-500/30 group">
                                            <Checkbox
                                                id="status"
                                                checked={data.status}
                                                onCheckedChange={checked => setData("status", !!checked)}
                                                className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none"
                                            />
                                            <div className="flex flex-col">
                                                <Label htmlFor="status" className="text-xs font-black uppercase tracking-widest cursor-pointer text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-500 transition-colors">Operational Status</Label>
                                                <p className="text-[10px] text-zinc-400 font-mono">ENABLING THIS ALLOWS SYSTEM AUTHENTICATION</p>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-8")}>
                                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                                                <Briefcase size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Dossier Information</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Professional Background & Functional Context</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <TechLabel label="Designation" icon={Briefcase}>
                                                <Input
                                                    placeholder="Role Title"
                                                    value={data.job_title}
                                                    onChange={e => setData("job_title", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-orange-500/20"
                                                />
                                            </TechLabel>

                                            <TechLabel label="Department" icon={Globe}>
                                                <Select onValueChange={val => setData("department", val)} value={data.department}>
                                                    <SelectTrigger className="rounded-xl border-zinc-200 dark:border-zinc-800 w-full">
                                                        <SelectValue placeholder="Select Unit" />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="Engineering">Engineering</SelectItem>
                                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                                        <SelectItem value="Sales">Sales</SelectItem>
                                                        <SelectItem value="Human Resources">Human Resources</SelectItem>
                                                        <SelectItem value="Administration">Administration</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </TechLabel>
                                        </div>

                                        <TechLabel label="Personnel Bio" icon={UserIcon}>
                                            <Textarea
                                                placeholder="Professional summary and system context..."
                                                className="rounded-xl border-zinc-200 dark:border-zinc-800 min-h-[120px] focus:ring-orange-500/20"
                                                value={data.bio}
                                                onChange={e => setData("bio", e.target.value)}
                                            />
                                        </TechLabel>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border border-rose-500/20 dark:border-rose-500/10 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-6")}>
                                        <div className="flex items-center gap-3 border-b border-rose-100 dark:border-rose-950/30 pb-4">
                                            <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-500">
                                                <AlertCircle size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-500">Hazardous Operations</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Permanent Resource Termination</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-xl">
                                            <div>
                                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">Decommission Profile</p>
                                                <p className="text-[10px] text-zinc-400 font-mono uppercase">Deletes all auth keys and dossier data</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={handleDelete}
                                                className="rounded-lg border-rose-200 dark:border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest shadow-sm active:scale-95"
                                            >
                                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Execute Deletion
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>

                            {/* Right Column: Profile Image & Roles */}
                            <div className="col-span-12 lg:col-span-4 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 flex flex-col items-center text-center space-y-6")}>
                                        <div className="w-full text-left">
                                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Biometric Profile</h2>
                                            <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Visual Identification Matrix</p>
                                        </div>
                                        <div className="relative group">
                                            <div className="h-48 w-48 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 overflow-hidden transition-all group-hover:border-orange-500 group-hover:bg-orange-500/[0.02]">
                                                {data.image ? (
                                                    <img
                                                        src={URL.createObjectURL(data.image)}
                                                        alt="Preview"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : staff.image ? (
                                                    <img
                                                        src={`/storage/${staff.image}`}
                                                        alt={staff.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <Camera className="h-12 w-12 text-zinc-300 dark:text-zinc-700 transition-colors group-hover:text-orange-500/50" />
                                                )}
                                            </div>
                                            <Label
                                                htmlFor="image-upload"
                                                className="absolute bottom-2 right-2 p-3 bg-orange-500 text-white rounded-full cursor-pointer hover:bg-orange-600 transition-all shadow-xl active:scale-95 group-hover:rotate-12"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Label>
                                            <input
                                                id="image-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={e => setData("image", e.target.files?.[0] || null)}
                                            />
                                        </div>
                                        <div className="text-zinc-400 font-mono text-[9px] uppercase tracking-widest">
                                            Supported: JPG, PNG, WEBP [MAX: 2MB]
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-6")}>
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Security Clearance</h2>
                                            <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">Assigned Authorization Levels</p>
                                        </div>

                                        <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl divide-y dark:divide-zinc-800 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar bg-zinc-50/50 dark:bg-zinc-800/30">
                                            {roles.map(role => (
                                                <div
                                                    key={role.id}
                                                    className="flex items-center space-x-4 p-4 hover:bg-white dark:hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                                                >
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={data.roles.includes(role.name)}
                                                        onCheckedChange={() => handleRoleChange(role.name)}
                                                        className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-orange-500 data-[state=checked]:border-none"
                                                    />
                                                    <Label
                                                        htmlFor={`role-${role.id}`}
                                                        className="flex-1 flex flex-col cursor-pointer"
                                                    >
                                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-orange-500 transition-colors">
                                                            {role.name}
                                                        </span>
                                                        <span className="text-[8px] text-zinc-400 font-mono uppercase">AUTH-LEVEL: {role.id.toString().padStart(3, '0')}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Card className={cn(PREMIUM_ROUNDING, "p-8 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white dark:bg-zinc-900 space-y-8")}>
                                        <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500">
                                                <Globe size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Social Connectivity</h2>
                                                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">External Profile Integration</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <TechLabel label="LinkedIn Network" icon={Linkedin}>
                                                <Input
                                                    placeholder="URL"
                                                    value={data.linkedin_url}
                                                    onChange={e => setData("linkedin_url", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 transition-colors hover:border-blue-500/50"
                                                />
                                            </TechLabel>
                                            <TechLabel label="Facebook Context" icon={Facebook}>
                                                <Input
                                                    placeholder="URL"
                                                    value={data.facebook_url}
                                                    onChange={e => setData("facebook_url", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 transition-colors hover:border-blue-800/50"
                                                />
                                            </TechLabel>
                                            <TechLabel label="X Terminal" icon={Twitter}>
                                                <Input
                                                    placeholder="URL"
                                                    value={data.twitter_url}
                                                    onChange={e => setData("twitter_url", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800 transition-colors hover:border-sky-500/50"
                                                />
                                            </TechLabel>
                                            <TechLabel label="Portfolio / Web Terminal" icon={ExternalLink}>
                                                <Input
                                                    placeholder="https://..."
                                                    value={data.portfolio_url}
                                                    onChange={e => setData("portfolio_url", e.target.value)}
                                                    className="rounded-xl border-zinc-200 dark:border-zinc-800"
                                                />
                                            </TechLabel>
                                        </div>
                                    </Card>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-orange-500/20 active:scale-[0.98]"
                                        disabled={processing}
                                    >
                                        <Save className="mr-3 h-5 w-5" />
                                        {processing ? "Updating Meta..." : "Commit Profile Changes"}
                                    </Button>
                                    <p className="text-center text-[9px] text-zinc-400 mt-4 font-mono uppercase tracking-widest">
                                        Committing changes will instantly update system authorization records.
                                    </p>
                                </motion.div>
                            </div>
                        </form>
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
