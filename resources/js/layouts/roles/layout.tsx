import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type RoleItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Users, FolderLock, BookKey, User, ChevronRight } from 'lucide-react';
import { motion } from "framer-motion";

const sidebarNavItems: RoleItem[] = [
    {
        title: 'Category',
        href: '/permissions/category',
        icon: Users,
        permissions: null,
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: FolderLock,
        permissions: null,
    },
    {
        title: 'Assign To Role',
        href: '/roles/permissions',
        icon: BookKey,
        permissions: null,
    },
    {
        title: 'Roles',
        href: '/roles/permissions/list',
        icon: User,
        permissions: null,
    },
];

export default function RolesLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') return null;
    const currentPath = window.location.pathname;

    return (
        <div className="flex-1 w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <div className="max-w-[1600px] w-full mx-auto p-4 md:p-8 space-y-8 flex-1 flex flex-col min-h-0">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-4 flex-shrink-0"
                >
                    <Heading
                        title="Roles & Permissions"
                        description="Configure system access controls and staff authorization layers"
                    />
                </motion.div>

                <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-8 flex-1 min-h-0 pb-4">
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <nav className="flex flex-col space-y-1 bg-white dark:bg-zinc-900/50 p-2 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                            <div className="px-3 py-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Navigation</span>
                            </div>
                            {sidebarNavItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = currentPath === item.href;
                                return (
                                    <Link
                                        key={`${item.href}-${index}`}
                                        href={item.href}
                                        className={cn(
                                            'group flex items-center justify-between px-3 py-2.5 text-sm font-bold uppercase tracking-tighter transition-all rounded-lg',
                                            isActive
                                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-l-2 border-orange-500'
                                                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-orange-500" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200")} />
                                            <span>{item.title}</span>
                                        </div>
                                        {isActive && <ChevronRight className="w-4 h-4" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="flex-1 min-w-0 flex flex-col h-full">
                        <motion.section
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="w-full h-full flex flex-col"
                        >
                            {children}
                        </motion.section>
                    </main>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #a5a5a5ff; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f97316; }
            `}</style>
        </div>
    );
}
