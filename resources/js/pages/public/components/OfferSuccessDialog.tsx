import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogTitle, 
    DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, ExternalLink, MessageSquare } from 'lucide-react';

interface OfferSuccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: string | null;
    customerCode: string | null;
    guestToken: string | null;
}

export const OfferSuccessDialog: React.FC<OfferSuccessDialogProps> = ({
    open,
    onOpenChange,
    invoice,
    customerCode,
    guestToken,
}) => {
    const handleWhatsApp = () => {
        const message = `Hello Harmain Traders, I have placed order #${invoice} under Customer Code ${customerCode}. Please confirm my order!`;
        window.open(`https://wa.me/923323218684?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-surface-1 border-border rounded-2xl p-6 text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>

                <DialogTitle className="font-display font-black text-2xl uppercase tracking-tight text-text-primary">
                    Order Submitted!
                </DialogTitle>

                <DialogDescription className="text-xs text-text-muted mt-2">
                    Your order has been recorded successfully and sent to our sales team for verification.
                </DialogDescription>

                <div className="my-6 p-4 bg-surface-2 border border-border rounded-xl space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-mono-jet uppercase text-text-muted font-bold">Invoice Ref:</span>
                        <span className="font-mono-jet font-bold text-amber text-sm">{invoice}</span>
                    </div>
                    {customerCode && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-mono-jet uppercase text-text-muted font-bold">Customer Code:</span>
                            <span className="font-mono-jet font-bold text-text-primary text-sm">{customerCode}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <Button 
                        onClick={handleWhatsApp}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-xs uppercase h-11 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Confirm via WhatsApp
                    </Button>

                    {guestToken && (
                        <Button 
                            variant="outline"
                            onClick={() => window.location.href = `/g/${guestToken}`}
                            className="w-full border-border bg-surface-2 hover:bg-surface-3 text-text-primary font-bold text-xs uppercase h-11 rounded-xl flex items-center justify-center gap-2"
                        >
                            View Order Portal
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    )}

                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="w-full text-xs text-text-muted mt-2"
                    >
                        Continue Browsing
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
