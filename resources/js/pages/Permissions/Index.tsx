import { Head, router, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from 'lucide-react';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { LucideIcon, Pencil, Trash2, Plus, Check, ChevronDown, ChevronRight, Search, Hash, Shield, User as UserIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

interface Permission {
    id: number;
    name: string;
    catname: string;
    cat: number;
    icon: string;
    guard_name: string;
    created_at: string;
    created_by_name: string;
}

interface Category {
    id: number;
    name: string;
    icon: string;
}

interface IndexProps {
    categories: Category[];
    permissions: Permission[];
    flash: FlashProps;
    [key: string]: unknown;
}

interface FlashProps {
    success?: string;
}

interface GroupedPermissions {
    [key: string]: {
        categoryName: string;
        categoryIcon: string;
        categoryId: number;
        permissions: Permission[];
    };
}

const TechLabel = ({ children, icon: Icon, label }: { children: React.ReactNode, icon?: any, label: string }) => (
    <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-0.5 font-mono">
            {Icon && <Icon size={10} className="text-zinc-400 dark:text-zinc-500" />}
            {label}
        </div>
        {children}
    </div>
);

export default function Index() {
    const { permissions = [], categories = [], flash = {} } = usePage<IndexProps>().props;

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [icon, setIcon] = useState('');
    const [cat, setCat] = useState('');
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const groupedPermissions: GroupedPermissions = useMemo(() => {
        return permissions.reduce((acc, permission) => {
            const key = permission.cat.toString();
            if (!acc[key]) {
                acc[key] = {
                    categoryName: permission.catname,
                    categoryIcon: permission.icon,
                    categoryId: permission.cat,
                    permissions: [],
                };
            }
            acc[key].permissions.push(permission);
            return acc;
        }, {} as GroupedPermissions);
    }, [permissions]);

    const filteredGroups = useMemo(() => {
        return Object.entries(groupedPermissions).reduce((acc, [key, group]) => {
            const filteredPermissions = group.permissions.filter(permission =>
                permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                permission.catname.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filteredPermissions.length > 0) {
                acc[key] = { ...group, permissions: filteredPermissions };
            }
            return acc;
        }, {} as GroupedPermissions);
    }, [groupedPermissions, searchQuery]);

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash.success]);

    const handleOpenEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setCat(permission.cat.toString());
        setName(permission.name);
        setOpenEditDialog(true);
    };

    const handleOpenDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setOpenDeleteDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/permissions', { cat, name }, {
            onSuccess: () => {
                setOpenCreateDialog(false);
                setName('');
                setCat('');
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPermission) return;
        router.put(`/permissions/${selectedPermission.id}`, { cat, name }, {
            onSuccess: () => setOpenEditDialog(false)
        });
    };

    const handleDelete = () => {
        if (selectedPermission) {
            router.delete(`/permissions/${selectedPermission.id}`, {
                onSuccess: () => setOpenDeleteDialog(false)
            });
        }
    };

    return (
        <>
            <Head title="Permissions Registry" />
            <SidebarProvider >
                <AppSidebar variant="inset" />
                <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                    <SiteHeader breadcrumbs={breadcrumbs} />

                    <RolesLayout>
                        <div className="space-y-6">
                            {/* Control Deck */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-5 ${CARD_BASE} ${PREMIUM_ROUNDING} ${PREMIUM_GRADIENT} relative overflow-hidden`}
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Permissions Registry</h2>
                                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Global access control and authorization management</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                                            <Input
                                                placeholder="SEARCH IDENTITY..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className={`pl-9 h-10 w-full md:w-64 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 font-mono text-[11px] uppercase tracking-widest ${PREMIUM_ROUNDING_MD}`}
                                            />
                                        </div>
                                        <Button
                                            onClick={() => setOpenCreateDialog(true)}
                                            className={`h-10 px-5 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD}`}
                                        >
                                            <Plus className="mr-2 h-3.5 w-3.5" /> Initialize Access
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Permission Collections */}
                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {Object.entries(filteredGroups).length > 0 ? (
                                        Object.entries(filteredGroups).map(([key, group], index) => {
                                            const IconComponent = Icons[group.categoryIcon as keyof typeof Icons] as LucideIcon;
                                            return (
                                                <motion.div
                                                    key={key}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                >
                                                    <Collapsible defaultOpen className={`${CARD_BASE} ${PREMIUM_ROUNDING} overflow-hidden group/collapsible`}>
                                                        <CollapsibleTrigger className="w-full text-left">
                                                            <div className="flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors relative">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 transition-transform group-hover/collapsible:scale-110">
                                                                        {IconComponent && <IconComponent className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <h3 className="font-black text-sm uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">{group.categoryName}</h3>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[9px] font-black font-mono text-zinc-500">COLLECTION</span>
                                                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{group.permissions.length} PERMISSIONS</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center opacity-0 group-hover/collapsible:opacity-100 transition-opacity">
                                                                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <div className="border-t border-zinc-100 dark:border-zinc-800 overflow-x-auto">
                                                                <Table>
                                                                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                                                        <TableRow className="hover:bg-transparent border-b-zinc-200 dark:border-b-zinc-800">
                                                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10">Identity</TableHead>
                                                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10">Identifier</TableHead>
                                                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10">Originator</TableHead>
                                                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 text-right">Ops</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {group.permissions.map((permission) => (
                                                                            <TableRow key={permission.id} className="hover:bg-orange-500/[0.02] dark:hover:bg-orange-500/[0.05] border-transparent">
                                                                                <TableCell className="py-3">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Shield size={12} className="text-orange-500" />
                                                                                        <span className="text-xs font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-200">{permission.name}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="py-3">
                                                                                    <code className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px] font-mono leading-none tracking-tighter text-orange-600 dark:text-orange-400">
                                                                                        {permission.name.toLowerCase().replace(/\s+/g, '_')}
                                                                                    </code>
                                                                                </TableCell>
                                                                                <TableCell className="py-3">
                                                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{permission.created_by_name}</span>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-right py-3">
                                                                                    <div className="flex gap-2 justify-end">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                                                            onClick={() => handleOpenEdit(permission)}
                                                                                        >
                                                                                            <Pencil className="w-3.5 h-3.5" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                                            onClick={() => handleOpenDelete(permission)}
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </motion.div>
                                            );
                                        })
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center py-20 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl"
                                        >
                                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
                                                <Shield className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                                            </div>
                                            <h3 className="font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-1">Silence in the Registry</h3>
                                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">No access protocols found matching your criteria</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>

            {/* Redesigned Dialogs */}
            <AnimatePresence>
                {/* Create Dialog */}
                <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-orange-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Initialize Access</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500">Define a new system permission protocol</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                <div className="grid gap-4">
                                    <TechLabel label="Protocol Collection" icon={Hash}>
                                        <Select onValueChange={setCat} value={cat}>
                                            <SelectTrigger className={`w-full h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-bold text-xs uppercase tracking-widest`}>
                                                <SelectValue placeholder="Target Collection..." />
                                            </SelectTrigger>
                                            <SelectContent className="dark:bg-zinc-900 border-zinc-800">
                                                <SelectGroup>
                                                    {categories.map((category) => {
                                                        const IconComp = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                                        return (
                                                            <SelectItem key={category.id} value={category.id.toString()} className="font-bold text-xs uppercase cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    {IconComp && <IconComp size={14} className="text-orange-500" />}
                                                                    {category.name}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </TechLabel>

                                    <TechLabel label="Identity Name" icon={UserIcon}>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. SYSTEM_AUDIT"
                                            className={`h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-black text-sm uppercase tracking-tighter focus-visible:ring-orange-500`}
                                            required
                                        />
                                    </TechLabel>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className={`w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD}`}>
                                        Execute Initialization
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-orange-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Modify Protocol</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Updating active permission identification</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-6 mt-6">
                                <div className="grid gap-4">
                                    <TechLabel label="Protocol Collection" icon={Hash}>
                                        <Select onValueChange={setCat} value={cat}>
                                            <SelectTrigger className={`w-full h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-bold text-xs uppercase tracking-widest`}>
                                                <SelectValue placeholder="Target Collection..." />
                                            </SelectTrigger>
                                            <SelectContent className="dark:bg-zinc-900 border-zinc-800">
                                                <SelectGroup>
                                                    {categories.map((category) => {
                                                        const IconComp = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                                        return (
                                                            <SelectItem key={category.id} value={category.id.toString()} className="font-bold text-xs uppercase cursor-pointer">
                                                                <div className="flex items-center gap-2">
                                                                    {IconComp && <IconComp size={14} className="text-orange-500" />}
                                                                    {category.name}
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </TechLabel>

                                    <TechLabel label="Identity Name" icon={UserIcon}>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-black text-sm uppercase tracking-tighter focus-visible:ring-orange-500`}
                                            required
                                        />
                                    </TechLabel>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" className={`w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD}`}>
                                        Commit Protocol
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-rose-500/30 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-rose-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-rose-600">Purge Confirmation</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pt-1">Permanent removal of protocol identification</DialogDescription>
                            </DialogHeader>
                            <div className="py-6 mb-4 px-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <p className="text-xs font-bold text-rose-950 dark:text-rose-200 text-center uppercase tracking-widest leading-relaxed">
                                    Are you sure you want to purge <br />
                                    <span className="text-lg font-black tracking-tighter text-rose-600 block mt-1">{selectedPermission?.name}</span>
                                    From system registry?
                                </p>
                            </div>
                            <DialogFooter className="gap-3">
                                <Button variant="outline" onClick={() => setOpenDeleteDialog(false)} className={`flex-1 h-11 font-black uppercase text-[10px] tracking-[0.2em] ${PREMIUM_ROUNDING_MD} border-zinc-200 dark:border-zinc-800`}>Decline</Button>
                                <Button variant="destructive" onClick={handleDelete} className={`flex-1 h-11 font-black uppercase text-[10px] tracking-[0.2em] ${PREMIUM_ROUNDING_MD} bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20`}>Confirm Purge</Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>
            </AnimatePresence>
        </>
    );
}
