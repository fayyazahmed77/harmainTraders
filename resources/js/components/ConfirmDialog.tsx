import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default"
}: ConfirmDialogProps) {
    const getVariantConfig = () => {
        switch (variant) {
            case 'destructive': return { color: "rose", bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" };
            case 'warning': return { color: "orange", bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" };
            case 'success': return { color: "emerald", bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
            default: return { color: "blue", bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" };
        }
    };

    const config = getVariantConfig();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl bg-white dark:bg-zinc-950 rounded-[2rem] animate-in fade-in zoom-in duration-300">
                <div className="p-8 pb-4 flex flex-col items-center text-center gap-6">
                    {/* Simplified & Clean Icon Container */}
                    <div className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-500 hover:rotate-12",
                        `bg-${config.color}-500/10 ${config.text}`
                    )}>
                        {variant === 'destructive' || variant === 'warning' ? <AlertCircle className="w-8 h-8" /> :
                         variant === 'success' ? <CheckCircle2 className="w-8 h-8" /> :
                         <HelpCircle className="w-8 h-8" />}
                    </div>
                    
                    <DialogHeader className="sm:text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-base font-medium leading-relaxed text-zinc-500 dark:text-zinc-400 px-2">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <DialogFooter className="p-6 sm:justify-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-28 h-11 font-bold text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all active:scale-95"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn(
                            "w-full sm:w-32 h-11 font-bold text-sm text-white shadow-lg transition-all active:scale-95 rounded-xl",
                            config.bg,
                            `hover:${config.bg}/90`
                        )}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
