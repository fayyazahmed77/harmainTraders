import React from 'react';
import { Link } from '@inertiajs/react';
import { Search, ShoppingBag, User, ChevronDown, LayoutDashboard, History, Sun, Moon, Monitor, LogOut } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useAppearance } from "@/hooks/use-appearance";

interface CatalogHeaderProps {
    search: string;
    setSearch: (val: string) => void;
    cartCount: number;
    cartTotal: number;
    formatCurrency: (val: number) => string;
    setCheckoutOpen: (val: boolean) => void;
    account: { title: string };
    token: string;
}

export const CatalogHeader: React.FC<CatalogHeaderProps> = ({
    search,
    setSearch,
    cartCount,
    cartTotal,
    formatCurrency,
    setCheckoutOpen,
    account,
    token
}) => {
    const { appearance, updateAppearance } = useAppearance();

    return (
        <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-40">
            <div className="max-w-[1800px] mx-auto px-4 h-20 flex items-center justify-between gap-6">
                {/* Logo Area */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <AppLogo />
                    </Link>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-xl relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products by title, code or company..."
                        className="pl-11 h-11 rounded-full bg-slate-100 dark:bg-zinc-800 border-none text-xs focus-visible:ring-2 focus-visible:ring-orange-500 transition-all shadow-inner"
                    />
                </div>

                {/* User Info & Cart */}
                <div className="flex items-center gap-3">
                    {cartCount > 0 && (
                        <Button 
                            onClick={() => setCheckoutOpen(true)}
                            className="h-11 px-4 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 gap-3 group transition-all"
                        >
                            <div className="relative">
                                <ShoppingBag size={18} />
                                <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                    {cartCount}
                                </span>
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-[10px] font-black leading-none">{formatCurrency(cartTotal)}</p>
                            </div>
                        </Button>
                    )}

                    <div className="h-8 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-11 pl-2 pr-4 rounded-full bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200/50 dark:border-zinc-700/50 flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md">
                                    <User size={16} />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-black uppercase tracking-tight leading-none">{account.title}</span>
                                    <span className="text-[8px] text-orange-500 font-bold uppercase leading-none mt-0.5">Guest User</span>
                                </div>
                                <ChevronDown size={14} className="text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-2 border-slate-200 dark:border-zinc-800 shadow-2xl">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase text-slate-400 px-3 py-2">Quick Navigation</DropdownMenuLabel>
                            <Link href={`/g/${token}`}>
                                <DropdownMenuItem className="rounded-xl h-10 gap-3 cursor-pointer">
                                    <LayoutDashboard size={16} className="text-orange-500" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Dashboard</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link href={`/g/${token}/catalog`}>
                                <DropdownMenuItem className="rounded-xl h-10 gap-3 cursor-pointer">
                                    <ShoppingBag size={16} className="text-slate-400" />
                                    <span className="text-xs font-bold uppercase tracking-tight">Shop Now</span>
                                </DropdownMenuItem>
                            </Link>
                            
                            <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-zinc-800" />
                            
                            <DropdownMenuLabel className="text-[9px] font-black uppercase text-slate-400 px-3 py-2">Appearance</DropdownMenuLabel>
                            <div className="grid grid-cols-3 gap-1 p-1">
                                <button
                                    onClick={() => updateAppearance("light")}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${appearance === 'light' ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400'}`}
                                >
                                    <Sun size={14} />
                                    <span className="text-[8px] font-black uppercase mt-1">Light</span>
                                </button>
                                <button
                                    onClick={() => updateAppearance("dark")}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${appearance === 'dark' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400'}`}
                                >
                                    <Moon size={14} />
                                    <span className="text-[8px] font-black uppercase mt-1">Dark</span>
                                </button>
                                <button
                                    onClick={() => updateAppearance("system")}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${appearance === 'system' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400'}`}
                                >
                                    <Monitor size={14} />
                                    <span className="text-[8px] font-black uppercase mt-1">System</span>
                                </button>
                            </div>

                            <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-zinc-800" />
                            
                            <Link href={`/g/${token}/logout`} method="post" as="button" className="w-full">
                                <DropdownMenuItem className="rounded-xl h-10 gap-3 cursor-pointer text-rose-500 focus:text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-500/10">
                                    <LogOut size={16} />
                                    <span className="text-xs font-black uppercase tracking-tight">Logout</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
};
