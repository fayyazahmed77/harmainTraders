import { Head, router, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import * as Icons from 'lucide-react';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectLabel, SelectItem } from "@/components/ui/select";
import { LucideIcon, Pencil, Trash, Plus, Check, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Permissions', href: '/permissions' },
];

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

export default function Index({ permissions, categories }: IndexProps) {
    const { props } = usePage<{ flash: FlashProps }>();

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [icon, setIcon] = useState('');
    const [cat, setCat] = useState('');
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Group permissions by category
    const groupedPermissions: GroupedPermissions = permissions.reduce((acc, permission) => {
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

    // Filter permissions based on search query
    const filteredGroups = Object.entries(groupedPermissions).reduce((acc, [key, group]) => {
        const filteredPermissions = group.permissions.filter(permission =>
            permission.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            permission.catname.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filteredPermissions.length > 0) {
            acc[key] = { ...group, permissions: filteredPermissions };
        }
        return acc;
    }, {} as GroupedPermissions);

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    const handleOpenEdit = (permission: Permission) => {
        setSelectedPermission(permission);
        setIcon(permission.icon);
        setName(permission.name);
        setCat(permission.cat.toString());
        setOpenEditDialog(true);
    };

    const handleOpenDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setOpenDeleteDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/permissions', { cat, name });
        setOpenCreateDialog(false);
        setName('');
        setCat('');
        setIcon('');
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPermission) return;
        router.put(`/permissions/${selectedPermission.id}`, { cat, name });
        setOpenEditDialog(false);
    };

    const handleDelete = () => {
        if (selectedPermission) {
            router.delete(`/permissions/${selectedPermission.id}`);
            setOpenDeleteDialog(false);
        }
    };

    return (
        <>
            <Head title="Permissions" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <RolesLayout>
                        <div className="p-6 rounded-xl shadow border w-full">
                            {/* Header */}
                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold mb-1">Permissions Management</h1>
                                <p className="text-sm text-muted-foreground">Organize and manage system access controls</p>
                            </div>

                            {/* Search and Add Button */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button className="bg-[#F19D3B] hover:bg-[#F19D3B]/90" onClick={() => setOpenCreateDialog(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Permission
                                </Button>
                            </div>

                            {/* Grouped Permissions */}
                            <div className="space-y-3">
                                {Object.entries(filteredGroups).length > 0 ? (
                                    Object.entries(filteredGroups).map(([key, group]) => {
                                        const IconComponent = Icons[group.categoryIcon as keyof typeof Icons] as LucideIcon;
                                        return (
                                            <Collapsible key={key} defaultOpen className="border rounded-lg bg-white">
                                                <CollapsibleTrigger className="w-full">
                                                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                                                {IconComponent && <IconComponent className="w-5 h-5 text-orange-600" />}
                                                            </div>
                                                            <div className="text-left">
                                                                <h3 className="font-semibold text-base">{group.categoryName}</h3>
                                                                <p className="text-xs text-muted-foreground">{group.permissions.length} permissions</p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="border-t">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow className="bg-gray-50">
                                                                    <TableHead className="font-semibold">Permission Name</TableHead>
                                                                    <TableHead className="font-semibold">Identifier</TableHead>
                                                                    <TableHead className="font-semibold">Created By</TableHead>
                                                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {group.permissions.map((permission) => (
                                                                    <TableRow key={permission.id} className="hover:bg-gray-50">
                                                                        <TableCell className="font-medium">{permission.name}</TableCell>
                                                                        <TableCell>
                                                                            <code className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                                                                                {permission.name.toLowerCase().replace(/\s+/g, '_')}
                                                                            </code>
                                                                        </TableCell>
                                                                        <TableCell className="text-orange-600">{permission.created_by_name}</TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex gap-2 justify-end">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8"
                                                                                    onClick={() => handleOpenEdit(permission)}
                                                                                >
                                                                                    <Pencil className="w-4 h-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                                    onClick={() => handleOpenDelete(permission)}
                                                                                >
                                                                                    <Trash className="w-4 h-4" />
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
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-12 border rounded-lg bg-gray-50">
                                        <p className="text-muted-foreground">No permissions found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>

            {/* Create Dialog */}
            <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create Permission</DialogTitle>
                        <DialogDescription>Choose a category and enter a permission name.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">Category</label>
                            <Select
                                onValueChange={(value) => {
                                    setCat(value);
                                    const selected = categories.find(c => c.id.toString() === value);
                                    setIcon(selected?.icon || '');
                                }}
                                value={cat}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Categories</SelectLabel>
                                        {categories.map((category) => {
                                            const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                            return (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        {IconComponent && <IconComponent className="w-5 h-5 text-muted-foreground" />}
                                                        {category.name}
                                                        {cat === category.id.toString() && <Check className="ml-auto h-4 w-4" />}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Permission Name</label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., View Users"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-[#F19D3B] hover:bg-[#F19D3B]/90">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Permission</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label className="block font-medium mb-1">Category</label>
                            <Select
                                onValueChange={(value) => {
                                    setCat(value);
                                    const selected = categories.find(c => c.id.toString() === value);
                                    setIcon(selected?.icon || '');
                                }}
                                value={cat}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Categories</SelectLabel>
                                        {categories.map((category) => {
                                            const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                            return (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        {IconComponent && <IconComponent className="w-5 h-5 text-muted-foreground" />}
                                                        {category.name}
                                                        {cat === category.id.toString() && <Check className="ml-auto h-4 w-4" />}
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Permission Name</label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="bg-[#F19D3B] hover:bg-[#F19D3B]/90">Update</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Permission</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedPermission?.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
