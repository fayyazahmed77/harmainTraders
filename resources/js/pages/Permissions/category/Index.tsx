import { Head, router, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type BreadcrumbItem } from '@/types';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from 'lucide-react';
import { LucideIcon, Pencil, Trash2, Plus, Hash, Shield, LayoutGrid } from 'lucide-react';
import { toast } from "sonner";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permission Category', href: '/permissions/category' },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

interface Permission {
    id: number;
    name: string;
    icon: string;
}

interface IndexProps {
    permissions: Permission[];
    flash: FlashProps;
    [key: string]: unknown;
}

interface FlashProps {
    success?: string;
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
    const { permissions = [], flash = {} } = usePage<IndexProps>().props;

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [icon, setIcon] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        if (flash.success) {
            toast.success(flash.success);
        }
    }, [flash.success]);

    const handleOpenEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIcon(permission.icon);
        setName(permission.name);
        setOpenEditDialog(true);
    };

    const handleOpenDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setOpenDeleteDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/permissions/category', { icon, name }, {
            onSuccess: () => {
                setOpenCreateDialog(false);
                setIcon('');
                setName('');
            }
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPermission) return;
        router.put(`/permissions/category/${selectedPermission.id}`, { icon, name }, {
            onSuccess: () => setOpenEditDialog(false)
        });
    };

    const handleDelete = () => {
        if (selectedPermission) {
            router.delete(`/permissions/category/${selectedPermission.id}`, {
                onSuccess: () => setOpenDeleteDialog(false)
            });
        }
    };

    return (
        <>
            <Head title="Category Library" />
            <SidebarProvider>
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
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Category Library</h2>
                                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Architectural layers for permission grouping</p>
                                    </div>
                                    <Button
                                        onClick={() => setOpenCreateDialog(true)}
                                        className={`h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD}`}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Initialize Category
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Category Grid/Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`${CARD_BASE} ${PREMIUM_ROUNDING} overflow-hidden`}
                            >
                                <Table>
                                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                        <TableRow className="hover:bg-transparent border-b-zinc-200 dark:border-b-zinc-800">
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 w-[60%]">Category Identity</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 text-right">Ops</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {permissions.length > 0 ? (
                                                permissions.map((permission, index) => {
                                                    const IconComponent = Icons[permission.icon as keyof typeof Icons] as LucideIcon;
                                                    return (
                                                        <motion.tr
                                                            key={permission.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="group border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                                        >
                                                            <TableCell className="py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                                        {IconComponent ? <IconComponent size={18} /> : <Shield size={18} />}
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <span className="text-sm font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-100">{permission.name}</span>
                                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID: PROTO-00{permission.id}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-4">
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                                        onClick={() => handleOpenEdit(permission)}
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                        onClick={() => handleOpenDelete(permission)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </motion.tr>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-20">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <LayoutGrid className="w-12 h-12 text-zinc-200 dark:text-zinc-800" />
                                                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">No categories registered in neural link</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </motion.div>
                        </div>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>

            {/* Redesigned Dialogs */}
            <AnimatePresence>
                {/* Create Category Dialog */}
                <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-orange-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Initialize Category</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500">Create a new organizational layer</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                                <div className="grid gap-4">
                                    <TechLabel label="Visual Identifier (Lucide Name)" icon={Hash}>
                                        <Input
                                            value={icon}
                                            onChange={(e) => setIcon(e.target.value)}
                                            placeholder="e.g. Shield, Lock, User"
                                            className={`h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-mono text-xs uppercase tracking-widest focus-visible:ring-orange-500`}
                                            required
                                        />
                                    </TechLabel>
                                    <TechLabel label="Category Name" icon={LayoutGrid}>
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. SYSTEM_ADMIN"
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

                {/* Edit Category Dialog */}
                <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-orange-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Modify Registry</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-zinc-500">Updating category identification</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEdit} className="space-y-6 mt-6">
                                <div className="grid gap-4">
                                    <TechLabel label="Visual Identifier" icon={Hash}>
                                        <Input
                                            value={icon}
                                            onChange={(e) => setIcon(e.target.value)}
                                            className={`h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 ${PREMIUM_ROUNDING_MD} font-mono text-xs uppercase tracking-widest focus-visible:ring-orange-500`}
                                            required
                                        />
                                    </TechLabel>
                                    <TechLabel label="Category Name" icon={LayoutGrid}>
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
                                        Commit Changes
                                    </Button>
                                </DialogFooter>
                            </form>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Delete Category Dialog */}
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-rose-500/30 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-rose-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-rose-600">Purge Confirmation</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pt-1">Permanent removal of organizational layer</DialogDescription>
                            </DialogHeader>
                            <div className="py-6 mb-4 px-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <p className="text-xs font-bold text-rose-950 dark:text-rose-200 text-center uppercase tracking-widest leading-relaxed">
                                    Are you sure you want to purge <br />
                                    <span className="text-lg font-black tracking-tighter text-rose-600 block mt-1">{selectedPermission?.name}</span>
                                    This action will disconnect associated protocols.
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
