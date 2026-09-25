import { SidebarInset } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({
    variant = 'header',
    className,
    children,
    ...props
}: AppContentProps) {
    if (variant === 'sidebar') {
        return <SidebarInset className={className} {...props}>{children}</SidebarInset>;
    }

    return (
        <main
            className={cn(
                "mx-auto flex h-full w-full max-w-7xl min-w-0 flex-1 flex-col gap-4 rounded-xl px-3 sm:px-4 md:px-6",
                className
            )}
            {...props}
        >
            {children}
        </main>
    );
}

