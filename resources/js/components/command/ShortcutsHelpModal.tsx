import React from 'react';
import { Keyboard, Command as CommandIcon, Navigation, PlusCircle, Terminal, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ShortcutsHelpModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isMac: boolean;
}

export function ShortcutsHelpModal({ open, onOpenChange, isMac }: ShortcutsHelpModalProps) {
    const modKey = isMac ? '⌘' : 'Ctrl';

    const shortcutSections = [
        {
            title: 'Global Controls',
            icon: CommandIcon,
            items: [
                { keys: [`${modKey}`, 'K'], description: 'Open Command Center' },
                { keys: ['?'], description: 'Show Keyboard Shortcuts' },
                { keys: [`${modKey}`, 'B'], description: 'Toggle Sidebar' },
                { keys: ['Esc'], description: 'Close Modal / Cancel' },
            ],
        },
        {
            title: 'Quick Navigation (G + Key)',
            icon: Navigation,
            items: [
                { keys: ['G', 'D'], description: 'Go to Main Dashboard' },
                { keys: ['G', 'S'], description: 'Go to Sales List' },
                { keys: ['G', 'P'], description: 'Go to Purchase List' },
                { keys: ['G', 'I'], description: 'Go to Items & Products' },
                { keys: ['G', 'A'], description: 'Go to Chart of Accounts' },
                { keys: ['G', 'R'], description: 'Go to Analytics & Reports' },
                { keys: ['G', 'N'], description: 'Go to Notification Center' },
            ],
        },
        {
            title: 'Quick Creation (C + Key)',
            icon: PlusCircle,
            items: [
                { keys: ['C', 'S'], description: 'Create New Sale Invoice' },
                { keys: ['C', 'P'], description: 'Create New Purchase Order' },
                { keys: ['C', 'A'], description: 'Create New Account' },
                { keys: ['C', 'I'], description: 'Create New Product / Item' },
                { keys: ['C', 'R'], description: 'Create Receipt | Payment' },
                { keys: ['C', 'V'], description: 'Create Journal Voucher (JV)' },
            ],
        },
        {
            title: 'Terminal & Page Actions',
            icon: Terminal,
            items: [
                { keys: ['F2'], description: 'Open Item Registry (Sale/Purchase)' },
                { keys: ['F4'], description: 'Open Payment / Checkout Dialog' },
                { keys: ['F8'], description: 'Save & Post Form / Voucher' },
                { keys: ['Alt', 'C'], description: 'Customer Select / Add Customer' },
            ],
        },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full p-6 md:p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-2xl gap-6">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <Keyboard className="w-6 h-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                ERP Keyboard Shortcuts
                            </DialogTitle>
                            <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Speed up daily accounting, billing, and system navigation with hotkeys.
                            </DialogDescription>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
                    {shortcutSections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div
                                key={section.title}
                                className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-3"
                            >
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span>{section.title}</span>
                                </div>

                                <div className="space-y-2">
                                    {section.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between py-1 text-xs"
                                        >
                                            <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                                                {item.description}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {item.keys.map((k, kIdx) => (
                                                    <React.Fragment key={kIdx}>
                                                        {kIdx > 0 && (
                                                            <span className="text-neutral-400 text-[10px]">
                                                                +
                                                            </span>
                                                        )}
                                                        <kbd className="px-2 py-0.5 rounded text-[11px] font-bold text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-xs">
                                                            {k}
                                                        </kbd>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
                    <p>
                        Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">{modKey} + K</kbd> anywhere to search all commands.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
