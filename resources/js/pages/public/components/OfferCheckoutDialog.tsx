import React, { useState } from 'react';
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
    ArrowRight
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
    onSuccess: (invoice: string, customerCode: string, token: string) => void;
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
    const [authType, setAuthType] = useState<'existing' | 'new'>('existing');
    
    // Existing customer state
    const [customerCode, setCustomerCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifiedCustomer, setVerifiedCustomer] = useState<any | null>(null);
    const [verifyError, setVerifyError] = useState<string | null>(null);

    // New customer state
    const [name, setName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Order submit state
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);

    const cartList = Object.values(cart);

    const handleVerifyCustomer = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!customerCode.trim()) return;

        setVerifying(true);
        setVerifyError(null);
        setVerifiedCustomer(null);

        try {
            const response = await fetch('/api/verify-customer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ customer_id: customerCode }),
            });

            const data = await response.json();

            if (data.success) {
                setVerifiedCustomer(data.account);
            } else {
                setVerifyError(data.message || 'Customer code not found.');
            }
        } catch (err) {
            setVerifyError('Network error. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const handlePlaceOrder = async () => {
        setSubmitting(true);
        setOrderError(null);

        try {
            const payload = {
                offer_id: offerId || null,
                auth_type: authType,
                customer_code: authType === 'existing' ? customerCode : null,
                name: authType === 'new' ? name : null,
                phone: authType === 'new' ? phone : null,
                business_name: authType === 'new' ? businessName : null,
                address: authType === 'new' ? address : null,
                items: cartList.map(it => ({
                    item_id: it.item_id,
                    qty_carton: it.qty_carton,
                    qty_pcs: it.qty_pcs,
                    price_carton: it.price_carton,
                    price_piece: it.price_piece,
                })),
            };

            const response = await fetch('/api/place-offer-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                onSuccess(data.invoice, data.customer_code, data.guest_token);
            } else {
                setOrderError(data.message || 'Failed to place order.');
            }
        } catch (err) {
            setOrderError('Network error. Could not connect to server.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-surface-1 border-border rounded-2xl p-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-surface-2 border-b border-border p-6">
                    <DialogTitle className="font-display font-black text-xl uppercase tracking-tight text-text-primary flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-amber" />
                        Checkout & Order Confirmation
                    </DialogTitle>
                    <DialogDescription className="text-xs text-text-muted mt-1">
                        Select customer authentication mode to place your order according to current offer pricing.
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Cart Summary Header */}
                    <div className="bg-surface-2/60 border border-border/80 rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-mono-jet uppercase text-text-muted font-bold block">
                                Order Summary ({cartList.length} items)
                            </span>
                            <span className="font-display font-black text-2xl text-amber">
                                {formatCurrency(cartTotal)}
                            </span>
                        </div>
                        <Badge className="bg-amber/15 text-amber border-amber/30 text-xs px-3 py-1 font-bold">
                            Live Offer Rates
                        </Badge>
                    </div>

                    {/* Auth Choice Tabs */}
                    <Tabs value={authType} onValueChange={(v) => setAuthType(v as any)} className="w-full">
                        <TabsList className="grid grid-cols-2 bg-surface-2 p-1 rounded-xl border border-border">
                            <TabsTrigger 
                                value="existing"
                                className="rounded-lg font-display font-bold text-xs uppercase data-[state=active]:bg-amber data-[state=active]:text-surface-0 transition-all flex items-center gap-2"
                            >
                                <UserCheck className="w-4 h-4" />
                                Existing Customer
                            </TabsTrigger>
                            <TabsTrigger 
                                value="new"
                                className="rounded-lg font-display font-bold text-xs uppercase data-[state=active]:bg-amber data-[state=active]:text-surface-0 transition-all flex items-center gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                New Customer
                            </TabsTrigger>
                        </TabsList>

                        {/* Existing Customer Tab */}
                        <TabsContent value="existing" className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-text-secondary">
                                    Customer Code or Registered Phone Number
                                </Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="e.g. C-001 or 0332XXXXXXX"
                                        value={customerCode}
                                        onChange={(e) => setCustomerCode(e.target.value)}
                                        className="bg-surface-2 border-border text-sm font-mono-jet"
                                    />
                                    <Button 
                                        type="button"
                                        onClick={() => handleVerifyCustomer()}
                                        disabled={verifying || !customerCode.trim()}
                                        className="bg-surface-3 hover:bg-amber hover:text-surface-0 text-text-primary font-bold text-xs shrink-0"
                                    >
                                        {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                                    </Button>
                                </div>
                            </div>

                            {verifyError && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {verifyError}
                                </div>
                            )}

                            {verifiedCustomer && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs space-y-1">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        Verified: {verifiedCustomer.title} ({verifiedCustomer.code})
                                    </div>
                                    {verifiedCustomer.mobile && (
                                        <p className="text-[11px] opacity-80">Phone: {verifiedCustomer.mobile}</p>
                                    )}
                                    {verifiedCustomer.address && (
                                        <p className="text-[11px] opacity-80">Address: {verifiedCustomer.address}</p>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* New Customer Registration Tab */}
                        <TabsContent value="new" className="space-y-4 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-text-secondary">
                                        Full Name *
                                    </Label>
                                    <Input 
                                        placeholder="Your Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-surface-2 border-border text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-text-secondary">
                                        Mobile / WhatsApp *
                                    </Label>
                                    <Input 
                                        placeholder="03XX XXXXXXX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="bg-surface-2 border-border text-sm font-mono-jet"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-text-secondary">
                                        Business / Shop Name
                                    </Label>
                                    <Input 
                                        placeholder="e.g. Super Mart"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        className="bg-surface-2 border-border text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-text-secondary">
                                        City / Area Address
                                    </Label>
                                    <Input 
                                        placeholder="e.g. Karachi / Market"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="bg-surface-2 border-border text-sm"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {orderError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs font-medium flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {orderError}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-surface-2 border-t border-border p-4 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="text-xs text-text-muted"
                    >
                        Cancel
                    </Button>

                    <Button 
                        onClick={handlePlaceOrder}
                        disabled={submitting || (authType === 'existing' && !verifiedCustomer && !customerCode.trim()) || (authType === 'new' && (!name.trim() || !phone.trim()))}
                        className="bg-amber hover:bg-amber-bright text-surface-0 font-display font-black text-xs uppercase px-6 h-11 rounded-xl shadow-lg shadow-amber/20 flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing Order...
                            </>
                        ) : (
                            <>
                                Confirm & Place Order
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
