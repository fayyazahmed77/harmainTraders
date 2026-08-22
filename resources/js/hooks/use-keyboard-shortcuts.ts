import { useEffect, useState, useCallback, useRef } from 'react';
import { router } from '@inertiajs/react';
import { COMMAND_REGISTRY } from '@/config/command-registry';

function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tagName = target.tagName.toUpperCase();
    return (
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox'
    );
}

export function useKeyboardShortcuts() {
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);
    const [isMac, setIsMac] = useState(false);
    const pendingPrefixRef = useRef<string | null>(null);
    const prefixTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsMac(typeof window !== 'undefined' && /mac/i.test(navigator.userAgent));
    }, []);

    const toggleCommand = useCallback(() => {
        setIsCommandOpen((prev) => !prev);
    }, []);

    const toggleShortcutsHelp = useCallback(() => {
        setIsShortcutsHelpOpen((prev) => !prev);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 1. Ctrl + K / Cmd + K -> Toggle Command Palette (Works everywhere, even inside inputs)
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setIsCommandOpen((prev) => !prev);
                return;
            }

            // 2. Escape key -> Close modals if open
            if (event.key === 'Escape') {
                if (isCommandOpen) {
                    setIsCommandOpen(false);
                    return;
                }
                if (isShortcutsHelpOpen) {
                    setIsShortcutsHelpOpen(false);
                    return;
                }
            }

            // If user is inside an input field, do not trigger sequence shortcuts (e.g. G D, C S)
            if (isInputElement(event.target)) {
                return;
            }

            // If a modal is open, do not handle global two-key navigation shortcuts
            if (isCommandOpen || isShortcutsHelpOpen) {
                return;
            }

            // 3. Shift + ? (or literal '?') -> Toggle Shortcuts Help Dialog
            if (event.key === '?' || (event.shiftKey && event.key === '/')) {
                event.preventDefault();
                setIsShortcutsHelpOpen((prev) => !prev);
                return;
            }

            const keyUpper = event.key.toUpperCase();

            // 4. Handle Two-Key Combo Sequences (e.g., G then D, C then S)
            if (!pendingPrefixRef.current) {
                if (keyUpper === 'G' || keyUpper === 'C') {
                    pendingPrefixRef.current = keyUpper;
                    if (prefixTimeoutRef.current) clearTimeout(prefixTimeoutRef.current);
                    prefixTimeoutRef.current = setTimeout(() => {
                        pendingPrefixRef.current = null;
                    }, 1200); // 1.2 second buffer to press second key
                    return;
                }
            } else {
                const fullCombo = `${pendingPrefixRef.current} ${keyUpper}`;
                pendingPrefixRef.current = null;
                if (prefixTimeoutRef.current) clearTimeout(prefixTimeoutRef.current);

                // Find command matching this shortcut
                const targetCmd = COMMAND_REGISTRY.find(
                    (cmd) => cmd.shortcut && cmd.shortcut.toUpperCase() === fullCombo
                );

                if (targetCmd) {
                    event.preventDefault();
                    router.visit(targetCmd.url);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (prefixTimeoutRef.current) clearTimeout(prefixTimeoutRef.current);
        };
    }, [isCommandOpen, isShortcutsHelpOpen]);

    return {
        isCommandOpen,
        setIsCommandOpen,
        toggleCommand,
        isShortcutsHelpOpen,
        setIsShortcutsHelpOpen,
        toggleShortcutsHelp,
        isMac,
    };
}
