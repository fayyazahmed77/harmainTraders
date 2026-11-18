import React, { useState } from "react";
import { Link, router, usePage } from "@inertiajs/react";
import {
    LayoutDashboard,
    Package,
    Receipt,
    BookOpen,
    Store,
    LogOut,
    Sun,
    Moon,
    User,
    ChevronDown,
    Menu,
    X,
    Building2,
    ShieldCheck,
    Clock,
    MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { KeyRound, Lock } from "lucide-react";
import { useAppearance } from "@/hooks/use-appearance";
import { cn } from "@/lib/utils";

interface CustomerUser {
    id: number;
    name: string;
    username: string;
    mobile: string;
    business_name?: string | null;
    approval_status: string;
    account_id?: number | null;
    is_active?: boolean;
    must_change_password?: boolean;
    account?: {
        id: number;
        code: string;
        title: string;
    } | null;
}

interface Props {
    children: React.ReactNode;
    customer?: CustomerUser;
}

export default function CustomerPortalLayout({ children, customer: propCustomer }: Props) {
    const page = usePage();
    const customer = propCustomer || (page.props.auth as any)?.customer as CustomerUser;
    const { appearance, updateAppearance } = useAppearance();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Password Update Modal State
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSubmitting, setPasswordSubmitting] = useState(false);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        if (newPassword.length < 6) {
            setPasswordError("New password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== newPasswordConfirmation) {
            setPasswordError("New password confirmation does not match.");
            return;
        }

        setPasswordSubmitting(true);
        try {
            const res = await fetch("/customer/update-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN": (document.querySelector('meta[name="csrf-token"]') as any)?.content || "",
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: newPasswordConfirmation,
                }),
            });
            const data = await res.json();
            setPasswordSubmitting(false);

            if (data.success) {
                alert("Password updated successfully!");
                setPasswordModalOpen(false);
                setCurrentPassword("");
                setNewPassword("");
                setNewPasswordConfirmation("");
                router.reload();
            } else {
                setPasswordError(data.message || data.errors?.current_password?.[0] || "Failed to update password.");
            }
        } catch (err) {
            setPasswordSubmitting(false);
            setPasswordError("Network error. Please try again.");
        }
    };

    const currentUrl = page.url;

    const handleLogout = async () => {
        await router.post("/customer/logout");
        window.location.href = "/live-offers";
    };

    const navItems = [
        { title: "Live Catalog", href: "/live-offers", icon: Store },
        { title: "Dashboard", href: "/customer/dashboard", icon: LayoutDashboard },
        { title: "My Orders", href: "/customer/orders", icon: Package },
        { title: "Invoices & Bills", href: "/customer/invoices", icon: Receipt },
        { title: "Account Ledger", href: "/customer/ledger", icon: BookOpen },
    ];

    const isItemActive = (href: string) => {
        if (href === "/live-offers") return currentUrl === "/live-offers";
        return currentUrl.startsWith(href);
    };

    const isApproved = String(customer?.approval_status || "").toLowerCase() === "approved";

    const whatsappSupportNumber = "923318102001";
    const whatsappDisplayPhone = "0331 8102001";
    const whatsappInquiryUrl = `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(
        customer
            ? `Assalam-o-Alaikum Haramain Traders! I have an inquiry regarding my wholesale account (${customer.name}${customer.business_name ? ` - ${customer.business_name}` : ""}, Mobile: ${customer.mobile}).`
            : "Assalam-o-Alaikum Haramain Traders! I have an inquiry regarding wholesale orders and portal access."
    )}`;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                    {/* Brand / Logo */}
                    <div className="flex items-center gap-6">
                        <Link href="/live-offers" className="flex items-center gap-2 group">
                            <div className="size-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center p-1.5 shadow-sm group-hover:scale-105 transition-transform">
                                <img src="/storage/img/favicon.png" className="size-full object-contain" alt="Haramain" />
                            </div>
                            <div className="leading-tight">
                                <div className="flex items-center gap-1 font-black text-base sm:text-lg tracking-tight">
                                    <span>Haramain</span>
                                    <span className="text-amber-600 dark:text-amber-500">Traders</span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Customer Portal
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const active = isItemActive(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            active
                                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        <span>{item.title}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* WhatsApp Direct Inquiry Button */}
                        <a
                            href={whatsappInquiryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`WhatsApp Inquiry: ${whatsappDisplayPhone}`}
                            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Inquiry: {whatsappDisplayPhone}</span>
                        </a>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => updateAppearance(appearance === "dark" ? "light" : "dark")}
                            className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-amber-600 transition-colors"
                            title="Toggle Theme"
                        >
                            {appearance === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-amber-600" />}
                        </button>

                        {/* Customer Profile Dropdown (Desktop) */}
                        {customer && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-all">
                                        <div className="size-7 sm:size-8 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                            {customer.name?.charAt(0)?.toUpperCase() || "C"}
                                        </div>
                                        <div className="hidden sm:block text-left leading-tight">
                                            <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                                <span className="truncate max-w-[120px]">{customer.name}</span>
                                                {isApproved ? (
                                                    <span className="inline-block size-1.5 rounded-full bg-emerald-500" title="Approved Customer" />
                                                ) : (
                                                    <span className="inline-block size-1.5 rounded-full bg-amber-500" title="Pending Approval" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                                                {customer.business_name || customer.username}
                                            </div>
                                        </div>
                                        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 p-2">
                                    <DropdownMenuLabel className="font-normal p-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                                                {customer.name}
                                            </span>
                                            {isApproved ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] px-1.5 py-0">
                                                    <ShieldCheck className="w-2.5 h-2.5 mr-0.5 inline" /> Approved
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 text-[10px] px-1.5 py-0">
                                                    <Clock className="w-2.5 h-2.5 mr-0.5 inline" /> Pending
                                                </Badge>
                                            )}
                                        </div>
                                        {customer.business_name && (
                                            <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                <Building2 className="w-3 h-3 text-zinc-400" />
                                                <span>{customer.business_name}</span>
                                            </div>
                                        )}
                                        <div className="text-[11px] font-mono text-zinc-400 mt-1">
                                            @{customer.username} • {customer.mobile}
                                        </div>
                                        {customer.account && (
                                            <div className="mt-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                ERP Code: [{customer.account.code}]
                                            </div>
                                        )}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {navItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <DropdownMenuItem key={item.href} asChild>
                                                <Link href={item.href} className="flex items-center gap-2 cursor-pointer font-semibold text-xs py-2">
                                                    <Icon className="w-4 h-4 text-zinc-400" />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPasswordModalOpen(true)} className="font-semibold text-xs py-2 cursor-pointer">
                                        <KeyRound className="w-4 h-4 mr-2 text-zinc-400" />
                                        <span>Change Password</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout} className="text-rose-600 dark:text-rose-400 focus:text-rose-600 font-semibold text-xs py-2 cursor-pointer">
                                        <LogOut className="w-4 h-4 mr-2" />
                                        <span>Sign Out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden size-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200"
                        >
                            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Drawer Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2 animate-in slide-in-from-top-2">
                        {customer && (
                            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-3 border border-zinc-200 dark:border-zinc-700">
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {customer.name}
                                </div>
                                <div className="text-xs text-zinc-500">
                                    {customer.business_name || customer.username} • {customer.mobile}
                                </div>
                            </div>
                        )}
                        {navItems.map((item) => {
                            const active = isItemActive(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                                        active
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <Icon className="w-4 h-4 text-amber-500" />
                                    <span>{item.title}</span>
                                </Link>
                            );
                        })}
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                            <a
                                href={whatsappInquiryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>WhatsApp Inquiry: {whatsappDisplayPhone}</span>
                            </a>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Temporary Password Prompt Banner */}
            {customer?.must_change_password && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                                <strong>Security Notice:</strong> You are using a temporary password. Please set a secure private password to protect your account.
                            </span>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setPasswordModalOpen(true)}
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-sm"
                        >
                            Set New Password Now
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {children}
            </main>

            {/* Change Password Dialog */}
            <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <Lock className="w-5 h-5 text-amber-600" />
                            Change Portal Password
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Enter your current password and choose a new private password for online ordering.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4 py-2">
                        {passwordError && (
                            <div className="p-2.5 text-xs rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                                {passwordError}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Current Password (or Temporary Password)
                            </label>
                            <Input
                                type="password"
                                required
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password..."
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                New Password (min 6 characters)
                            </label>
                            <Input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Choose a secure new password..."
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                                Confirm New Password
                            </label>
                            <Input
                                type="password"
                                required
                                minLength={6}
                                value={newPasswordConfirmation}
                                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                placeholder="Re-enter new password..."
                                className="h-9 text-xs"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasswordModalOpen(false)}
                                disabled={passwordSubmitting}
                                className="h-8 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={passwordSubmitting || !newPassword || !currentPassword}
                                className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {passwordSubmitting ? "Updating..." : "Update Password"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 px-4 text-center text-xs text-zinc-400">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>&copy; {new Date().getFullYear()} Haramain Traders Wholesale. All rights reserved.</p>
                    <a
                        href={whatsappInquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Customer Support & Inquiry (WhatsApp): {whatsappDisplayPhone}</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}

