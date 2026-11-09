import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    User,
    Lock,
    Phone,
    Building2,
    MapPin,
    KeyRound,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Store,
    ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerAuthDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultTab?: 'login' | 'register' | 'code';
}

export function CustomerAuthDialog({
    open,
    onOpenChange,
    defaultTab = 'login',
}: CustomerAuthDialogProps) {
    const [tab, setTab] = useState<'login' | 'register' | 'code'>(defaultTab);

    // Login Form State
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Register Form State
    const [regName, setRegName] = useState('');
    const [regBusinessName, setRegBusinessName] = useState('');
    const [regMobile, setRegMobile] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regAddress, setRegAddress] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState<string | null>(null);

    // Code Access State
    const [customerCode, setCustomerCode] = useState('');
    const [codeLoading, setCodeLoading] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    const updateCsrfToken = (newToken: string) => {
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
        if (meta) {
            meta.content = newToken;
        }
    };

    // Handle Login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);

        if (!loginIdentifier.trim() || !loginPassword.trim()) {
            setLoginError('Please enter your username/mobile and password.');
            return;
        }

        setLoginLoading(true);

        try {
            const res = await fetch('/customer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    login: loginIdentifier.trim(),
                    password: loginPassword,
                }),
            });

            const data = await res.json();

            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }

            if (res.ok && data.success) {
                onOpenChange(false);
                window.location.reload();
            } else {
                setLoginError(data.message || data.errors?.login?.[0] || 'Invalid login credentials.');
            }
        } catch {
            setLoginError('Network error. Please check your connection and try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    // Handle Register
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError(null);

        if (!regName.trim() || !regBusinessName.trim() || !regMobile.trim() || !regUsername.trim()) {
            setRegError('Please fill in all required wholesale business fields.');
            return;
        }

        if (regPassword.length < 6) {
            setRegError('Password must be at least 6 characters.');
            return;
        }

        if (regPassword !== regPasswordConfirm) {
            setRegError('Passwords do not match.');
            return;
        }

        setRegLoading(true);

        try {
            const res = await fetch('/customer/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    name: regName.trim(),
                    business_name: regBusinessName.trim(),
                    mobile: regMobile.trim(),
                    username: regUsername.trim(),
                    address: regAddress.trim() || null,
                    password: regPassword,
                    password_confirmation: regPasswordConfirm,
                }),
            });

            const data = await res.json();

            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }

            if (res.ok && data.success) {
                onOpenChange(false);
                window.location.reload();
            } else {
                const firstErr = data.errors ? Object.values(data.errors)[0] : null;
                setRegError(
                    (Array.isArray(firstErr) ? firstErr[0] : firstErr) ||
                    data.message ||
                    'Registration could not be completed.'
                );
            }
        } catch {
            setRegError('Network error. Please check your connection.');
        } finally {
            setRegLoading(false);
        }
    };

    // Handle Customer ID / Code Access
    const handleCodeAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setCodeError(null);

        if (!customerCode.trim()) {
            setCodeError('Please enter your Customer ID or Code.');
            return;
        }

        setCodeLoading(true);

        try {
            const response = await fetch('/api/access-my-offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({ customer_id: customerCode.trim() }),
            });

            const data = await response.json();

            if (data.success && data.redirect_url) {
                onOpenChange(false);
                window.location.href = data.redirect_url;
            } else {
                setCodeError(data.message || 'Customer code not found.');
            }
        } catch {
            setCodeError('Communication error. Please check your connection.');
        } finally {
            setCodeLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
                <DialogHeader className="text-center space-y-2">
                    <div className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 mx-auto flex items-center justify-center shadow-sm">
                        <Store className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Haramain Wholesale Portal
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                        Sign in to access personalized wholesale rates, track your orders, and manage verified ERP invoices.
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs switcher */}
                <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl mt-4">
                    <button
                        type="button"
                        onClick={() => { setTab('login'); setLoginError(null); }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            tab === 'login'
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        )}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('register'); setRegError(null); }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            tab === 'register'
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        )}
                    >
                        Register
                    </button>
                    <button
                        type="button"
                        onClick={() => { setTab('code'); setCodeError(null); }}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            tab === 'code'
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        )}
                    >
                        Customer Code
                    </button>
                </div>

                {/* TAB 1: LOGIN */}
                {tab === 'login' && (
                    <form onSubmit={handleLogin} className="space-y-4 mt-4">
                        {loginError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{loginError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Username, Mobile, or Email
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="e.g. 03001234567 or username"
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    className="h-10 text-xs pl-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-mono"
                                    required
                                />
                                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    className="h-10 text-xs pl-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                                    required
                                />
                                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20"
                        >
                            {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In to Portal'}
                        </Button>

                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => { setTab('register'); setRegError(null); }}
                                className="text-xs text-zinc-500 hover:text-amber-600 font-semibold transition-colors"
                            >
                                New wholesale customer? <strong className="text-amber-600 dark:text-amber-500">Register account</strong>
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: REGISTER */}
                {tab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto pr-1">
                        {regError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{regError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Full Name *
                                </label>
                                <Input
                                    placeholder="Your Name"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Shop / Business Name *
                                </label>
                                <Input
                                    placeholder="Shop / Pharmacy Name"
                                    value={regBusinessName}
                                    onChange={(e) => setRegBusinessName(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Mobile Number *
                                </label>
                                <Input
                                    placeholder="03001234567"
                                    value={regMobile}
                                    onChange={(e) => setRegMobile(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50 font-mono"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Desired Username *
                                </label>
                                <Input
                                    placeholder="e.g. city_traders"
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50 font-mono"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                Address & City
                            </label>
                            <Input
                                placeholder="Market, Street, City"
                                value={regAddress}
                                onChange={(e) => setRegAddress(e.target.value)}
                                className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Password *
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Min 6 chars"
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                    Confirm Password *
                                </label>
                                <Input
                                    type="password"
                                    placeholder="Re-type password"
                                    value={regPasswordConfirm}
                                    onChange={(e) => setRegPasswordConfirm(e.target.value)}
                                    className="h-9 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={regLoading}
                            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20 mt-2"
                        >
                            {regLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Wholesale Account'}
                        </Button>

                        <div className="text-center pt-1">
                            <button
                                type="button"
                                onClick={() => { setTab('login'); setLoginError(null); }}
                                className="text-xs text-zinc-500 hover:text-amber-600 font-semibold transition-colors"
                            >
                                Already registered? <strong className="text-amber-600 dark:text-amber-500">Sign in</strong>
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 3: CODE ACCESS */}
                {tab === 'code' && (
                    <form onSubmit={handleCodeAccess} className="space-y-4 mt-4">
                        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                            <span className="font-bold block">Direct ERP Code Access:</span>
                            Enter your existing Haramain Traders Customer ID (e.g., 000019) to access your personalized wholesale rates.
                        </div>

                        {codeError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{codeError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                Customer ID / Account Code
                            </label>
                            <div className="relative">
                                <Input
                                    placeholder="e.g. 000019 or Code"
                                    value={customerCode}
                                    onChange={(e) => setCustomerCode(e.target.value)}
                                    className="h-10 text-xs pl-9 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-mono"
                                    required
                                />
                                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={codeLoading}
                            className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-amber-500/20"
                        >
                            {codeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Wholesale Rates'}
                        </Button>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

