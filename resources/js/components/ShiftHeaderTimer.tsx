import React, { useEffect, useState } from 'react';
import { useShiftTimer, Shift } from '@/hooks/useShiftTimer';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogOut, Play, Clock, AlertTriangle } from 'lucide-react';

interface User {
    id: number;
    name: string;
    shift?: Shift;
    [key: string]: any;
}

interface ShiftHeaderTimerProps {
    user: User;
}

export function ShiftHeaderTimer({ user }: ShiftHeaderTimerProps) {
    const { state, startOvertime, confirmLogout } = useShiftTimer(user.shift || null, user.id);
    const [autoLogoutSec, setAutoLogoutSec] = useState(300); // 5-minute auto-logout timer

    const shiftColor = user.shift?.color || '#6366f1';
    const limitMinutes = user.shift?.overtime_limit_minutes ?? null;

    // Secondary countdown for auto-logout when dialog is open
    useEffect(() => {
        if (state.phase === 'dialog' && limitMinutes !== null) {
            setAutoLogoutSec(300);
            const interval = setInterval(() => {
                setAutoLogoutSec((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        confirmLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [state.phase, limitMinutes]);

    const formatAutoLogout = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (state.phase === 'no_shift') {
        return null;
    }

    return (
        <div className="flex items-center gap-3">
            {/* Presenter States */}
            {state.phase === 'active' && (
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all shadow-sm"
                    style={{
                        borderColor: `${shiftColor}25`,
                        backgroundColor: `${shiftColor}10`,
                        color: shiftColor,
                    }}
                >
                    <Clock size={13} style={{ color: shiftColor }} />
                    <span className="uppercase tracking-wider">{user.shift?.name}</span>
                    <span className="opacity-40">•</span>
                    <span>{state.display}</span>
                </div>
            )}

            {state.phase === 'countdown' && (
                <div className="relative flex flex-col gap-1 w-44">
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-500 text-xs font-mono font-bold shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-amber-500" />
                            <span className="uppercase tracking-wider">{user.shift?.name}</span>
                        </div>
                        <span className="animate-pulse">{state.display}</span>
                    </div>
                    {/* Linear Depleting Progress Bar */}
                    <div className="h-1 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(state.remaining / 3600) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {state.phase === 'overtime' && (
                <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-500 text-xs font-mono font-bold shadow-sm">
                        <span className="inline-block h-2 w-2 rounded-full bg-rose-500 animate-ping mr-1" />
                        <span className="uppercase tracking-wider">{user.shift?.name}</span>
                        <span className="opacity-40">•</span>
                        <span className="font-black">{state.display}</span>
                    </div>
                    {state.limitMinutes !== null && (
                        <div className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest">
                            OT Budget:{' '}
                            {Math.max(0, state.limitMinutes - Math.floor(state.elapsed / 60))}{' '}
                            min left
                        </div>
                    )}
                </div>
            )}

            {/* Shift Complete Modal Dialog */}
            <Dialog open={state.phase === 'dialog'} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-[420px] rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-2xl">
                    <DialogHeader className="space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-6 w-6 animate-bounce" />
                        </div>
                        <DialogTitle className="text-center text-lg font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Shift Complete
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                            Your <strong className="text-zinc-900 dark:text-zinc-100 uppercase font-bold">{user.shift?.name}</strong> shift has ended. Please choose whether to continue working under overtime or log out.
                        </DialogDescription>
                    </DialogHeader>

                    {limitMinutes !== null && (
                        <div className="my-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-center">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider animate-pulse">
                                Auto-logging out in {formatAutoLogout(autoLogoutSec)}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">
                                OVERTIME CAP FOR THIS SHIFT IS {limitMinutes} MINUTES
                            </p>
                        </div>
                    )}

                    {limitMinutes === null && (
                        <div className="my-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                Overtime Available
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">
                                UNLIMITED OVERTIME PERMITTED FOR THIS SHIFT
                            </p>
                        </div>
                    )}

                    <DialogFooter className="grid grid-cols-2 gap-3 mt-4 sm:space-x-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={confirmLogout}
                            className="w-full h-11 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout Now
                        </Button>
                        <Button
                            type="button"
                            disabled={limitMinutes === 0}
                            onClick={startOvertime}
                            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                        >
                            <Play className="mr-2 h-4 w-4" />
                            Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
