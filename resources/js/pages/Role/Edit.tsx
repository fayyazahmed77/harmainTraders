import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import {
    Users,
    ShieldCheck,
    Settings,
    MessageSquare,
    FileText,
    Briefcase,
    Globe,
    AppWindow,
    LayoutDashboard,
} from "lucide-react";

import { type BreadcrumbItem } from '@/types';

interface PermissionAction {
    id: number;
    name: string;
}

interface PermissionCategory {
    label: string;
    icon: string;
    actions: PermissionAction[];
}

interface PagePropsWithPermissions {
    permissionCategories?: PermissionCategory[];
    role: {
        id: number;
        name: string;
        permissions: number[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles & Permission',
        href: '/roles/permissions',
    },
    {
        title: 'Edit Role',
        href: '#',
    },
];

export default function Edit() {
    const iconMap: Record<string, any> = {
        Users,
        ShieldCheck,
        Settings,
        MessageSquare,
        FileText,
        Briefcase,
        Globe,
        AppWindow,
        LayoutDashboard,
    };
    interface PagePropsWithPermissions {
        role: {
            id: number;
            name: string;
            permissions: number[];
        };
        permissionCategories?: PermissionCategory[];
        [key: string]: any; // 👈 this fixes the error
    }

    const { role, permissionCategories: rawPermissionCategories = [] } = usePage<PagePropsWithPermissions>().props;


    const permissionCategories = rawPermissionCategories.map((cat) => ({
        ...cat,
        icon: iconMap[cat.icon] || ShieldCheck,
    }));

    const [roleName, setRoleName] = useState(role.name);
    const [checkedPermissions, setCheckedPermissions] = useState<number[]>(role.permissions);

    const isChecked = (id: number) => checkedPermissions.includes(id);

    const handlePermissionToggle = (id: number, checked: boolean) => {
        setCheckedPermissions(prev =>
            checked ? [...prev, id] : prev.filter(pid => pid !== id)
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        router.put(`/roles/permissions/${role.id}`, {
            roleName,
            permissions: checkedPermissions,
        });
    };

    return (
        <>
            <Head title="Edit Role" />
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader breadcrumbs={breadcrumbs} />
                    <RolesLayout>
                        <div className="p-6 rounded-xl shadow border w-full px-4 md:px-6 lg:px-8">
                            <HeadingSmall title="Edit Role" description="Update the role name and its permissions." />
                            <form onSubmit={handleSubmit} className="mt-4 space-y-6 w-full">
                                <div className="grid gap-2">
                                    <Label htmlFor="roleName">Role name</Label>
                                    <Input
                                        id="roleName"
                                        value={roleName}
                                        onChange={(e) => setRoleName(e.target.value)}
                                        placeholder="e.g. Manager"
                                        className="w-70"
                                    />
                                </div>

                                <div>
                                    <Label className="mb-2">Permissions</Label>
                                    <Tabs defaultValue={permissionCategories[0]?.label ?? ''} className="w-full mt-3">
                                        <TabsList className="bg-transparent p-0 flex flex-wrap gap-2 h-auto justify-start w-full">
                                            {permissionCategories.map((perm, i) => {
                                                const Icon = perm.icon;
                                                return (
                                                    <TabsTrigger
                                                        key={i}
                                                        value={perm.label}
                                                        className="flex items-center gap-2 px-4 py-2 border rounded-sm data-[state=active]:bg-[#F19D3B] data-[state=active]:text-white data-[state=active]:border-[#F19D3B] bg-white text-gray-600 hover:bg-gray-50 transition-all shadow-sm flex-initial h-auto cursor-pointer"
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{perm.label}</span>
                                                    </TabsTrigger>
                                                );
                                            })}
                                        </TabsList>

                                        {permissionCategories.map((perm, i) => (
                                            <TabsContent key={i} value={perm.label}>
                                                <div className="border rounded-lg p-4 mt-4">
                                                    <Label className="font-semibold flex items-center gap-2 mb-2">
                                                        <span>{perm.label}</span>
                                                    </Label>

                                                    {perm.actions.length > 0 ? (
                                                        perm.actions.map((action) => (
                                                            <div key={action.id} className="flex items-center gap-3 mb-2">
                                                                <Checkbox
                                                                    id={`perm-${action.id}`}
                                                                    checked={isChecked(action.id)}
                                                                    onCheckedChange={(checked) =>
                                                                        handlePermissionToggle(action.id, checked as boolean)
                                                                    }
                                                                    className="cursor-pointer"
                                                                />
                                                                <Label htmlFor={`perm-${action.id}`} className="text-sm">
                                                                    {action.name}
                                                                </Label>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-muted-foreground">No actions</p>
                                                    )}
                                                </div>
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit">Update Role</Button>
                                </div>
                            </form>
                        </div>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
