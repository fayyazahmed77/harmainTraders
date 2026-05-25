import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type User } from '@/types';
import { NavUser } from '@/components/nav-user';
import { usePage } from '@inertiajs/react';
import { ShiftHeaderTimer } from '@/components/ShiftHeaderTimer';
import { NotificationBell } from '@/components/notification/NotificationBell';

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

    return (
        <header className="relative flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex items-center gap-3">
                    <NotificationBell />
                    <NavUser user={user} />
                </div>
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <ShiftHeaderTimer user={user} />
            </div>
        </header>
    );
}
