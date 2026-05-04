import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Verify2fa() {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
    });

    const [isResending, setIsResending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/verify-2fa');
    };

    const handleResend = () => {
        setIsResending(true);
        // We'll use a standard inertia post for resend
        import('@inertiajs/react').then(({ router }) => {
            router.post('/verify-2fa/resend', {}, {
                onFinish: () => setIsResending(false)
            });
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0A0C10] p-6">
            <Head title="Two-Factor Authentication" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md rounded-2xl border border-white/5 bg-[#111318] p-8 shadow-2xl"
            >
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#C9A84C]/10 text-[#C9A84C]">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-[#F1F1F1]">Security Verification</h1>
                    <p className="mt-2 text-sm text-[#6B7280]">
                        Enter the 6-digit code sent to your registered email address.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="code" className="text-[10px] font-black uppercase tracking-widest text-[#6B7280]">
                            Verification Code
                        </Label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="000000"
                            className="h-14 border-white/5 bg-[#181C23] text-center text-2xl font-black tracking-[10px] text-[#F1F1F1] placeholder:tracking-normal focus:border-[#C9A84C]/50 focus:ring-[#C9A84C]/50"
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            maxLength={6}
                            required
                            autoFocus
                        />
                        {errors.code && (
                            <p className="text-xs font-medium text-rose-500">{errors.code}</p>
                        )}
                    </div>

                    <Button 
                        type="submit" 
                        disabled={processing}
                        className="h-12 w-full bg-[#C9A84C] font-bold text-[#0A0C10] hover:bg-[#C9A84C]/90"
                    >
                        {processing ? 'Verifying...' : 'Complete Login'}
                        <ArrowRight size={18} className="ml-2" />
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="group flex items-center justify-center gap-2 text-xs font-bold text-[#6B7280] transition-colors hover:text-[#C9A84C]"
                    >
                        <RefreshCcw size={14} className={isResending ? 'animate-spin text-[#C9A84C]' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        {isResending ? 'Sending Code...' : "Didn't receive a code? Resend"}
                    </button>
                    
                    <div className="mt-6 border-t border-white/5 pt-6">
                        <Link 
                            href="/logout" 
                            method="post" 
                            as="button"
                            className="text-[10px] font-black uppercase tracking-widest text-[#374151] hover:text-[#F1F1F1] transition-colors"
                        >
                            Cancel and Return to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
