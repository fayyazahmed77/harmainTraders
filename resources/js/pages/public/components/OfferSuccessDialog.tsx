import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, MessageSquare, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfferSuccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    invoice: string | null;
    customerCode: string | null;
    guestToken: string | null;
    amount?: number | null;
    formatCurrency?: (amount: number) => string;
}

const FireworksCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        let animationFrameId: number;
        let burstInterval: ReturnType<typeof setInterval>;
        let stopTimer: ReturnType<typeof setTimeout>;

        const parent = canvas.parentElement;
        const width = parent?.offsetWidth || 450;
        const height = parent?.offsetHeight || 500;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            alpha: number;
            color: string;
            size: number;
            decay: number;
            gravity: number;
        }> = [];

        const colors = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#fbbf24', '#f43f5e'];

        const createFirework = (x: number, y: number) => {
            const count = 40;
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 6 + 2;
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    alpha: 1,
                    color,
                    size: Math.random() * 3.5 + 1.5,
                    decay: Math.random() * 0.02 + 0.01,
                    gravity: 0.1,
                });
            }
        };

        // Initial bursts
        createFirework(width * 0.25, height * 0.3);
        createFirework(width * 0.75, height * 0.3);
        createFirework(width * 0.5, height * 0.2);

        burstInterval = setInterval(() => {
            const rx = Math.random() * width * 0.8 + width * 0.1;
            const ry = Math.random() * height * 0.5 + height * 0.1;
            createFirework(rx, ry);
        }, 400);

        stopTimer = setTimeout(() => {
            if (burstInterval) clearInterval(burstInterval);
        }, 4000);

        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vx *= 0.98;
                p.vy *= 0.98;
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (burstInterval) clearInterval(burstInterval);
            if (stopTimer) clearTimeout(stopTimer);
        };
    }, []);

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute inset-0 pointer-events-none z-10 w-full h-full"
        />
    );
};

export const OfferSuccessDialog: React.FC<OfferSuccessDialogProps> = ({
    open,
    onOpenChange,
    invoice,
    customerCode,
    guestToken,
    amount,
    formatCurrency,
}) => {
    const defaultFormatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(val).replace('PKR', 'Rs');
    };

    const formatter = formatCurrency || defaultFormatCurrency;

    const handleWhatsApp = () => {
        const amtStr = amount ? ` (Total: ${formatter(amount)})` : '';
        const message = `Hello Haramain Traders, I have placed order #${invoice}${amtStr} under Customer Code ${customerCode || 'GUEST'}. Please confirm my order!`;
        window.open(`https://wa.me/923323218684?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.85, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        className="w-full max-w-md bg-surface-1 border border-border rounded-3xl p-6 text-center shadow-2xl overflow-hidden relative z-20"
                    >
                        {/* Fireworks Particle Canvas */}
                        <FireworksCanvas />

                        {/* Close button */}
                        <button 
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-2 border border-border text-text-muted hover:text-text-primary flex items-center justify-center transition-colors z-30"
                        >
                            <X size={16} />
                        </button>

                        <div className="relative z-20 pt-2">
                            <motion.div 
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                                className="w-20 h-20 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-xl shadow-emerald-500/20 relative"
                            >
                                <CheckCircle2 className="w-12 h-12" />
                                <Sparkles className="w-6 h-6 text-amber absolute -top-1 -right-1 animate-bounce" />
                            </motion.div>

                            <h2 className="font-display font-black text-2xl uppercase tracking-tight text-text-primary flex items-center justify-center gap-2">
                                🎉 ORDER SUBMITTED! 🎉
                            </h2>

                            <p className="text-xs text-text-muted mt-2">
                                Your order has been recorded successfully and sent to our sales team for verification.
                            </p>

                            {/* Order Details Card with Amount */}
                            <div className="my-5 p-4 bg-surface-2 border border-border rounded-2xl space-y-3 text-left shadow-inner">
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

                                {amount !== undefined && amount !== null && (
                                    <div className="pt-2.5 border-t border-border flex justify-between items-center">
                                        <span className="font-mono-jet uppercase text-text-muted font-black text-xs">Order Net Amount:</span>
                                        <span className="font-display font-black text-xl text-amber">{formatter(amount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Button 
                                    onClick={handleWhatsApp}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black text-xs uppercase h-12 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transform active:scale-98 transition-all"
                                >
                                    <MessageSquare className="w-4.5 h-4.5" />
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
                                    className="w-full text-xs text-text-muted mt-1 hover:text-text-primary"
                                >
                                    Continue Browsing
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
