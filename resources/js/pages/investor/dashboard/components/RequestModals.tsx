import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Wallet, TrendingUp, Landmark } from 'lucide-react';
import { route } from 'ziggy-js';

interface RequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableBalance: number;
    currentCapital: number;
    type: 'reinvest' | 'withdraw_profit' | 'withdraw_capital';
}

export const RequestModals = ({ isOpen, onClose, availableBalance, currentCapital, type }: RequestModalProps) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        investor_note: '',
    });

    const config = {
        reinvest: {
            title: 'Reinvest Profit',
            description: 'Add your available profit to your capital pool to increase ownership.',
            icon: TrendingUp,
            route: route('investor.requests.reinvest'),
            max: availableBalance,
            min: 5000,
        },
        withdraw_profit: {
            title: 'Withdraw Profit',
            description: 'Request to withdraw your available profit balance to your bank/cash.',
            icon: Wallet,
            route: route('investor.requests.withdraw-profit'),
            max: availableBalance,
            min: 1000,
        },
        withdraw_capital: {
            title: 'Withdraw Capital',
            description: 'Request a partial capital withdrawal. (Max 50% of current capital, 90-day cooldown applies).',
            icon: Landmark,
            route: route('investor.requests.withdraw-capital'),
            max: currentCapital * 0.5,
            min: 10000,
        }
    };

    const currentConfig = config[type];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(currentConfig.route, {
            onSuccess: () => {
                reset();
                onClose();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="border-white/10 bg-[#111318] text-[#F1F1F1]">
                <DialogHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                        <currentConfig.icon size={20} />
                    </div>
                    <DialogTitle className="text-xl font-bold">{currentConfig.title}</DialogTitle>
                    <DialogDescription className="text-[#6B7280]">
                        {currentConfig.description}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label htmlFor="amount">Amount (PKR)</Label>
                            <span className="text-[10px] text-[#6B7280]">Max: PKR {currentConfig.max.toLocaleString()}</span>
                        </div>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="border-white/5 bg-[#181C23] focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20"
                        />
                        {errors.amount && (
                            <p className="flex items-center gap-1 text-[10px] text-[#EF4444]">
                                <AlertCircle size={10} /> {errors.amount}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Reason / Note (Optional)</Label>
                        <Textarea
                            id="note"
                            placeholder="Add any additional details..."
                            value={data.investor_note}
                            onChange={(e) => setData('investor_note', e.target.value)}
                            className="border-white/5 bg-[#181C23] focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/20"
                        />
                    </div>

                    <DialogFooter className="mt-6">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={onClose}
                            className="text-[#6B7280] hover:bg-white/5 hover:text-[#F1F1F1]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="bg-[#C9A84C] text-[#0A0C10] hover:bg-[#C9A84C]/90"
                        >
                            {processing ? 'Processing...' : 'Submit Request'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
