import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type User } from '@/types';
import { NavUser } from '@/components/nav-user';
import { usePage } from '@inertiajs/react';
import { ShiftHeaderTimer } from '@/components/ShiftHeaderTimer';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { CommandCenterModal } from '@/components/command/CommandCenterModal';
import { ShortcutsHelpModal } from '@/components/command/ShortcutsHelpModal';
import { Search, Keyboard } from 'lucide-react';

interface PageProps {
    auth: {
        user: User;
    };
    [key: string]: unknown;
}

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const {
        isCommandOpen,
        setIsCommandOpen,
        isShortcutsHelpOpen,
        setIsShortcutsHelpOpen,
        isMac,
    } = useKeyboardShortcuts();

    return (
        <header className="relative flex h-16 shrink-0 items-center border-b border-sidebar-border/50 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <div className="flex w-full items-center justify-between gap-3">
                {/* Left section: Sidebar trigger & Breadcrumbs */}
                <div className="flex items-center gap-2 min-w-0 shrink-1">
                    <SidebarTrigger className="-ml-1" />
                    <div className="hidden sm:block truncate">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>

                {/* Center section: Global Search Command Bar Trigger */}
                <div className="flex-1 flex justify-center items-center max-w-xs md:max-w-sm lg:max-w-md mx-2">
                    <button
                        type="button"
                        onClick={() => setIsCommandOpen(true)}
                        className="w-full flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 text-xs text-neutral-400 dark:text-neutral-500 hover:border-orange-500/50 hover:bg-white dark:hover:bg-neutral-800/90 transition-all duration-200 shadow-2xs group cursor-pointer"
                    >
                        <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-orange-500 transition-colors shrink-0" />
                        <span className="truncate text-left font-medium">Search pages, actions...</span>
                        <kbd className="ml-auto hidden md:inline-flex items-center gap-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shrink-0">
                            {isMac ? '⌘K' : 'Ctrl K'}
                        </kbd>
                    </button>
                </div>

                {/* Right section: Shift Timer, Keyboard Shortcuts Icon, Notifications, User Menu */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="hidden xl:block">
                        <ShiftHeaderTimer user={user} />
                    </div>

                    {/* Keyboard Shortcuts Dialog Trigger Button (Left of Notification Bell) */}
                    <button
                        type="button"
                        onClick={() => setIsShortcutsHelpOpen(true)}
                        title="Keyboard Shortcuts (?)"
                        className="p-2 rounded-xl text-neutral-500 hover:text-orange-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer relative group"
                    >
                        <Keyboard className="w-4 h-4" />
                        <span className="sr-only">Keyboard Shortcuts</span>
                    </button>

                    <NotificationBell />
                    <NavUser user={user} />
                </div>
            </div>

            {/* CommandCenter & Shortcuts Help Modals */}
            <CommandCenterModal
                open={isCommandOpen}
                onOpenChange={setIsCommandOpen}
                isMac={isMac}
            />
            <ShortcutsHelpModal
                open={isShortcutsHelpOpen}
                onOpenChange={setIsShortcutsHelpOpen}
                isMac={isMac}
            />
        </header>
    );
}

