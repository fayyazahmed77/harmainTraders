// PermissionIndex.tsx

import { Head, router, Link, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, ShieldCheck, Users, Plus, Hash, Shield } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Security Roles', href: '/roles/permissions/list' },
];

const PREMIUM_ROUNDING = "rounded-xl";
const PREMIUM_ROUNDING_MD = "rounded-md";
const PREMIUM_GRADIENT = "bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900";
const CARD_BASE = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-md shadow-zinc-200/50 dark:shadow-none";

interface Role {
    id: number;
    name: string;
}

interface IndexProps {
    roles: Role[];
    [key: string]: unknown;
}

export default function Index() {
    const { roles = [] } = usePage<IndexProps>().props;
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleOpenDelete = (role: Role) => {
        setSelectedRole(role);
        setOpenDeleteDialog(true);
    };

    const handleDelete = () => {
        if (selectedRole) {
            router.delete(`/roles/permissions/${selectedRole.id}`, {
                onSuccess: () => setOpenDeleteDialog(false)
            });
        }
    };

    return (
        <>
            <Head title="Security Registry" />
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
                                        <h2 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Security Registry</h2>
                                        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Master list of access control definitions</p>
                                    </div>
                                    <Link href="/roles/permissions">
                                        <Button
                                            className={`h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white font-black text-[11px] uppercase tracking-widest shadow-lg shadow-orange-500/20 ${PREMIUM_ROUNDING_MD}`}
                                        >
                                            <Plus className="mr-2 h-4 w-4" /> Provision New Role
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>

                            {/* Role List */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className={`${CARD_BASE} ${PREMIUM_ROUNDING} overflow-hidden`}
                            >
                                <Table>
                                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                        <TableRow className="hover:bg-transparent border-b-zinc-200 dark:border-b-zinc-800">
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 w-[60%]">Role Identity</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 h-10 text-right">Ops</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence mode="popLayout">
                                            {roles.length > 0 ? (
                                                roles.map((role, index) => (
                                                    <motion.tr
                                                        key={role.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className="group border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                                    >
                                                        <TableCell className="py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                                                                    <ShieldCheck size={18} />
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <span className="text-sm font-black uppercase tracking-tighter text-zinc-800 dark:text-zinc-100">{role.name}</span>
                                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SEC-PROTO-X{role.id}</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right py-4">
                                                            <div className="flex gap-2 justify-end">
                                                                <Link href={`/roles/permissions/${role.id}/edit`}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-lg text-zinc-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </Button>
                                                                </Link>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                                    onClick={() => handleOpenDelete(role)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center py-20">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Users className="w-12 h-12 text-zinc-200 dark:text-zinc-800" />
                                                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">No security definitions found</p>
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
                {/* Delete Role Dialog */}
                <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                    <DialogContent className={`${PREMIUM_ROUNDING} border-rose-500/30 dark:bg-zinc-950 shadow-2xl p-0 overflow-hidden`}>
                        <div className={`h-1.5 w-full bg-rose-500`} />
                        <div className="p-6">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter text-rose-600">De-provisioning Protocol</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pt-1">Permanent removal of security architecture</DialogDescription>
                            </DialogHeader>
                            <div className="py-6 mb-4 px-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-500/20">
                                <p className="text-xs font-bold text-rose-950 dark:text-rose-200 text-center uppercase tracking-widest leading-relaxed">
                                    Are you sure you want to purge <br />
                                    <span className="text-lg font-black tracking-tighter text-rose-600 block mt-1">{selectedRole?.name}</span>
                                    This action will revoke all associated access protocols.
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
