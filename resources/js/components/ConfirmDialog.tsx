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
    const getIcon = () => {
        switch (variant) {
            case 'destructive':
            case 'warning':
                return <AlertCircle className={cn("h-12 w-12 mb-4", variant === 'destructive' ? "text-red-500" : "text-amber-500")} />;
            case 'success':
                return <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />;
            default:
                return <HelpCircle className="h-12 w-12 text-blue-500 mb-4" />;
        }
    };

    const getConfirmButtonVariant = () => {
        switch (variant) {
            case 'destructive': return "destructive";
            case 'success': return "default"; // emerald would be custom, but let's stick to standard or custom class
            case 'warning': return "default";
            default: return "default";
        }
    };

    const confirmButtonClass = cn(
        variant === 'success' && "bg-emerald-600 hover:bg-emerald-700 text-white",
        variant === 'warning' && "bg-amber-600 hover:bg-amber-700 text-white"
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-6 flex flex-col items-center text-center">
                    <div className="animate-in fade-in zoom-in duration-300">
                        {getIcon()}
                    </div>
                    <DialogHeader className="sm:text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 group-data-[theme=dark]:text-gray-100">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-500 dark:text-gray-400">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <DialogFooter className="bg-gray-50 dark:bg-gray-900/50 p-4 sm:justify-center gap-3 border-t">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full sm:w-28 font-semibold hover:bg-gray-200 dark:hover:bg-gray-800"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        variant={getConfirmButtonVariant()}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={cn("w-full sm:w-28 font-semibold shadow-md active:scale-95 transition-all", confirmButtonClass)}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
