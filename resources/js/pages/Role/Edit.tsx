import { Head, useForm, usePage } from '@inertiajs/react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import RolesLayout from '@/layouts/roles/layout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type BreadcrumbItem } from '@/types';
import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
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

export default function Edit() {
    const { role, permissionCategories = [] } = usePage<EditProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        roleName: role.name,
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
            <SidebarProvider>
                <AppSidebar variant="inset" />
                <SidebarInset className="bg-zinc-50 dark:bg-zinc-950 flex flex-col">
                    <SiteHeader breadcrumbs={breadcrumbs} />

                    <RolesLayout>
                        <form onSubmit={handleSubmit} className="w-full">
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                                {/* Header */}
                                <div className="flex items-center gap-4">
                                    <Link
                                        href="/roles/permissions/list"
                                        className="group p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
                                    >
                                        <Icons.ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
                                    </Link>
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Edit Role</h2>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure permissions for this role.</p>
                                    </div>
                                </div>

                                {/* Role Name Input */}
                                <div className="space-y-2 max-w-md">
                                    <label htmlFor="roleName" className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                        Role name
                                    </label>
                                    <Input
                                        id="roleName"
                                        value={data.roleName}
                                        onChange={(e) => setData('roleName', e.target.value)}
                                        placeholder="e.g. Manager"
                                        className={`
                                            h-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 
                                            rounded-lg text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary
                                            ${errors.roleName ? 'border-rose-500 text-rose-500' : ''}
                                            transition-all
                                        `}
                                        required
                                    />
                                    {errors.roleName && (
                                        <p className="text-xs text-rose-500 font-medium mt-1">{errors.roleName}</p>
                                    )}
                                </div>

                                {/* Permissions Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                        Permissions
                                    </h3>

                                    {/* Horizontal Category Tabs */}
                                    <div className="flex flex-wrap gap-2">
                                        {permissionCategories.map((category) => {
                                            const IconComponent = Icons[category.icon as keyof typeof Icons] as LucideIcon;
                                            const isActive = activeTab === category.label;
                                            return (
                                                <button
                                                    key={`tab-${category.label}`}
                                                    type="button"
                                                    onClick={() => setActiveTab(category.label)}
                                                    className={`
                                                        flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all active:scale-95
                                                        ${isActive
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'}
                                                    `}
                                                >
                                                    {IconComponent && <IconComponent size={14} />}
                                                    <span>{category.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Permissions Matrix Box */}
                                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 bg-zinc-50/50 dark:bg-zinc-900/30 min-h-[200px] space-y-4">
                                        {/* Category Title & Select All */}
                                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                                {activeTab}
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentCategory = permissionCategories.find(c => c.label === activeTab);
                                                    if (currentCategory) handleSelectAll(currentCategory.actions);
                                                }}
                                                className="text-xs font-semibold text-primary hover:underline transition-all"
                                            >
                                                Select All / Toggle
                                            </button>
                                        </div>

                                        {/* Checkbox List */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 py-2">
                                            {permissionCategories.filter(cat => cat.label === activeTab).map((category) => (
                                                category.actions.map((action) => (
                                                    <label
                                                        key={`permission-${action.id}`}
                                                        className="flex items-center gap-3 cursor-pointer group py-1.5"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.permissions.includes(action.id)}
                                                            onChange={() => togglePermission(action.id)}
                                                            className="w-4 h-4 text-primary border-zinc-300 rounded focus:ring-primary bg-white dark:bg-zinc-950 dark:border-zinc-700"
                                                        />
                                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                                                            {action.name.replace(/_/g, ' ')}
                                                        </span>
                                                    </label>
                                                ))
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Footer */}
                                <div className="flex justify-end pt-4">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {processing && <Icons.Loader2 size={16} className="animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </RolesLayout>
                </SidebarInset>
            </SidebarProvider>
        </>
    );
}
