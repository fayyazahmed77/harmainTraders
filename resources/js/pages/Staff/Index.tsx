import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { MoreHorizontal, Plus, Mail, Phone, Shield, User as UserIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, router } from "@inertiajs/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    status: string;
    country?: string;
    created_at: string;
    roles: { id: number; name: string }[];
}

interface Props {
    staff: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "All Staff", href: "#" },
];

export default function StaffIndex({ staff }: Props) {
    const handleDelete = (id: number) => {
        if (confirm("Are you sure you want to delete this staff member?")) {
            router.delete(`/staff/${id}`);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">All Staff</h1>
                            <p className="text-muted-foreground">Manage your staff here.</p>
                        </div>
                        <Button asChild>
                            <Link href="/staff/create">
                                <Plus className="mr-2 h-4 w-4" /> Add Staff
                            </Link>
                        </Button>
                    </div>

                    <Card className="overflow-hidden border-none shadow-sm bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-[#E7F3FF] text-[#2D2D2D] font-bold">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4 font-semibold">Email</th>
                                        <th className="px-6 py-4 font-semibold">Phone</th>
                                        <th className="px-6 py-4 font-semibold">Roles</th>
                                        <th className="px-6 py-4 font-semibold text-center">Status</th>
                                        <th className="px-6 py-4 font-semibold">Country</th>
                                        <th className="px-6 py-4 font-semibold">Created At</th>
                                        <th className="px-6 py-4 font-semibold text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {staff.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border border-gray-100">
                                                        <AvatarImage src={user.image ? `/storage/${user.image}` : ""} />
                                                        <AvatarFallback className="bg-blue-50 text-blue-600 font-medium text-xs">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-gray-900">{user.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                            <td className="px-6 py-4 text-gray-600">{user.phone || "—"}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles.map((role) => (
                                                        <span key={role.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-medium border border-gray-200">
                                                            {role.name}
                                                        </span>
                                                    ))}
                                                    {user.roles.length === 0 && <span className="text-gray-400">No role</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.status === 'active'
                                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                                        : 'bg-red-50 text-red-700 border border-red-100'
                                                    }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`} />
                                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    {user.country && <span>{user.country}</span>}
                                                    {!user.country && <span className="text-gray-400">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(user.created_at).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/staff/${user.id}`}>View Profile</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/staff/${user.id}/edit`}>Edit Staff</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600"
                                                            onClick={() => handleDelete(user.id)}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-500">
                            <div>{staff.length} staff members total</div>
                        </div>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
