import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, FileText, AlertTriangle, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface NotificationItem {
    id: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionUrl?: string;
    read: boolean;
}

export function NotificationBell() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch initial notifications on mount
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch('/api/v1/notifications');
                const json = await res.json();
                if (json && json.data) {
                    setNotifications(json.data);
                }
            } catch (error) {
                console.error('Failed fetching initial notifications', error);
            }
        };

        if (user) {
            fetchInitial();
        }
    }, [user]);

    // Setup Echo real-time listener
    useEffect(() => {
        if (!user || !window.Echo) return;

        const channel = window.Echo.private(`App.Models.User.${user.id}`)
            .listen('.realtime.notification', (notification: any) => {
                setNotifications(prev => [
                    {
                        id: notification.id,
                        category: notification.category,
                        priority: notification.priority,
                        title: notification.title,
                        message: notification.message,
                        actionUrl: notification.actionUrl,
                        read: false
                    },
                    ...prev
                ]);
            });

        return () => {
            window.Echo.leave(`App.Models.User.${user.id}`);
        };
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await fetch('/api/v1/notifications/read-all', { method: 'POST' });
        } catch (error) {
            console.error('Failed syncing read state', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'security': 
                return <ShieldAlert className="w-4 h-4 text-destructive" />;
            case 'workflow': 
                return <FileText className="w-4 h-4 text-primary" />;
            default: 
                return <AlertTriangle className="w-4 h-4 text-amber" />;
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
            case 'high': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
            case 'critical': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            default: return 'bg-primary/10 text-primary border border-primary/20';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="relative p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all duration-200 focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 tracking-wide uppercase">Notifications</h3>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead} 
                                    className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 uppercase tracking-wider"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-500 dark:text-neutral-400 text-xs">No notifications found</div>
                            ) : (
                                notifications.map(item => (
                                    <div 
                                        key={item.id} 
                                        className={`p-4 flex gap-3 transition-colors ${item.read ? 'bg-transparent' : 'bg-neutral-50/50 dark:bg-neutral-900/30'}`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {getCategoryIcon(item.category)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-tight leading-tight">
                                                    {item.title}
                                                </p>
                                                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getPriorityBadgeClass(item.priority)}`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                {item.message}
                                            </p>
                                            {item.actionUrl && (
                                                <Link 
                                                    href={item.actionUrl} 
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-block mt-2 text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                                                >
                                                    Resolve &rarr;
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/20 text-center">
                            <Link 
                                href="/notifications" 
                                onClick={() => setIsOpen(false)}
                                className="text-[11px] font-bold text-primary hover:underline uppercase tracking-wider"
                            >
                                View All Notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
