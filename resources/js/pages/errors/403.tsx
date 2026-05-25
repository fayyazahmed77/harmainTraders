import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
    Lock, 
    ArrowLeft, 
    Mail, 
    ShieldAlert, 
    Send, 
    X, 
    CheckCircle2, 
    Home,
    AlertCircle
} from 'lucide-react';

export default function AccessDenied() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [requestSubmitted, setRequestSubmitted] = useState(false);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await axios.post('/api/v1/access-requests', {
                resource_type: window.location.pathname,
                action_type: 'VIEW',
                justification: reason,
            });
            setRequestSubmitted(true);
            setReason('');
        } catch (err: any) {
            console.error('Access Request Submission Error:', err);
            const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to submit request. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/dashboard';
        }
    };

    return (
        <>
            <Head title="403 - Access Denied" />
            
            <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background text-foreground font-sans select-none">
                
                {/* 1. Animated Gradient Mesh Background */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                    
                    {/* Glowing Mesh Waves */}
                    <motion.div 
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            x: [0, 50, 0],
                            y: [0, -30, 0]
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none"
                    />
                    
                    <motion.div 
                        animate={{
                            scale: [1, 1.15, 1],
                            rotate: [360, 270, 360],
                            x: [0, -40, 0],
                            y: [0, 50, 0]
                        }}
                        transition={{
                            duration: 25,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -bottom-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[140px] pointer-events-none"
                    />

                    {/* Subtle grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 dark:opacity-30" />
                </div>

                {/* 2. Floating Particle Effects */}
                <div className="absolute inset-0 pointer-events-none z-10">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ 
                                opacity: 0.1 + Math.random() * 0.3,
                                y: '100vh',
                                x: `${10 + Math.random() * 80}vw`,
                                scale: 0.5 + Math.random() * 1.5
                            }}
                            animate={{
                                y: '-10vh',
                                rotate: 360
                            }}
                            transition={{
                                duration: 15 + Math.random() * 15,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="absolute w-2 h-2 rounded-full bg-primary/20 dark:bg-primary/10 blur-[1px]"
                        />
                    ))}
                </div>

                {/* 3. Main Center Content Container */}
                <div className="relative z-20 w-full max-w-xl mx-4">
                    
                    {/* Background Huge Watermark Typography */}
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 pointer-events-none select-none text-[200px] sm:text-[280px] font-black text-muted/10 dark:text-muted/5 font-mono tracking-tighter flex items-center justify-center filter blur-[2px] transition-all duration-300">
                        403
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-xl px-6 py-10 sm:p-12 shadow-xl shadow-primary/5 dark:shadow-[0_0_50px_-12px_rgba(232,148,26,0.15)] overflow-hidden"
                    >
                        {/* Premium subtle glow effect around the card */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                        
                        {/* Lock / Shield Icon Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-muted/10 border border-border shadow-inner">
                                <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
                                
                                {/* Lock body & Shackle animation */}
                                <div className="relative w-8 h-8 flex items-center justify-center">
                                    <motion.div
                                        initial={{ y: -4, rotate: -15 }}
                                        animate={{ y: 0, rotate: 0 }}
                                        transition={{ 
                                            delay: 0.3, 
                                            type: "spring", 
                                            stiffness: 200, 
                                            damping: 10 
                                        }}
                                        className="absolute -top-1 w-5 h-5 border-2 border-primary border-b-0 rounded-t-full"
                                    />
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="absolute bottom-0 w-7 h-5 bg-primary rounded-sm flex items-center justify-center"
                                    >
                                        <div className="w-1.5 h-1.5 bg-card rounded-full" />
                                    </motion.div>
                                </div>

                                {/* Floating indicators */}
                                <motion.div 
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-1 -right-1 p-1 bg-primary/10 text-primary rounded-full border border-primary/20"
                                >
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                </motion.div>
                            </div>

                            {/* Optional warning badge */}
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-4 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 flex items-center gap-1.5"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Restricted Zone</span>
                            </motion.div>
                        </div>

                        {/* Text Content */}
                        <div className="text-center space-y-4">
                            <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight uppercase italic">
                                Access <span className="text-primary">Denied</span>
                            </h2>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                You don't have permission to access this resource. Your current security privileges are insufficient.
                            </p>

                            <div className="p-3 bg-muted/5 border border-border/80 rounded-lg max-w-sm mx-auto flex items-start gap-2.5 text-left">
                                <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                <div className="text-[11px] font-bold text-muted-foreground leading-tight">
                                    This area is restricted to authorized roles only. If you believe this is an error, please request administrative access below.
                                </div>
                            </div>
                        </div>

                        {/* Actions Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center justify-center">
                            <button
                                onClick={handleGoBack}
                                className="group relative w-full sm:w-auto min-w-[160px] h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_20px_-4px_rgba(232,148,26,0.3)] hover:shadow-[0_4px_20px_0_rgba(232,148,26,0.5)] active:scale-[0.98] font-black uppercase text-xs tracking-wider"
                            >
                                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                                Go Back
                            </button>
                            
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="w-full sm:w-auto min-w-[160px] h-10 px-5 rounded-lg border border-border hover:border-muted/30 bg-muted/10 hover:bg-muted/20 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                Request Access
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* 4. Request Access Glassmorphic Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setRequestSubmitted(false);
                                }}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                            />

                            {/* Modal Card */}
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="relative w-full max-w-md rounded-xl border border-border bg-card px-6 py-8 shadow-2xl overflow-hidden"
                            >
                                {/* Glow Bar */}
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                                
                                {/* Close Button */}
                                <button 
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setRequestSubmitted(false);
                                    }}
                                    className="absolute top-4 right-4 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                {!requestSubmitted ? (
                                    <form onSubmit={handleRequestSubmit} className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black uppercase text-foreground tracking-tight">Request Resource Access</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Submit your business justification to the administrator.</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Justification / Reason</label>
                                            <textarea
                                                required
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                rows={4}
                                                placeholder="Explain why you need access to this resource (e.g., procurement audits, supplier management, invoice creation)..."
                                                className="w-full rounded-lg border border-border bg-background/50 p-3 text-xs text-foreground placeholder-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200"
                                            />
                                        </div>

                                        {error && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-xs font-black uppercase tracking-wider text-primary-foreground transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" />
                                                    Submit Request
                                                </>
                                            )}
                                        </button>
                                    </form>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-6 space-y-4"
                                    >
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-md font-black uppercase tracking-tight text-foreground">Request Received</h4>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-xs mx-auto">The system administrator has been notified. We will review your request shortly.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setRequestSubmitted(false);
                                            }}
                                            className="h-9 px-4 rounded-lg bg-muted/10 border border-border text-xs font-black uppercase text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
                                        >
                                            Close Panel
                                        </button>
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </>
    );
}

// Simple rotate loader helper for submit state
function RefreshCcw(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
        </svg>
    );
}
