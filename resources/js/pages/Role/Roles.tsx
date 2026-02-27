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
import { LucideIcon, Shield, ShieldCheck, Save, LayoutGrid, Info } from 'lucide-react';

interface Permission {
    id: number;
    name: string;
}

interface Category {
    label: string;
    icon: string;
    actions: Permission[];
}

interface RolesProps {
    permissionCategories: Category[];
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Provision Role', href: '/roles/permissions' },
];

const PREMIUM_ROUNDING = "rounded-sm";
const PREMIUM_ROUNDING_MD = "rounded-sm";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-none";

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-1 font-mono">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

export default function Roles() {
    const { permissionCategories = [] } = usePage<RolesProps>().props;
    const [isScrolled, setIsScrolled] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        roleName: '',
        permissions: [] as number[],
    });

    const [activeTab, setActiveTab] = useState(permissionCategories[0]?.label || '');

    const togglePermission = (id: number) => {
        const newPermissions = data.permissions.includes(id)
            ? data.permissions.filter((pId) => pId !== id)
            : [...data.permissions, id];
        setData('permissions', newPermissions);
    };

    const handleSelectAll = (categoryPermissions: Permission[]) => {
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
        post('/roles/permissions');
    };

    return (
        <>
            <Head title="Provision Role" />
            <SidebarProvider >
                <AppSidebar variant="inset" />
                <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                    <SiteHeader breadcrumbs={breadcrumbs} />

                    <RolesLayout>
                        <form onSubmit={handleSubmit} className="relative h-full flex flex-col overflow-hidden">
                            {/* Pro-Level Sticky Header */}
                            <div className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-6'} -mx-4 px-4 md:-mx-8 md:px-8`}>
                                <div className={`
                                    flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 
                                    ${CARD_BASE} ${PREMIUM_ROUNDING} backdrop-blur-md bg-white/90 dark:bg-zinc-900/90
                                    border-b-2 border-orange-500 shadow-xl shadow-orange-500/5
                                    transition-all duration-500
                                `}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2.5 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                                            <Icons.ShieldPlus size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0 max-w-md">
                                            <TechLabel label="Architectural Identity" icon={Icons.Shield}>
                                                <div className="relative group">
                                                    <Input
                                                        value={data.roleName}
                                                        onChange={(e) => setData('roleName', e.target.value)}
                                                        placeholder="Create Role Identifier"
                                                        className={`
                                                            h-11 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 
                                                            rounded-sm font-mono font-black text-sm uppercase tracking-widest 
                                                            focus-visible:ring-0 focus-visible:border-orange-500
                                                            placeholder:text-zinc-300 dark:placeholder:text-zinc-700
                                                            ${errors.roleName ? 'border-rose-500 text-rose-500' : ''}
                                                            transition-all duration-300
                                                        `}
                                                        required
                                                    />
                                                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-500 group-focus-within:w-full rounded-full" />
                                                </div>
                                            </TechLabel>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden lg:flex flex-col items-end mr-4">
                                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Matrix Load</span>
                                            <span className="text-xs font-mono font-bold text-orange-500 uppercase">{data.permissions.length} Protocols Selected</span>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className={`
                                                h-11 px-8 bg-orange-500 hover:bg-orange-600
                                                text-white font-black text-[10px] uppercase tracking-[0.2em] 
                                                rounded-sm shadow-lg shadow-orange-500/20 transition-all 
                                                hover:translate-y-[-2px] active:translate-y-[1px]
                                                flex items-center gap-3 active:scale-95 disabled:opacity-50
                                            `}
                                        >
                                            {processing ? (
                                                <Icons.Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Icons.Database size={16} className="text-orange-400 dark:text-orange-200" />
                                            )}
                                            {processing ? 'Provisioning...' : 'Provision Role'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 overflow-hidden">
                                {/* Navigation Sidebar */}
                                <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-28 self-start">
                                    <div className={`p-4 ${CARD_BASE} rounded-sm border-l-4 min-h-[550px] border-zinc-900 dark:border-zinc-100 bg-zinc-50/50 dark:bg-zinc-900/30`}>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2 px-1">
                                            <Icons.Layers size={12} className="text-orange-500" />
                                            Module Sub-Systems
                                        </h3>
                                        <div className="space-y-1 max-h-[530px] overflow-y-auto pr-2 custom-scrollbar">
                                            {permissionCategories.map((category) => {
                                                const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                                const isActive = activeTab === category.label;
                                                return (
                                                    <button
                                                        key={`nav-${category.label}`}
                                                        type="button"
                                                        onClick={() => setActiveTab(category.label)}
                                                        className={`
                                                            w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-sm
                                                            ${isActive
                                                                ? 'bg-orange-500 text-white dark:bg-orange-500 dark:text-white shadow-lg shadow-orange-500/20 translate-x-1'
                                                                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100'}
                                                        `}
                                                    >
                                                        {IconComponent ? <IconComponent size={14} className={isActive ? 'text-white' : ''} /> : <Icons.LayoutGrid size={14} />}
                                                        <span className="truncate">{category.label}</span>
                                                        {isActive && <div className="ml-auto w-1 h-4 bg-white/50" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Matrix Area */}
                                <div className="lg:col-span-9 h-full flex flex-col min-h-0">
                                    <div className={`${CARD_BASE} rounded-sm flex-1 flex flex-col overflow-hidden border-2`}>
                                        <div className="bg-zinc-50 dark:bg-zinc-900/80 px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Icons.Activity size={14} className="text-orange-500" />
                                                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                                                            {activeTab} Module Matrix
                                                        </h3>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
                                                        Assign functional protocols to the new organizational layer
                                                    </p>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const currentCategory = permissionCategories.find(c => c.label === activeTab);
                                                        if (currentCategory) handleSelectAll(currentCategory.actions);
                                                    }}
                                                    className="h-9 px-6 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm border-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white dark:hover:bg-orange-500 transition-all active:scale-95"
                                                >
                                                    Map Category Protocols
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                            <AnimatePresence mode="wait">
                                                {permissionCategories.filter(cat => cat.label === activeTab).map((category) => (
                                                    <motion.div
                                                        key={`matrix-${category.label}`}
                                                        initial={{ opacity: 0, scale: 0.99, transformOrigin: 'top' }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.99 }}
                                                        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                                                    >
                                                        {category.actions.map((action, idx) => {
                                                            const isSelected = data.permissions.includes(action.id);
                                                            return (
                                                                <motion.div
                                                                    key={`permission-${action.id}`}
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: idx * 0.03 }}
                                                                    onClick={() => togglePermission(action.id)}
                                                                    className={`
                                                                        group cursor-pointer relative p-5 transition-all duration-300
                                                                        ${isSelected
                                                                            ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/50 shadow-sm'
                                                                            : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-orange-500/30'}
                                                                        border-2 rounded-sm overflow-hidden
                                                                    `}
                                                                >
                                                                    {isSelected && (
                                                                        <motion.div
                                                                            layoutId="glow-new"
                                                                            className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none"
                                                                        />
                                                                    )}

                                                                    <div className="flex flex-col gap-4 relative z-10">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className={`
                                                                                w-6 h-6 rounded-none border-2 flex items-center justify-center transition-all duration-500
                                                                                ${isSelected
                                                                                    ? 'bg-orange-500 border-orange-500 text-white rotate-90 scale-110'
                                                                                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 group-hover:border-orange-500/50'}
                                                                            `}>
                                                                                {isSelected ? <Icons.Check size={12} strokeWidth={3} /> : <Icons.Lock size={12} className="text-zinc-400" />}
                                                                            </div>
                                                                            <span className={`text-[8px] font-black tracking-widest ${isSelected ? 'text-orange-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                                                                {isSelected ? 'MAPPED' : 'STANDBY'}
                                                                            </span>
                                                                        </div>

                                                                        <div className="space-y-1">
                                                                            <span className={`
                                                                                block text-[11px] font-black uppercase tracking-tighter transition-colors
                                                                                ${isSelected ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300 group-hover:text-orange-500'}
                                                                            `}>
                                                                                {action.name.replace(/_/g, ' ')}
                                                                            </span>
                                                                            <div className={`h-0.5 w-8 transition-all duration-500 ${isSelected ? 'bg-orange-500 w-full' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            );
                                                        })}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
