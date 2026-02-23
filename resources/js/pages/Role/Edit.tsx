import { Head, useForm, router, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from 'lucide-react';
import { LucideIcon, Shield, ShieldCheck, Save, LayoutGrid, Info, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface PermissionAction {
    id: number;
    name: string;
}

interface PermissionCategory {
    label: string;
    icon: string;
    actions: PermissionAction[];
}

interface Role {
    id: number;
    name: string;
    permissions: number[];
}

interface EditProps {
    role: Role;
    permissionCategories: PermissionCategory[];
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Roles & Permissions', href: '/roles/permissions/list' },
    { title: 'Reconfigure Role', href: '#' },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

export default function Edit() {
    const { role, permissionCategories = [] } = usePage<EditProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions,
    });

    const [activeTab, setActiveTab] = useState(permissionCategories[0]?.label || '');

    const togglePermission = (id: number) => {
        const newPermissions = data.permissions.includes(id)
            ? data.permissions.filter((pId) => pId !== id)
            : [...data.permissions, id];
        setData('permissions', newPermissions);
    };

    const handleSelectAll = (categoryPermissions: PermissionAction[]) => {
        const categoryIds = categoryPermissions.map(p => p.id);
        const allSelected = categoryIds.every(id => data.permissions.includes(id));

        if (allSelected) {
            setData('permissions', data.permissions.filter(id => !categoryIds.includes(id)));
        } else {
            const otherPermissions = data.permissions.filter(id => !categoryIds.includes(id));
            setData('permissions', [...otherPermissions, ...categoryIds]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/roles/permissions/${role.id}`);
    };

    return (
        <>
            <Head title={`Edit Role: ${role.name}`} />
            <SidebarProvider >
                <AppSidebar variant="inset" />
                <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                    <SiteHeader breadcrumbs={breadcrumbs} />

                    <RolesLayout>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Header Section */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`p-6 ${CARD_BASE} ${PREMIUM_ROUNDING} ${PREMIUM_GRADIENT} relative overflow-hidden`}
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                                    <div className="space-y-4 flex-1 max-w-xl">
                                        <div className="flex items-center gap-3">
                                            <Link
                                                href="/roles/permissions/list"
                                                className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-orange-500 transition-colors"
                                            >
                                                <ArrowLeft size={16} />
                                            </Link>
                                            <div className="space-y-1">
                                                <h2 className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Reconfigure Role</h2>
                                                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Updating security clearance for {role.name}</p>
                                            </div>
                                        </div>

                                        <TechLabel label="Security Descriptor" icon={Shield}>
                                            <Input
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g. EXECUTIVE_OFFICER"
                                                className={`h-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-black text-sm uppercase tracking-tighter focus-visible:ring-orange-500`}
                                                required
                                            />
                                            {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">{errors.name}</p>}
                                        </TechLabel>
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className={`h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD} transition-all active:scale-95`}
                                    >
                                        <Save className="mr-2 h-4 w-4" /> Deploy Updates
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Permissions Configuration */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`flex-1 min-h-0 flex flex-col ${CARD_BASE} ${PREMIUM_ROUNDING} overflow-hidden`}
                            >
                                <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-orange-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Privilege Matrix</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Info size={12} className="text-zinc-400" />
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data.permissions.length} Privileges Assigned</span>
                                    </div>
                                </div>

                                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col md:flex-row min-h-[500px]">
                                    <TabsList className="flex flex-row md:flex-col items-stretch justify-start bg-zinc-50 dark:bg-zinc-900/30 w-full md:w-64 h-auto p-2 md:p-4 gap-1 border-r border-zinc-200 dark:border-zinc-800 rounded-none overflow-x-auto md:overflow-x-visible">
                                        {permissionCategories.map((category, idx) => {
                                            const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                            const isActive = activeTab === category.label;
                                            return (
                                                <TabsTrigger
                                                    key={idx}
                                                    value={category.label}
                                                    className={`
                                                        justify-start gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg
                                                        ${isActive
                                                            ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm border border-zinc-200 dark:border-zinc-700'
                                                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}
                                                    `}
                                                >
                                                    {IconComponent ? <IconComponent size={14} /> : <LayoutGrid size={14} />}
                                                    <span className="truncate">{category.label}</span>
                                                </TabsTrigger>
                                            );
                                        })}
                                    </TabsList>

                                    <div className="flex-1 p-6 overflow-y-auto max-h-[600px]">
                                        <AnimatePresence mode="wait">
                                            {permissionCategories.map((category, catIdx) => (
                                                <TabsContent key={catIdx} value={category.label} className="mt-0 focus-visible:outline-none">
                                                    <motion.div
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="space-y-6"
                                                    >
                                                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                                            <div className="space-y-0.5">
                                                                <h3 className="text-sm font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">{category.label} Module</h3>
                                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Toggle specific access controls for this category</p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSelectAll(category.actions)}
                                                                className={`h-8 px-4 text-[9px] font-black uppercase tracking-widest ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400`}
                                                            >
                                                                Select All
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {category.actions.map((action, idx) => {
                                                                const isSelected = data.permissions.includes(action.id);
                                                                return (
                                                                    <motion.div
                                                                        key={action.id}
                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        transition={{ delay: idx * 0.02 }}
                                                                        onClick={() => togglePermission(action.id)}
                                                                        className={`
                                                                            group cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all
                                                                            ${isSelected
                                                                                ? 'bg-orange-500/5 border-orange-200 dark:border-orange-500/30 shadow-sm'
                                                                                : 'bg-white dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}
                                                                        `}
                                                                    >
                                                                        <div className={`
                                                                            w-4 h-4 rounded-md border flex items-center justify-center transition-all
                                                                            ${isSelected
                                                                                ? 'bg-orange-500 border-orange-500 text-white'
                                                                                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}
                                                                        `}>
                                                                            {isSelected && <Icons.Check size={10} strokeWidth={4} />}
                                                                        </div>
                                                                        <span className={`text-[11px] font-bold uppercase tracking-tight transition-colors ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                                            {action.name}
                                                                        </span>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                </TabsContent>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </Tabs>
                            </motion.div>
                        </form>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
