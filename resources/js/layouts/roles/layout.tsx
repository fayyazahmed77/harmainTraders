import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type RoleItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Users,FolderLock ,  BookKey , User } from 'lucide-react';

const sidebarNavItems: RoleItem[] = [
   {
        title: 'Category',
        href: '/permissions/category',
        icon: Users,
        permissions: 12,
    },
    {
        title: 'Permissions',
        href: '/permissions',
        icon: FolderLock ,
        permissions: 9,
    },
    {
        title: 'Assign To Role',
        href: '/roles/permissions',
        icon: BookKey,
        permissions: 6,
    },
    {
        title: 'Roles',
        href: '/roles/permissions/list',
        icon: User,
        permissions: 6,
    },
];

export default function RolesLayout({ children }: PropsWithChildren) {
    if (typeof window === 'undefined') return null;

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <Heading title="Roles & Permission" description="Manage your Staff Roles and Permissions " />

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-40">
                    <nav className="flex flex-col space-y-2">
                        {sidebarNavItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start flex-col items-start space-y-0.5 px-3 py-2 text-left', {
                                        'bg-muted': currentPath === item.href,
                                    })}
                                >
                                    <Link href={item.href} prefetch className="w-full ">
                                        <div className="flex items-center space-x-2">
                                            <Icon className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium">{item.title}</span>
                                        </div>
                                      
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="flex-1 w-full">
                    <section className="space-y-12 w-full">{children}</section>
                </div>
            </div>
        </div>
    );
}
