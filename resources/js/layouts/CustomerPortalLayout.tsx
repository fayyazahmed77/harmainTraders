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
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
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

            {/* Main Content */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400">
                <p>&copy; {new Date().getFullYear()} Haramain Traders Wholesale. All rights reserved.</p>
            </footer>
        </div>
    );
}

