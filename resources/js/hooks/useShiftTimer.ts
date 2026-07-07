import { useEffect, useState, useRef } from 'react';
import { router } from '@inertiajs/react';

export interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    break_duration_minutes: number;
    overtime_limit_minutes: number | null;
    color?: string;
}

export type ShiftTimerState =
    | { phase: 'no_shift' }
    | { phase: 'active'; endTime: Date; display: string }
    | { phase: 'countdown'; remaining: number; display: string }
    | { phase: 'overtime'; elapsed: number; display: string; limitMinutes: number | null }
    | { phase: 'dialog' };

interface StoredOvertime {
    overtime_started_at: string;
    shift_id: number;
    user_id: number;
}

const STORAGE_KEY = (userId: number) => `ht_shift_ot_${userId}`;

export function useShiftTimer(shift: Shift | null, userId: number | undefined) {
    const [state, setState] = useState<ShiftTimerState>({ phase: 'no_shift' });
    const [offsetMs, setOffsetMs] = useState<number>(0);
    const [isPaused, setIsPaused] = useState<boolean>(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Get current synchronized server time
    const getSyncedTime = (offset: number) => {
        return new Date(Date.now() + offset);
    };

    // Load server time offset once on mount
    useEffect(() => {
        if (!shift || !userId) {
            setState({ phase: 'no_shift' });
            return;
        }

        fetch('/api/server-time')
            .then((res) => res.json())
            .then((data) => {
                const serverTimeMs = new Date(data.server_time).getTime();
                const clientTimeMs = Date.now();
                const calculatedOffset = serverTimeMs - clientTimeMs;
                setOffsetMs(calculatedOffset);
            })
            .catch((err) => {
                console.error('Failed to sync server time, falling back to local time.', err);
            });
    }, [shift?.id, userId]);

    // Format helper for 12-hour AM/PM time with seconds
    const formatTime12hWithSeconds = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const amampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds} ${amampm}`;
    };

    // Format helper for 12-hour AM/PM time
    const formatTime12h = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const amampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours.toString().padStart(2, '0')}:${minutes} ${amampm}`;
    };

    // Format countdown timer (MM:SS)
    const formatCountdown = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Format overtime timer (HH:MM:SS)
    const formatOvertime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Triggered when user selects to continue working on overtime
    const startOvertime = () => {
        if (!shift || !userId) return;
        const nowTime = getSyncedTime(offsetMs);
        const otData: StoredOvertime = {
            overtime_started_at: nowTime.toISOString(),
            shift_id: shift.id,
            user_id: userId,
        };
        localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(otData));
        tick();
    };

    // Triggered when user clicks logout
    const confirmLogout = () => {
        if (userId) {
            localStorage.removeItem(STORAGE_KEY(userId));
        }
        router.post('/logout');
    };

    const tick = () => {
        if (isPaused || !shift || !userId) return;

        const nowTime = getSyncedTime(offsetMs);
        const [startH, startM, startS] = shift.start_time.split(':');
        const [endH, endM, endS] = shift.end_time.split(':');

        const shiftStart = new Date(nowTime);
        shiftStart.setHours(parseInt(startH, 10), parseInt(startM, 10), parseInt(startS, 10) || 0, 0);

        const shiftEnd = new Date(nowTime);
        shiftEnd.setHours(parseInt(endH, 10), parseInt(endM, 10), parseInt(endS, 10) || 0, 0);

        // Handle overnight shifts
        if (shiftStart > shiftEnd) {
            if (nowTime >= shiftStart) {
                shiftEnd.setDate(shiftEnd.getDate() + 1);
            } else {
                shiftStart.setDate(shiftStart.getDate() - 1);
            }
        }

        const breakMs = (shift.break_duration_minutes || 0) * 60 * 1000;
        const shiftEndWithBreak = new Date(shiftEnd.getTime() - breakMs);

        // Check if there is overtime record in localStorage
        const localOt = localStorage.getItem(STORAGE_KEY(userId));
        let activeOtStart: Date | null = null;
        if (localOt) {
            try {
                const parsed: StoredOvertime = JSON.parse(localOt);
                if (parsed.shift_id === shift.id && parsed.user_id === userId) {
                    activeOtStart = new Date(parsed.overtime_started_at);
                } else {
                    localStorage.removeItem(STORAGE_KEY(userId));
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY(userId));
            }
        }

        const remainingSeconds = Math.floor((shiftEndWithBreak.getTime() - nowTime.getTime()) / 1000);

        if (activeOtStart) {
            // We are in overtime phase!
            const elapsedSeconds = Math.floor((nowTime.getTime() - activeOtStart.getTime()) / 1000);
            
            // Check overtime limit
            if (shift.overtime_limit_minutes !== null) {
                const limitSeconds = shift.overtime_limit_minutes * 60;
                if (elapsedSeconds >= limitSeconds) {
                    // Exceeded limit -> clear and force logout
                    localStorage.removeItem(STORAGE_KEY(userId));
                    router.post('/logout');
                    return;
                }
            }

            setState({
                phase: 'overtime',
                elapsed: elapsedSeconds,
                display: formatOvertime(elapsedSeconds),
                limitMinutes: shift.overtime_limit_minutes,
            });
        } else if (remainingSeconds <= 0) {
            // Shift is over, show dialog
            setState({ phase: 'dialog' });
        } else if (remainingSeconds <= 3600) {
            // Less than 1 hour left, show countdown
            setState({
                phase: 'countdown',
                remaining: remainingSeconds,
                display: formatCountdown(remainingSeconds),
            });
        } else {
            // Shift is active, show normal current time with seconds
            setState({
                phase: 'active',
                endTime: shiftEndWithBreak,
                display: formatTime12hWithSeconds(nowTime),
            });
        }
    };

    // Main ticking loop
    useEffect(() => {
        if (!shift || !userId) return;

        // Run initial tick immediately
        tick();

        intervalRef.current = setInterval(tick, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [shift, userId, offsetMs, isPaused]);

    // Handle SPA navigation pauses
    useEffect(() => {
        const unsubscribeStart = router.on('start', () => setIsPaused(true));
        const unsubscribeFinish = router.on('finish', () => setIsPaused(false));

        return () => {
            unsubscribeStart();
            unsubscribeFinish();
        };
    }, []);

    return {
        state,
        startOvertime,
        confirmLogout,
        pause: () => setIsPaused(true),
        resume: () => setIsPaused(false),
    };
}
