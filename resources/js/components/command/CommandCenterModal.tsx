import React, { useState, useEffect, useMemo, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Search, X, Command as CommandIcon, ArrowRight, CornerDownLeft, Sparkles, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { COMMAND_REGISTRY, type CommandItem } from '@/config/command-registry';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'harmain_recent_command_ids';
const MAX_RECENT = 5;

interface CommandCenterModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isMac: boolean;
}

export function CommandCenterModal({ open, onOpenChange, isMac }: CommandCenterModalProps) {
    const { props } = usePage();
    const auth = (props.auth as any) || {};
    const userPermissions: string[] = auth.permissions || [];
    const userRoles: string[] = auth.roles || [];

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [recentIds, setRecentIds] = useState<string[]>([]);
    const listRef = useRef<HTMLDivElement>(null);

    // Load recent command IDs from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(RECENT_KEY);
                if (stored) {
                    setRecentIds(JSON.parse(stored));
                }
            } catch (e) {
                console.error('Failed to load recent commands:', e);
            }
        }
    }, [open]);

    // Save recent command
    const saveRecentCommand = (id: string) => {
        try {
            const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, MAX_RECENT);
            setRecentIds(updated);
            localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to save recent command:', e);
        }
    };

    // Check if current user is Admin or Super Admin
    const isAdmin = useMemo(() => {
        return userRoles.some((r) => {
            const lower = r.toLowerCase();
            return lower === 'admin' || lower === 'super admin' || lower === 'super-admin' || lower === 'system administrator';
        });
    }, [userRoles]);

    // Filter allowed items strictly based on user roles and permissions
    const allowedItems = useMemo(() => {
        return COMMAND_REGISTRY.filter((item) => {
            // Admin users have full access to all system commands & pages
            if (isAdmin) return true;

            // Public commands available to all authenticated users
            if (!item.permissions && !item.roles) return true;

            // Check matching permissions (case-insensitive)
            const matchPerm = item.permissions
                ? item.permissions.some((p) =>
                      userPermissions.some((userP) => userP.toLowerCase() === p.toLowerCase())
                  )
                : false;

            // Check matching roles (case-insensitive)
            const matchRole = item.roles
                ? item.roles.some((r) =>
                      userRoles.some((userR) => userR.toLowerCase() === r.toLowerCase())
                  )
                : false;

            return matchPerm || matchRole;
        });
    }, [userPermissions, userRoles, isAdmin]);

    // Search and Grouping Logic
    const { flatResults, grouped } = useMemo(() => {
        const cleanQuery = query.trim().toLowerCase();

        let filtered: CommandItem[] = [];

        if (!cleanQuery) {
            filtered = allowedItems;
        } else {
            filtered = allowedItems.filter((item) => {
                const inTitle = item.title.toLowerCase().includes(cleanQuery);
                const inCategory = item.category.toLowerCase().includes(cleanQuery);
                const inModule = item.parentModule.toLowerCase().includes(cleanQuery);
                const inDesc = item.description?.toLowerCase().includes(cleanQuery) || false;
                const inKeywords = item.keywords.some((k) => k.toLowerCase().includes(cleanQuery));
                return inTitle || inCategory || inModule || inDesc || inKeywords;
            });
        }

        // Separate Recent if query is empty
        const recentItems: CommandItem[] = [];
        if (!cleanQuery && recentIds.length > 0) {
            recentIds.forEach((id) => {
                const found = allowedItems.find((item) => item.id === id);
                if (found) recentItems.push(found);
            });
        }

        // Grouping
        const groups: { [key: string]: CommandItem[] } = {};

        if (recentItems.length > 0) {
            groups['Recent'] = recentItems;
        }

        filtered.forEach((item) => {
            const cat = item.category;
            if (!groups[cat]) {
                groups[cat] = [];
            }
            // Avoid duplicate in Recent vs Category when listing
            groups[cat].push(item);
        });

        // Flatten for arrow keyboard index calculation
        const flat: CommandItem[] = [];
        Object.keys(groups).forEach((groupName) => {
            groups[groupName].forEach((item) => {
                flat.push(item);
            });
        });

        return { flatResults: flat, grouped: groups };
    }, [query, allowedItems, recentIds]);

    // Reset selection index when query or results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [query, flatResults.length]);

    // Navigate to selected command
    const executeCommand = (item: CommandItem) => {
        saveRecentCommand(item.id);
        onOpenChange(false);
        setQuery('');
        router.visit(item.url);
    };

    // Keyboard navigation inside command palette
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const selected = flatResults[selectedIndex];
            if (selected) {
                executeCommand(selected);
            }
        }
    };

    // Scroll selected item into view smoothly
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    let currentIndexCounter = 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="p-0 overflow-hidden sm:max-w-4xl lg:max-w-5xl w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-2xl rounded-2xl gap-0"
                aria-describedby="command-center-description"
            >
                <DialogTitle className="sr-only">Global Command Center</DialogTitle>
                <p id="command-center-description" className="sr-only">
                    Search ERP pages, creation actions, modules, and reports with instant keyboard navigation.
                </p>

                {/* Top Search Input Box */}
                <div className="flex items-center px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-800/80 gap-3">
                    <Search className="w-5 h-5 text-orange-500 shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a page, command, or action (e.g. Sales, Invoice, Item)..."
                        className="w-full bg-transparent text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none"
                        autoFocus
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div
                    ref={listRef}
                    className="max-h-[380px] overflow-y-auto p-2 space-y-4 custom-scrollbar"
                >
                    {flatResults.length === 0 ? (
                        <div className="py-12 text-center text-neutral-400 dark:text-neutral-500">
                            <Sparkles className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600 stroke-[1.5]" />
                            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                No matching commands found
                            </p>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                                Try searching for "Sales", "Purchase", "Accounts", or "Reports"
                            </p>
                        </div>
                    ) : (
                        Object.keys(grouped).map((groupName) => {
                            const groupItems = grouped[groupName];
                            if (groupItems.length === 0) return null;

                            return (
                                <div key={groupName} className="space-y-1">
                                    <div className="px-3 py-1 flex items-center gap-2">
                                        {groupName === 'Recent' ? (
                                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                                        ) : null}
                                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                                            {groupName}
                                        </span>
                                    </div>

                                    {groupItems.map((item) => {
                                        const itemIndex = currentIndexCounter++;
                                        const isSelected = itemIndex === selectedIndex;

                                        const Icon = item.icon;

                                        return (
                                            <div
                                                key={`${groupName}-${item.id}-${itemIndex}`}
                                                data-index={itemIndex}
                                                onClick={() => executeCommand(item)}
                                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                                                className={cn(
                                                    'group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
                                                    isSelected
                                                        ? 'bg-orange-500/10 dark:bg-orange-500/20 text-neutral-900 dark:text-neutral-50 font-medium'
                                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                                                )}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <div
                                                        className={cn(
                                                            'p-2 rounded-lg transition-colors shrink-0',
                                                            isSelected
                                                                ? 'bg-orange-500 text-white shadow-sm'
                                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'
                                                        )}
                                                    >
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold truncate">
                                                                {item.title}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
                                                                {item.parentModule}
                                                            </span>
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                                    {item.shortcut && (
                                                        <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/60 shadow-xs">
                                                            {item.shortcut}
                                                        </kbd>
                                                    )}
                                                    {isSelected && (
                                                        <ArrowRight className="w-4 h-4 text-orange-500 animate-pulse" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/90 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                                ↑
                            </kbd>
                            <kbd className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                                ↓
                            </kbd>{' '}
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                                ↵
                            </kbd>{' '}
                            Select
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold">
                                ESC
                            </kbd>{' '}
                            Dismiss
                        </span>
                    </div>

                    <div className="hidden sm:flex items-center gap-1.5 text-neutral-400 font-medium">
                        <CommandIcon className="w-3 h-3 text-orange-500" /> Harmain Command Center
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
