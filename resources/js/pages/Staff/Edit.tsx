import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { BreadcrumbItem } from "@/types";
import { Camera, Linkedin, Facebook, Instagram, Twitter, ExternalLink, Save, ArrowLeft, Plus, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Link, useForm } from "@inertiajs/react";

interface Role {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    image?: string;
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
}

interface Props {
    user: User;
    roles: Role[];
    userRoles: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: "Staff", href: "/staff" },
    { title: "Edit Staff", href: "#" },
];

export default function StaffEdit({ user, roles, userRoles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        _method: "PUT",
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        password: "",
        password_confirmation: "",
        country: user.country || "",
        status: user.status === "active",
        job_title: user.job_title || "",
        department: user.department || "",
        bio: user.bio || "",
        linkedin_url: user.linkedin_url || "",
        facebook_url: user.facebook_url || "",
        instagram_url: user.instagram_url || "",
        twitter_url: user.twitter_url || "",
        portfolio_url: user.portfolio_url || "",
        roles: userRoles || [],
        image: null as File | null,
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Inertia's PUT with file upload support is better handled via POST with _method: 'PUT'
        post(`/staff/${user.id}`);
    };

    const handleRoleChange = (roleName: string) => {
        const currentRoles = [...data.roles];
        if (currentRoles.includes(roleName)) {
            setData("roles", currentRoles.filter(r => r !== roleName));
        } else {
            setData("roles", [...currentRoles, roleName]);
        }
    };

    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader breadcrumbs={breadcrumbs} />

                <div className="p-6">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <div className="flex items-center gap-4">
                            <Button asChild variant="outline" size="icon" className="rounded-full h-10 w-10">
                                <Link href={`/staff/${user.id}`}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Edit Staff Member</h1>
                                <p className="text-muted-foreground">Modify details for <span className="text-gray-900 font-semibold">{user.name}</span></p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
                            {/* Left Column: Form Details */}
                            <div className="col-span-12 lg:col-span-8 space-y-6">
                                {/* Staff Details Card */}
                                <Card className="p-6 border shadow-sm space-y-4">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-lg font-semibold">Staff Details</h2>
                                        <p className="text-xs text-muted-foreground">Basic information and login credentials.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g. John Doe"
                                                value={data.name}
                                                onChange={e => setData("name", e.target.value)}
                                            />
                                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="admin@gmail.com"
                                                value={data.email}
                                                onChange={e => setData("email", e.target.value)}
                                            />
                                            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                placeholder="+1 234 567 890"
                                                value={data.phone}
                                                onChange={e => setData("phone", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Select onValueChange={val => setData("country", val)} value={data.country}>
                                                <SelectTrigger className="w-full"> 
                                                    <SelectValue placeholder="Select Country" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Pakistan">Pakistan</SelectItem>
                                                    <SelectItem value="United States">United States</SelectItem>
                                                    <SelectItem value="Germany">Germany</SelectItem>
                                                    <SelectItem value="India">India</SelectItem>
                                                    <SelectItem value="Kenya">Kenya</SelectItem>
                                                    <SelectItem value="Iran">Iran</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Update Password <span className="text-xs text-muted-foreground font-normal">(Leave blank to keep current)</span></Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={data.password}
                                                    onChange={e => setData("password", e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation">Confirm Updated Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showPassword ? "text" : "password"}
                                                    value={data.password_confirmation}
                                                    onChange={e => setData("password_confirmation", e.target.value)}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox
                                            id="status"
                                            checked={data.status}
                                            onCheckedChange={checked => setData("status", !!checked)}
                                        />
                                        <Label htmlFor="status" className="cursor-pointer">Active Staff</Label>
                                    </div>
                                </Card>

                                {/* Additional Information Card */}
                                <Card className="p-6 border shadow-sm space-y-4">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-lg font-semibold">Additional Information</h2>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="job_title">Job Title</Label>
                                        <Input
                                            id="job_title"
                                            placeholder="e.g. Senior Developer"
                                            value={data.job_title}
                                            onChange={e => setData("job_title", e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department">Department</Label>
                                        <Select onValueChange={val => setData("department", val)} value={data.department}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Engineering">Engineering</SelectItem>
                                                <SelectItem value="Marketing">Marketing</SelectItem>
                                                <SelectItem value="Sales">Sales</SelectItem>
                                                <SelectItem value="Human Resources">Human Resources</SelectItem>
                                                <SelectItem value="Administration">Administration</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            placeholder="Short biography..."
                                            className="min-h-[120px]"
                                            value={data.bio}
                                            onChange={e => setData("bio", e.target.value)}
                                        />
                                    </div>
                                </Card>

                                {/* Social Profiles Card */}
                                <Card className="p-6 border shadow-sm space-y-4">
                                    <div className="border-b pb-2 mb-4">
                                        <h2 className="text-lg font-semibold">Social Profiles</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Linkedin className="h-4 w-4 text-blue-600" /> LinkedIn URL
                                            </Label>
                                            <Input
                                                placeholder="https://linkedin.com/in/..."
                                                value={data.linkedin_url}
                                                onChange={e => setData("linkedin_url", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Facebook className="h-4 w-4 text-blue-800" /> Facebook URL
                                            </Label>
                                            <Input
                                                placeholder="https://facebook.com/..."
                                                value={data.facebook_url}
                                                onChange={e => setData("facebook_url", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Instagram className="h-4 w-4 text-pink-600" /> Instagram URL
                                            </Label>
                                            <Input
                                                placeholder="https://instagram.com/..."
                                                value={data.instagram_url}
                                                onChange={e => setData("instagram_url", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <Twitter className="h-4 w-4 text-blue-400" /> X (Twitter) URL
                                            </Label>
                                            <Input
                                                placeholder="https://x.com/..."
                                                value={data.twitter_url}
                                                onChange={e => setData("twitter_url", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4 text-gray-600" /> Other Profile URL
                                        </Label>
                                        <Input
                                            placeholder="https://portfolio.com/..."
                                            value={data.portfolio_url}
                                            onChange={e => setData("portfolio_url", e.target.value)}
                                        />
                                    </div>
                                </Card>
                            </div>

                            {/* Right Column: Profile Image & Roles */}
                            <div className="col-span-12 lg:col-span-4 space-y-6">
                                {/* Profile Image Card */}
                                <Card className="p-6 border shadow-sm flex flex-col items-center text-center space-y-4">
                                    <h2 className="text-lg font-semibold w-full text-left">Profile Image</h2>
                                    <div className="relative group">
                                        <div className="h-40 w-40 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden">
                                            {data.image ? (
                                                <img
                                                    src={URL.createObjectURL(data.image)}
                                                    alt="Preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : user.image ? (
                                                <img
                                                    src={`/storage/${user.image}`}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Camera className="h-10 w-10 text-gray-300" />
                                            )}
                                        </div>
                                        <Label
                                            htmlFor="image-upload"
                                            className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Label>
                                        <input
                                            id="image-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={e => setData("image", e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-4">Click the button to change the profile image.</p>
                                </Card>

                                {/* Assign Roles Card */}
                                <Card className="p-6 border shadow-sm space-y-4">
                                    <h2 className="text-lg font-semibold">Update Roles</h2>
                                    <p className="text-xs text-muted-foreground">Modify roles for access control.</p>

                                    <div className="border rounded-md divide-y overflow-hidden max-h-[200px] overflow-y-auto bg-gray-50/30">
                                        {roles.map(role => (
                                            <div key={role.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors">
                                                <Checkbox
                                                    id={`role-${role.id}`}
                                                    checked={data.roles.includes(role.name)}
                                                    onCheckedChange={() => handleRoleChange(role.name)}
                                                />
                                                <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer font-normal">
                                                    {role.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-[#2DA9E1] hover:bg-[#258dbd] text-white font-bold transition-all shadow-md"
                                    disabled={processing}
                                >
                                    <Save className="mr-2 h-5 w-5" />
                                    {processing ? "Updating..." : "Update Staff Member"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
