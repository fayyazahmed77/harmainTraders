import { Head } from '@inertiajs/react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Pencil, Trash,Plus  } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permission Category',
        href: '/roles/permissions',
    },
];

interface Permission {
    id: number;
    name: string;
    icon: string;
}

interface IndexProps {
    permissions: Permission[];
}

interface FlashProps {
    success?: string;
}

export default function Index({ permissions }: IndexProps) {
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const handleOpenEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIcon(permission.icon);
        setName(permission.name);
        setOpenEditDialog(true);
    };

    const [icon, setIcon] = useState('');
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/permissions/category', { icon, name });
        setOpenCreateDialog(false);
    };

    const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedPermission) return;

        router.put(`/permissions/category/${selectedPermission.id}`, { icon, name });
        setOpenEditDialog(false);
    };


    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const handleDelete = () => {
        if (selectedPermission) {
            router.delete(`/permissions/category/${selectedPermission.id}`);
            setOpenDeleteDialog(false);
        }
    };

    const handleOpenDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setOpenDeleteDialog(true);
    };

    return (
        <>
            <Head title="Permission Category" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <RolesLayout>
                        <Card className="">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Permission Categories</CardTitle>
                                    <CardDescription>Manage your permission categories</CardDescription>
                                </div>
                                <Button className='bg-sky-500 cursor-pointer' onClick={() => setOpenCreateDialog(true)}>
                                     <Plus />
                                </Button>
                            </CardHeader>
                            <Separator className="my-6 md:hidden" />
                            <CardContent>
                                <div className="w-full">
                                    <Table className='border rounded-md'>
                                        {/* Table Header */}
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Permission Category</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>

                                        {/* Table Body */}
                                        <TableBody>
                                            {permissions.length > 0 ? (
                                                permissions.map((permission) => {
                                                    const IconComponent = Icons[permission.icon as keyof typeof Icons] as LucideIcon;

                                                    return (
                                                        <TableRow key={permission.id}>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    {/* Render the actual icon based on the name stored in DB */}
                                                                    {IconComponent && <IconComponent className="w-5 h-5 text-gray-700" />}
                                                                    {/* Then show the category name */}
                                                                    <span>{permission.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell >
                                                                <div className='gap-2'>
                                                                    <Button variant="outline" className='mr-2' onClick={() => handleOpenEdit(permission)}>
                                                                        <Pencil />
                                                                    </Button>
                                                                    <Button variant="destructive" onClick={() => handleOpenDelete(permission)}>
                                                                        <Trash />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="text-center">
                                                        No  permissions Category available.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                {/* Footer actions */}
                            </CardFooter>
                        </Card>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>

            {/* Create Permission Category Dialog */}
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogTrigger asChild>
                    <Button variant="outline">Create New Category</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Permission Category</DialogTitle>
                        <DialogDescription>
                            Fill in the details to create a new permission category.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">Category Icon</label>
                            <input
                                type="text"
                                className="border px-3 py-2 rounded w-full"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Category Name</label>
                            <input
                                type="text"
                                className="border px-3 py-2 rounded w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Permission Category Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">Category Icon</label>
                            <input
                                type="text"
                                className="border px-3 py-2 rounded w-full"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Category Name</label>
                            <input
                                type="text"
                                className="border px-3 py-2 rounded w-full"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>


            {/* Delete Permission Category Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Category</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{selectedPermission?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-600 text-white"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </>
    );
}
