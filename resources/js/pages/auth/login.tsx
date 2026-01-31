import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthPremiumLayout from '@/layouts/auth/auth-premium-layout';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);


    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (errors) => {
                if (errors.email) {
                    setErrorMessage(errors.email);
                    setShowErrorDialog(true);
                    setData('password', '');
                }
            },
        });
    };

    return (
        <AuthPremiumLayout>
            <Head title="Log in" />

            {/* Header Section */}
            <div className="flex flex-col items-center space-y-6 text-center animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="relative group">
                    <img
                        src="storage/img/favicon.png"
                        alt="Decorative circles"
                        className="w-25 h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                    />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-orange-400 sm:text-3xl">
                        Welcome to Harmain Traders
                    </h1>
                    <p className="text-base text-slate-500 font-medium">
                        Harmain Traders Wholesale & Supply Chain.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div className="mt-8 sm:mt-10">
                <form
                    className="space-y-5 sm:space-y-6"
                    onSubmit={submit}
                >
                    {/* Email Input */}
                    <div className="space-y-2 group">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 ml-1">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-orange-400 transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                                placeholder="email@example.com"
                                className="h-14 w-full rounded-md border-slate-200 pl-12 pr-4 text-lg transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 shadow-sm hover:border-slate-300"
                            />
                        </div>
                        <InputError message={errors.email} />
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2 group">
                        <div className="flex justify-between items-center ml-1">
                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</Label>
                            <a
                                href={route('password.request')}
                                className="text-sm font-medium text-orange-400 transition-colors hover:text-orange-700 hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                placeholder="Password"
                                className="h-14 w-full rounded-md border-slate-200 pl-4 pr-12 text-lg transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-400/10 shadow-sm hover:border-slate-300"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600 transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-6 w-6" strokeWidth={2.5} />
                                ) : (
                                    <Eye className="h-6 w-6" strokeWidth={2.5} />
                                )}
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <Button
                        type="submit"
                        className="h-14 w-full rounded-md bg-orange-400 text-lg font-bold text-white shadow-xl shadow-orange-400/20 transition-all hover:bg-orange-500 hover:shadow-orange-400/30 active:scale-[0.98]"
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                Log in
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* Contact Link */}
            <div className="mt-8 text-center sm:mt-10">
                <a
                    href="#"
                    className="text-sm font-medium text-orange-400 transition-colors hover:text-orange-600 hover:underline sm:text-base"
                >
                    Contact Us
                </a>
            </div>

            {/* Error Dialog */}
            <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
                <DialogContent className="mx-4 max-w-md rounded-2xl p-0 sm:mx-0 sm:max-w-[425px]">
                    <div className="flex flex-col items-center p-6 text-center sm:p-8">
                        <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 shadow-inner">
                            <Mail className="h-10 w-10 text-orange-400" />
                            <div className="absolute translate-x-4 translate-y-4 rounded-full bg-white p-1 shadow-sm">
                                <ShieldAlert className="h-5 w-5 fill-red-100 text-red-500" />
                            </div>
                        </div>

                        <DialogHeader className="mb-2">
                            <DialogTitle className="text-center text-xl font-bold text-slate-900 sm:text-2xl">
                                Login Failed
                            </DialogTitle>
                        </DialogHeader>

                        <DialogDescription className="mb-6 break-words text-center text-sm text-slate-500 sm:text-base">
                            {errorMessage}
                        </DialogDescription>

                        <div className="flex w-full flex-col gap-3">
                            <Button
                                variant="outline"
                                className="h-11 w-full rounded-lg border-slate-200 font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 active:scale-95 sm:h-12"
                                onClick={() => {
                                    setShowErrorDialog(false);
                                    setData('password', '');
                                }}
                            >
                                Try again
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </AuthPremiumLayout>
    );
}
