import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Check, X, Info, Clock, User, Shield, Server, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface AccessRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    resourceType: string;
    actionType: string;
    justification: string;
    status: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    slaDue?: string;
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    approved: { label: 'Approved', classes: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    rejected: { label: 'Rejected', classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
    more_info_requested: { label: 'Info Requested', classes: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-850 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800' },
};

export default function AccessRequestAdmin({ requests: initialRequests }: { requests: AccessRequest[] }) {
    const [requests, setRequests] = useState<AccessRequest[]>(initialRequests);
    const [processingId, setProcessingId] = useState<string | null>(null);
    
    // Action Modals State
    const [actionRequest, setActionRequest] = useState<AccessRequest | null>(null);
    const [actionType, setActionType] = useState<'reject' | 'info' | null>(null);
    const [actionText, setActionText] = useState('');

    const reloadData = async () => {
        try {
            const res = await fetch('/api/v1/access-requests/pending');
            // Wait, we need all access requests for the general dashboard, but the index API returns only pending.
            // Inertia will automatically reload props if we call router.reload(). Let's use router.reload()!
            router.reload({
                only: ['requests'],
                onSuccess: (page) => {
                    if (page.props.requests) {
                        setRequests(page.props.requests as AccessRequest[]);
                    }
                }
            });
        } catch (error) {
            console.error('Failed refreshing access requests', error);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/v1/access-requests/${id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                }
            });
            if (res.ok) {
                reloadData();
            }
        } catch (error) {
            console.error('Failed to approve request', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleExecuteAction = async () => {
        if (!actionRequest || !actionType) return;
        
        const id = actionRequest.id;
        setProcessingId(id);
        
        const endpoint = actionType === 'reject' 
            ? `/api/v1/access-requests/${id}/reject` 
            : `/api/v1/access-requests/${id}/request-info`;
        
        const payload = actionType === 'reject' 
            ? { reason: actionText } 
            : { notes: actionText };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setActionRequest(null);
                setActionType(null);
                setActionText('');
                reloadData();
            }
        } catch (error) {
            console.error(`Failed executing ${actionType}`, error);
        } finally {
            setProcessingId(null);
        }
    };

    const breadcrumbs = [
        { title: 'Admin panel', href: '#' },
        { title: 'Access Requests', href: '/admin/access-requests' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Access Request Management" />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-xl text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                                Access Request Registry
                            </h1>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Authorize, review, or clarify sensitive module access requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main List */}
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
                            <Shield className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mb-3" />
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">All Clear</p>
                            <p className="text-xs text-neutral-500">There are no access authorization requests to review.</p>
                        </div>
                    ) : (
                        requests.map((req, idx) => (
                            <motion.div
                                key={req.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-5 space-y-4 shadow-sm"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-550">{req.userName}</p>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{req.userEmail}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${STATUS_CONFIG[req.status]?.classes}`}>
                                        {STATUS_CONFIG[req.status]?.label}
                                    </span>
                                </div>

                                {/* Request Details */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850">
                                        <p className="text-[9px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-wider mb-1">Target Module</p>
                                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{req.resourceType}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850">
                                        <p className="text-[9px] font-black text-neutral-450 dark:text-neutral-500 uppercase tracking-wider mb-1">Action Level</p>
                                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 capitalize">{req.actionType}</p>
                                    </div>
                                </div>

                                {/* Justification */}
                                <div className="p-3.5 rounded-lg bg-neutral-50 dark:bg-neutral-900/40 border-l-2 border-primary text-xs text-neutral-600 dark:text-neutral-400 italic leading-relaxed">
                                    "{req.justification}"
                                </div>

                                {/* Metadata */}
                                <div className="flex flex-wrap gap-4 text-[10px] text-neutral-450 dark:text-neutral-500">
                                    <span className="flex items-center gap-1"><Server className="w-3 h-3" />{req.ipAddress}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Submitted {req.createdAt}</span>
                                    {req.slaDue && req.status === 'pending' && (
                                        <span className="flex items-center gap-1 text-amber-500"><Clock className="w-3 h-3" />SLA: {req.slaDue}</span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                {req.status === 'pending' && (
                                    <div className="flex gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-900 mt-2">
                                        <Button
                                            onClick={() => handleApprove(req.id)}
                                            disabled={processingId === req.id}
                                            className="flex items-center gap-1 px-4 h-8 rounded-lg bg-primary hover:bg-primary/95 text-neutral-950 text-[10px] font-bold uppercase tracking-wider active:scale-95"
                                        >
                                            {processingId === req.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Check className="w-3.5 h-3.5" />
                                            )}
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setActionRequest(req);
                                                setActionType('reject');
                                            }}
                                            disabled={processingId === req.id}
                                            variant="outline"
                                            className="flex items-center gap-1 px-4 h-8 rounded-lg border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 text-[10px] font-bold uppercase tracking-wider active:scale-95"
                                        >
                                            <X className="w-3.5 h-3.5" /> Reject
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setActionRequest(req);
                                                setActionType('info');
                                            }}
                                            disabled={processingId === req.id}
                                            variant="secondary"
                                            className="flex items-center gap-1 px-4 h-8 rounded-lg text-neutral-700 dark:text-neutral-350 text-[10px] font-bold uppercase tracking-wider active:scale-95"
                                        >
                                            <Info className="w-3.5 h-3.5" /> Request Info
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Reject / Info Modal overlay */}
            <AnimatePresence>
                {actionRequest && actionType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden p-6 space-y-4"
                        >
                            <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                {actionType === 'reject' ? (
                                    <>
                                        <X className="w-4 h-4 text-red-500" />
                                        Reject Access Request
                                    </>
                                ) : (
                                    <>
                                        <Info className="w-4 h-4 text-primary" />
                                        Request Clarification notes
                                    </>
                                )}
                            </h2>
                            <p className="text-xs text-neutral-555 dark:text-neutral-400">
                                Explain the decision being applied to <strong>{actionRequest.userName}</strong>'s request.
                            </p>

                            <textarea
                                value={actionText}
                                onChange={e => setActionText(e.target.value)}
                                placeholder={actionType === 'reject' ? "Rejection reason details..." : "Notes specifying what information is needed..."}
                                className="w-full h-24 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary resize-none"
                                required
                            />

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setActionRequest(null);
                                        setActionType(null);
                                        setActionText('');
                                    }}
                                    className="flex-1 h-10 text-xs font-bold uppercase tracking-wider"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleExecuteAction}
                                    disabled={processingId !== null || actionText.trim().length < 3}
                                    className={`flex-1 h-10 text-xs font-bold uppercase tracking-wider ${actionType === 'reject' ? 'bg-red-650 hover:bg-red-700 text-white' : 'bg-primary hover:bg-primary/95 text-neutral-950'}`}
                                >
                                    {processingId !== null ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        'Confirm Action'
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
