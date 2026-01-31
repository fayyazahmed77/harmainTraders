// PermissionIndex.tsx

import { Head, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import * as Icons from 'lucide-react';
import { LucideIcon, Pencil, Trash, Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { Button } from "@/components/ui/button";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
];
interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    permissions_count: number;
}

interface IndexProps {
    roles: Role[];
}

export default function Index({ roles }: IndexProps) {
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
const [selectedRole, setSelectedRole] = useState<{ id: number; name: string } | null>(null);
const handleDelete = () => {
    if (!selectedRole) return;

    router.delete(route('roles.destroy', selectedRole.id), {
        onSuccess: () => {
            setOpenDeleteDialog(false);
            setSelectedRole(null);
        },
    });
};

    return (
        <>
            <Head title="Roles" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={[{ title: 'Roles', href: '/roles' }]} />
                    <RolesLayout>
                        <div className="px-5">
                            <div className="flex items-center justify-between py-4">
                                <h1 className="text-xl font-semibold">Roles</h1>
                                <Link >
                                <Button className='bg-sky-500'>
                                    <Plus className="mr-2" /> Add Role
                                </Button>
                                </Link>
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Role Name</TableHead>
                                            <TableHead>Permissions Count</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roles.length > 0 ? (
                                            roles.map((role) => (
                                                <TableRow key={role.id}>
                                                    <TableCell>{role.name}</TableCell>
                                                    <TableCell>{role.permissions_count} Permissions</TableCell>
                                                    <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Link href={`/roles/permissions/${role.id}/edit`}>
                                                                <Button variant="outline">
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button variant="destructive"
                                                            onClick={() => {
                                                                setSelectedRole({ id: role.id, name: role.name });
                                                                setOpenDeleteDialog(true);
                                                            }}
                                                            >
                                                                <Trash className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center">
                                                    No roles found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedRole?.name} Role</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                        <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </>
    );
}

