import React from 'react';
import { useForm } from '@inertiajs/react';
import { Shield, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AccessRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RESOURCE_MODULES = [
    { value: 'finance.journal-vouchers', label: 'Journal Vouchers (Finance)' },
    { value: 'procurement.payments', label: 'Payments Management (Procurement)' },
    { value: 'staff.payroll', label: 'Payroll & Salaries (Staff)' },
    { value: 'inventory.stock-adjustments', label: 'Stock Adjustments (Inventory)' },
    { value: 'admin.settings', label: 'System Settings (Admin)' },
];

const ACTION_TYPES = [
    { value: 'read', label: 'Read / View Only' },
    { value: 'write', label: 'Write / Modify' },
    { value: 'approve', label: 'Approve Actions' },
    { value: 'manage', label: 'Full Management' },
];

export function AccessRequestModal({ isOpen, onClose }: AccessRequestModalProps) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        resource_type: RESOURCE_MODULES[0].value,
        action_type: ACTION_TYPES[0].value,
        justification: '',
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/api/v1/access-requests', {
            onSuccess: () => {
                reset();
                onClose();
                // Flash success message handled by global toast/flash system
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30">
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                            <Shield className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                            Request Module Access
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    
                    {/* Resource Select */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Select Module / Resource
                        </label>
                        <select
                            value={data.resource_type}
                            onChange={e => setData('resource_type', e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary transition-all"
                        >
                            {RESOURCE_MODULES.map(m => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        {errors.resource_type && (
                            <p className="text-[11px] text-red-500">{errors.resource_type}</p>
                        )}
                    </div>

                    {/* Action Select */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Required Action / Scope
                        </label>
                        <select
                            value={data.action_type}
                            onChange={e => setData('action_type', e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary transition-all"
                        >
                            {ACTION_TYPES.map(a => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                            ))}
                        </select>
                        {errors.action_type && (
                            <p className="text-[11px] text-red-500">{errors.action_type}</p>
                        )}
                    </div>

                    {/* Justification Box */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            Business Justification
                        </label>
                        <textarea
                            value={data.justification}
                            onChange={e => setData('justification', e.target.value)}
                            placeholder="Please explain why you need access to this sensitive resource (e.g. voucher allocations, salary approvals)..."
                            className="w-full h-24 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary resize-none transition-all"
                            required
                        />
                        {errors.justification && (
                            <p className="text-[11px] text-red-500">{errors.justification}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose}
                            className="flex-1 h-10 text-xs font-bold uppercase tracking-wider"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="flex-1 h-10 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/95 text-neutral-950"
                        >
                            {processing ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Submitting
                                </span>
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
