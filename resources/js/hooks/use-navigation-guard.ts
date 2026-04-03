import { router } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';

/**
 * useNavigationGuard
 * 
 * Intercepts internal (Inertia) and external (Browser) navigation
 * when the form is dirty to prevent data loss.
 * 
 * @param isDirty - Boolean indicating if the form has unsaved changes
 */
export function useNavigationGuard(isDirty: boolean) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingVisit, setPendingVisit] = useState<string | null>(null);

    // 1. Handle External Navigation (Browser Refresh, Tab Close, External Links)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser confirmation dialog
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // 2. Handle Internal Navigation (Inertia Links)
    useEffect(() => {
        if (!isDirty) return;

        const removeListener = router.on('before', (event) => {
            // Ignore non-GET requests (like form submissions)
            if (event.detail.visit.method && event.detail.visit.method.toLowerCase() !== 'get') {
                return;
            }

            // If we are already in the confirmation process, allow the re-triggered visit
            if (pendingVisit === event.detail.visit.url.toString()) {
                return;
            }

            if (isDirty) {
                event.preventDefault(); // Stop navigation
                setPendingVisit(event.detail.visit.url.toString());
                setShowConfirm(true); // Show custom dialog
            }
        });

        return () => removeListener();
    }, [isDirty, pendingVisit]);

    const confirmNavigation = useCallback(() => {
        if (pendingVisit) {
            const url = pendingVisit;
            setPendingVisit(null);
            setShowConfirm(false);
            // We use a small timeout to ensure the dialog closes before navigation starts
            // and to avoid immediate re-interception if state hasn't cleared.
            router.visit(url);
        }
    }, [pendingVisit]);

    const cancelNavigation = useCallback(() => {
        setPendingVisit(null);
        setShowConfirm(false);
    }, []);

    return {
        showConfirm,
        confirmNavigation,
        cancelNavigation
    };
}
