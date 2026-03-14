import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface DirtyStateDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * DirtyStateDialog
 * 
 * A specialized confirmation dialog for unsaved form data.
 * Wraps the generic ConfirmDialog with context-specific messaging.
 */
export function DirtyStateDialog({ isOpen, onClose, onConfirm }: DirtyStateDialogProps) {
    return (
        <ConfirmDialog
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Unsaved Changes"
            description="You have unsaved modifications on this page. If you leave now, your progress will be lost. Do you want to discard your changes and proceed?"
            confirmText="Discard & Leave"
            cancelText="Stay & Save"
            variant="warning"
        />
    );
}
