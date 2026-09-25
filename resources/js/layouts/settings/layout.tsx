import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/settings/profile',
        icon: null,
    },
    {
        title: 'Password',
        href: '/settings/password',
        icon: null,
    },
    {
        title: 'Appearance',
        href: '/settings/appearance',
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
            <Heading title="Settings" description="Manage your profile and account settings" />

            <div className="flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-12 mt-4 sm:mt-6">
                <aside className="w-full lg:w-48 shrink-0">
                    <nav className="flex flex-row overflow-x-auto touch-scroll-x pb-1 lg:pb-0 gap-1.5 lg:gap-0 lg:flex-col lg:space-y-1">
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${item.href}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('justify-center lg:justify-start shrink-0 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium', {
                                    'bg-muted font-bold shadow-xs': currentPath === item.href,
                                })}
                            >
                                <Link href={item.href} prefetch>
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-4 lg:hidden" />

                <div className="flex-1 md:max-w-2xl min-w-0">
                    <section className="max-w-xl space-y-8 sm:space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
