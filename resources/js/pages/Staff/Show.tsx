import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import {
    Mail,
    Phone,
    MapPin,
    Linkedin,
    Facebook,
    Instagram,
    Twitter,
    ExternalLink,
    Edit,
    Briefcase,
    Building2,
    Calendar,
    Globe,
    CheckCircle2,
    ShieldCheck,
    User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    cover_image?: string;
    status: string;
    country?: string;
    job_title?: string;
    department?: string;
    bio?: string;
    linkedin_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    twitter_url?: string;
    portfolio_url?: string;
    created_at: string;
    roles: { id: number; name: string }[];
}

interface Props {
    user: User;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "Staff User Profile", href: "#" },
];

export default function StaffShow({ user }: Props) {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6 max-w-7xl mx-auto space-y-6">
                    {/* Profile Header Card */}
                    <Card className="overflow-hidden border-none shadow-sm pb-6">
                        {/* Cover Image */}
                        <div className="relative h-60 w-full bg-gradient-to-r from-blue-600 to-indigo-700">
                            {user.cover_image && (
                                <img
                                    src={`/storage/${user.cover_image}`}
                                    className="h-full w-full object-cover opacity-80"
                                    alt="Cover"
                                />
                            )}
                            <div className="absolute top-4 right-4">
                                <Button asChild variant="secondary" size="sm" className="bg-white/90 backdrop-blur hover:bg-white text-gray-800 border-none shadow-lg">
                                    <Link href={`/staff/${user.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Profile Info Section */}
                        <div className="px-10 -mt-20 flex flex-col md:flex-row items-end gap-6 relative z-10">
                            <div className="relative">
                                <Avatar className="h-44 w-44 border-4 border-white shadow-xl bg-white">
                                    <AvatarImage src={user.image ? `/storage/${user.image}` : ""} />
                                    <AvatarFallback className="bg-blue-50 text-blue-600 text-4xl font-bold">
                                        {user.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-4 right-4 bg-white p-1.5 rounded-full border border-gray-100 shadow-lg text-blue-500">
                                    <CheckCircle2 className="h-6 w-6 fill-current" />
                                </div>
                            </div>

                            <div className="flex-1 pb-4 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl font-extrabold text-gray-900">{user.name}</h1>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-100 font-medium px-3">
                                        {user.job_title || "Team Member"}
                                    </Badge>
                                    <div className="flex gap-2">
                                        {user.linkedin_url && (
                                            <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                <Linkedin className="h-4.5 w-4.5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="text-lg text-gray-500 font-medium flex items-center gap-4 flex-wrap">
                                    <span className="flex items-center gap-1.5">
                                        {user.job_title} | {user.department}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                                    <span className="flex items-center gap-1.5 bg-blue-50/50 px-2 py-1 rounded text-blue-500 border border-blue-100/50">
                                        <MapPin className="h-3.5 w-3.5" /> {user.country || "Unspecified"}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                        <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Middle Content */}
                        <div className="col-span-12 lg:col-span-8 space-y-6">
                            {/* About Me Card */}
                            <Card className="p-6 border-none shadow-sm space-y-4 min-h-[220px]">
                                <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-3 mb-4">
                                    <UserIcon className="h-5 w-5" />
                                    <h3 className="text-lg">About Me</h3>
                                </div>
                                <div className="text-gray-600 leading-relaxed text-center py-10 italic bg-gray-50/30 rounded-lg border border-dashed border-gray-200">
                                    {user.bio || "No bio added yet."}
                                </div>
                            </Card>

                            {/* Professional Details Card */}
                            <Card className="p-6 border-none shadow-sm space-y-6">
                                <div className="flex items-center gap-2 text-[#9333ea] font-bold border-b pb-3 mb-2">
                                    <Briefcase className="h-5 w-5" />
                                    <h3 className="text-lg">Professional Details</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-xl flex items-start gap-4">
                                        <div className="p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm text-blue-600">
                                            <Briefcase className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Job Title</p>
                                            <p className="text-base font-bold text-gray-800">{user.job_title || "N/A"}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-purple-50/30 border border-purple-100 rounded-xl flex items-start gap-4">
                                        <div className="p-2.5 bg-white rounded-lg border border-purple-100 shadow-sm text-purple-600">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Department</p>
                                            <p className="text-base font-bold text-gray-800">{user.department || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-green-50/30 border border-green-100 rounded-xl space-y-3">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-white rounded-lg border border-green-100 shadow-sm text-green-600">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">System Roles</p>
                                            <div className="flex flex-wrap gap-2">
                                                {user.roles.map(role => (
                                                    <span key={role.id} className="px-3 py-1 bg-white text-gray-700 rounded-lg text-xs font-bold border border-green-200 shadow-sm">
                                                        {role.name}
                                                    </span>
                                                ))}
                                                {user.roles.length === 0 && <span className="text-gray-500 italic">No roles assigned</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column: Contact & Account Status */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            {/* Contact Info Card */}
                            <Card className="p-6 border-none shadow-sm space-y-6">
                                <div className="flex items-center gap-2 text-green-600 font-bold border-b pb-3 mb-2">
                                    <Phone className="h-5 w-5" />
                                    <h3 className="text-lg">Contact Info</h3>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                                            <p className="font-bold text-gray-700">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone Number</p>
                                            <p className="font-bold text-gray-700">{user.phone || "—"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Status Section */}
                                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-500">Account Status</div>
                                    <Badge className={`font-bold px-3 ${user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 'bg-red-100 text-red-700 hover:bg-red-100 border-none'}`}>
                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                    </Badge>
                                </div>
                            </Card>

                            {/* Social Profiles Card */}
                            {(user.linkedin_url || user.facebook_url || user.instagram_url || user.twitter_url || user.portfolio_url) && (
                                <Card className="p-6 border-none shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 text-indigo-600 font-bold border-b pb-3 mb-2">
                                        <Globe className="h-5 w-5" />
                                        <h3 className="text-lg">Social Links</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {user.linkedin_url && (
                                            <a href={user.linkedin_url} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-blue-100 group">
                                                <div className="p-2 bg-blue-50 text-blue-600 rounded">
                                                    <Linkedin className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">LinkedIn Profile</span>
                                                <ExternalLink className="h-3 h-3 ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {user.portfolio_url && (
                                            <a href={user.portfolio_url} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                                <div className="p-2 bg-gray-100 text-gray-600 rounded">
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">Portfolio</span>
                                                <ExternalLink className="h-3 h-3 ml-auto text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
