import AppLoginLogo from '@/components/app-login-logo';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6 md:p-10">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover" // consistent styling
            >
                <source src="/storage/img/bg1.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <div className="relative z-10 flex w-full max-w-md flex-col gap-6">


                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl shadow-xl">
                        <Link
                            href={home()}
                            className="flex items-center gap-2 self-center font-medium pt-2"
                        >
                            <div className="flex  items-center justify-center">
                                <AppLoginLogo className='w-50' />
                            </div>
                        </Link>
                        <CardHeader className="px-10 pt-2 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
