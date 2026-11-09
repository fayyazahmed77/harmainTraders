import React, { useState, useEffect } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
    UserCheck, 
    UserPlus, 
    Loader2, 
    CheckCircle2, 
    ShoppingBag, 
    AlertCircle,
    LogOut,
    Building2,
    Phone,
    MapPin,
    ShieldCheck,
    Clock,
    FileText
} from 'lucide-react';

interface CartItem {
    item_id: number;
    title: string;
    code?: string;
    company?: string;
    qty_carton: number;
    qty_pcs: number;
    price_carton: number;
    price_piece: number;
    subtotal: number;
    scheme?: string;
}

interface OfferCheckoutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cart: Record<number, CartItem>;
    cartTotal: number;
    offerId?: number | string | null;
    formatCurrency: (amount: number) => string;
    onSuccess: (invoice: string, customerCode: string, token: string, extra?: any) => void;
}

export const OfferCheckoutDialog: React.FC<OfferCheckoutDialogProps> = ({
    open,
    onOpenChange,
    cart,
    cartTotal,
    offerId,
    formatCurrency,
    onSuccess,
}) => {
    // Auth mode: 'authenticated' | 'login' | 'register'
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [customerUser, setCustomerUser] = useState<any | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(false);

    // Login Form State
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);

    // Registration Form State
    const [regName, setRegName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regMobile, setRegMobile] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
    const [regBusinessName, setRegBusinessName] = useState('');
    const [regAddress, setRegAddress] = useState('');
    const [registering, setRegistering] = useState(false);
    const [regError, setRegError] = useState<string | null>(null);

    // Order Submission State
    const [customerNotes, setCustomerNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState<string>('');

    const cartList = Object.values(cart);

    const updateCsrfToken = (newToken?: string) => {
        if (!newToken) return;
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) {
            meta.setAttribute('content', newToken);
        }
    };

    const getCsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
        return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    };

    // Check if customer is already authenticated
    const checkCustomerAuth = async () => {
        setLoadingAuth(true);
        try {
            const res = await fetch('/customer/me');
            const data = await res.json();
            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }
            if (data.authenticated && data.customer) {
                setCustomerUser(data.customer);
            } else {
                setCustomerUser(null);
            }
        } catch {
            setCustomerUser(null);
        } finally {
            setLoadingAuth(false);
        }
    };

    useEffect(() => {
        if (open) {
            checkCustomerAuth();
            setOrderError(null);
            setLoginError(null);
            setRegError(null);
            setIdempotencyKey('idemp_' + Math.random().toString(36).substring(2) + Date.now());
        }
    }, [open]);

    // Handle Login
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setLoggingIn(true);

        try {
            const res = await fetch('/customer/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    login: loginIdentifier,
                    password: loginPassword,
                }),
            });

            const data = await res.json();
            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }

            if (res.ok && data.success) {
                await checkCustomerAuth();
            } else {
                setLoginError(data.message || data.errors?.login?.[0] || 'Invalid login credentials.');
            }
        } catch {
            setLoginError('Network error. Unable to connect to server.');
        } finally {
            setLoggingIn(false);
        }
    };

    // Handle Registration
    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegError(null);

        if (regPassword !== regPasswordConfirm) {
            setRegError('Password confirmation does not match.');
            return;
        }

        setRegistering(true);

        try {
            const res = await fetch('/customer/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    name: regName,
                    username: regUsername,
                    mobile: regMobile,
                    email: regEmail || null,
                    password: regPassword,
                    password_confirmation: regPasswordConfirm,
                    business_name: regBusinessName || null,
                    address: regAddress || null,
                }),
            });

            const data = await res.json();
            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }

            if (res.ok && data.success) {
                await checkCustomerAuth();
            } else {
                const firstErr = data.errors ? Object.values(data.errors)[0] : data.message;
                setRegError(Array.isArray(firstErr) ? firstErr[0] : (firstErr || 'Registration failed.'));
            }
        } catch {
            setRegError('Network error during registration.');
        } finally {
            setRegistering(false);
        }
    };

    // Handle Logout / Switch
    const handleLogout = async () => {
        try {
            const res = await fetch('/customer/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
            });
            const data = await res.json();
            if (data.csrf_token) {
                updateCsrfToken(data.csrf_token);
            }
            setCustomerUser(null);
        } catch {
            setCustomerUser(null);
        }
    };

    // Handle Place Order
    const handlePlaceOrder = async () => {
        if (!customerUser) return;
        setSubmitting(true);
        setOrderError(null);

        try {
            const payload = {
                offer_id: offerId || null,
                auth_type: 'authenticated',
                customer_notes: customerNotes,
                idempotency_key: idempotencyKey,
                items: cartList.map(it => ({
                    item_id: it.item_id,
                    qty_carton: it.qty_carton,
                    qty_pcs: it.qty_pcs,
                })),
            };

            const response = await fetch('/api/place-offer-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onSuccess(data.order_no || data.invoice, data.customer_code || customerUser.username, customerUser.id, {
                    whatsapp_url: data.whatsapp_url,
                    approval_status: data.approval_status,
                    final_total: data.final_total,
                });
            } else {
                setOrderError(data.message || 'Failed to place order.');
            }
        } catch {
            setOrderError('Network error. Could not connect to order processing server.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-surface-1 border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
                {/* Modal Header */}
                <div className="bg-surface-2 border-b border-border p-6">
                    <DialogTitle className="font-display font-black text-xl uppercase tracking-tight text-text-primary flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-amber" />
                        Wholesale Order Checkout
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-muted mt-1">
                        Authoritative offer pricing is calculated on the server and staged for admin review.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Cart Summary Header */}
                    <div className="bg-surface-2/60 border border-border/80 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono-jet uppercase text-text-muted font-bold block">
                                Order Subtotal ({cartList.length} items)
                            </span>
                            <span className="font-display font-black text-2xl text-amber">
                                {formatCurrency(cartTotal)}
                            </span>
                        </div>
                        <Badge className="bg-amber/15 text-amber border-amber/30 text-xs px-3 py-1 font-bold">
                            Live Offer Rates
                        </Badge>
                    </div>

                    {/* Authenticated Customer View */}
                    {customerUser ? (
                        <div className="space-y-4">
                            <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-amber/10 text-amber font-bold flex items-center justify-center text-xs">
                                            {customerUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-text-primary">{customerUser.name}</div>
                                            <div className="text-xs text-text-muted">@{customerUser.username} &bull; {customerUser.mobile}</div>
                                        </div>
                                    </div>

                                    {/* Approval Status Badge */}
                                    {customerUser.approval_status === 'approved' && (
                                        <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 flex items-center gap-1 font-bold">
                                            <ShieldCheck size={12} /> Approved
                                        </Badge>
                                    )}
                                    {customerUser.approval_status === 'pending' && (
                                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 flex items-center gap-1 font-bold">
                                            <Clock size={12} /> Pending Approval
                                        </Badge>
                                    )}
                                    {customerUser.approval_status === 'rejected' && (
                                        <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 flex items-center gap-1 font-bold">
                                            <AlertCircle size={12} /> Account Rejected
                                        </Badge>
                                    )}
                                </div>

                                {customerUser.business_name && (
                                    <div className="flex items-center gap-2 text-xs text-text-secondary pt-1 border-t border-border/50">
                                        <Building2 size={13} className="text-text-muted" />
                                        <span>Business: <strong>{customerUser.business_name}</strong></span>
                                    </div>
                                )}

                                {customerUser.address && (
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <MapPin size={13} className="text-text-muted" />
                                        <span>Address: {customerUser.address}</span>
                                    </div>
                                )}

                                <div className="pt-2 flex justify-between items-center text-xs border-t border-border/50">
                                    <span className="text-text-muted">Not you?</span>
                                    <button 
                                        type="button" 
                                        onClick={handleLogout}
                                        className="text-amber hover:underline font-bold flex items-center gap-1"
                                    >
                                        <LogOut size={12} /> Log out / Switch
                                    </button>
                                </div>
                            </div>

                            {/* Eligibility Alert Banner */}
                            {!customerUser.can_place_order && (
                                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold">Order Placement Blocked</div>
                                        <div className="mt-0.5">{customerUser.eligibility_message}</div>
                                    </div>
                                </div>
                            )}

                            {customerUser.approval_status === 'pending' && customerUser.can_place_order && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-xs">
                                    <Clock size={16} className="shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Initial Order Allowance:</strong> As a newly registered customer, you may submit this single initial order. Our administration will review your wholesale registration along with this order.
                                    </div>
                                </div>
                            )}

                            {/* Customer Instructions / Notes */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                                    <FileText size={13} className="text-amber" />
                                    Order Instructions / Remarks (Optional)
                                </Label>
                                <Input
                                    value={customerNotes}
                                    onChange={(e) => setCustomerNotes(e.target.value)}
                                    placeholder="e.g. Special packing requests, transport carrier preference, etc."
                                    className="bg-surface-2 border-border text-xs rounded-xl"
                                />
                            </div>

                            {/* Error Alert */}
                            {orderError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle size={15} />
                                    {orderError}
                                </div>
                            )}

                            {/* Submit Order Button */}
                            <Button 
                                onClick={handlePlaceOrder}
                                disabled={submitting || !customerUser.can_place_order || cartList.length === 0}
                                className="w-full h-12 bg-amber hover:bg-amber-bright text-surface-0 font-display font-black text-sm uppercase rounded-xl tracking-wider transition-all shadow-lg shadow-amber/20 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin mr-2" />
                                        Submitting Order to Haramain ERP...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={16} className="mr-2" />
                                        Confirm & Submit Wholesale Order
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        /* Unauthenticated Customer View: Tabs for Login vs Registration */
                        <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full space-y-4">
                            <TabsList className="grid grid-cols-2 bg-surface-2 p-1 rounded-xl border border-border">
                                <TabsTrigger 
                                    value="login"
                                    className="rounded-lg font-display font-bold text-xs uppercase data-[state=active]:bg-amber data-[state=active]:text-surface-0 transition-all flex items-center gap-2"
                                >
                                    <UserCheck className="w-4 h-4" />
                                    Customer Login
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="register"
                                    className="rounded-lg font-display font-bold text-xs uppercase data-[state=active]:bg-amber data-[state=active]:text-surface-0 transition-all flex items-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    New Registration
                                </TabsTrigger>
                            </TabsList>

                            {/* LOGIN TAB */}
                            <TabsContent value="login" className="space-y-4 pt-1">
                                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-text-muted">Username, Mobile, or Customer Code</Label>
                                        <Input 
                                            value={loginIdentifier}
                                            onChange={(e) => setLoginIdentifier(e.target.value)}
                                            placeholder="e.g. 03323228684 or username"
                                            required
                                            className="bg-surface-2 border-border text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-text-muted">Password</Label>
                                        <Input 
                                            type="password"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            placeholder="Enter your account password"
                                            required
                                            className="bg-surface-2 border-border text-xs rounded-xl"
                                        />
                                    </div>

                                    {loginError && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                            <AlertCircle size={15} />
                                            {loginError}
                                        </div>
                                    )}

                                    <Button 
                                        type="submit"
                                        disabled={loggingIn || !loginIdentifier || !loginPassword}
                                        className="w-full h-11 bg-amber hover:bg-amber-bright text-surface-0 font-bold text-xs uppercase rounded-xl"
                                    >
                                        {loggingIn ? <Loader2 size={16} className="animate-spin" /> : 'Log In & Continue Checkout'}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* REGISTRATION TAB */}
                            <TabsContent value="register" className="space-y-4 pt-1">
                                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Full Name *</Label>
                                            <Input 
                                                value={regName}
                                                onChange={(e) => setRegName(e.target.value)}
                                                placeholder="e.g. Muhammad Fayyaz"
                                                required
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Username *</Label>
                                            <Input 
                                                value={regUsername}
                                                onChange={(e) => setRegUsername(e.target.value)}
                                                placeholder="e.g. fayyaz_traders"
                                                required
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Mobile Number *</Label>
                                            <Input 
                                                value={regMobile}
                                                onChange={(e) => setRegMobile(e.target.value)}
                                                placeholder="03323228684"
                                                required
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Email (Optional)</Label>
                                            <Input 
                                                type="email"
                                                value={regEmail}
                                                onChange={(e) => setRegEmail(e.target.value)}
                                                placeholder="fayyaz@example.com"
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Password *</Label>
                                            <Input 
                                                type="password"
                                                value={regPassword}
                                                onChange={(e) => setRegPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                required
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-text-muted">Confirm Password *</Label>
                                            <Input 
                                                type="password"
                                                value={regPasswordConfirm}
                                                onChange={(e) => setRegPasswordConfirm(e.target.value)}
                                                placeholder="Re-enter password"
                                                required
                                                className="bg-surface-2 border-border text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-text-muted">Business / Shop Name</Label>
                                        <Input 
                                            value={regBusinessName}
                                            onChange={(e) => setRegBusinessName(e.target.value)}
                                            placeholder="e.g. Al-Madina Medical Store"
                                            className="bg-surface-2 border-border text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-text-muted">Shop Address / Delivery City</Label>
                                        <Input 
                                            value={regAddress}
                                            onChange={(e) => setRegAddress(e.target.value)}
                                            placeholder="e.g. Shop #12, Wholesale Market, Karachi"
                                            className="bg-surface-2 border-border text-xs rounded-xl"
                                        />
                                    </div>

                                    {regError && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 rounded-xl text-xs flex items-center gap-2">
                                            <AlertCircle size={15} />
                                            {regError}
                                        </div>
                                    )}

                                    <Button 
                                        type="submit"
                                        disabled={registering}
                                        className="w-full h-11 bg-amber hover:bg-amber-bright text-surface-0 font-bold text-xs uppercase rounded-xl"
                                    >
                                        {registering ? <Loader2 size={16} className="animate-spin" /> : 'Register & Proceed to Place Order'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
