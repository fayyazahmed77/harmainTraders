import React, { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, FileText, AlertTriangle, CheckCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePage, router } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface NotificationItem {
    id: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionUrl?: string;
    read: boolean;
    createdAt?: string;
}

export function NotificationBell() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch only unread notifications on mount
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch('/api/v1/notifications?unread=true');
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
                        read: false,
                        createdAt: notification.createdAt,
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

    const handleNotificationClick = async (item: NotificationItem) => {
        // Optimistically remove from unread list
        setNotifications(prev => prev.filter(n => n.id !== item.id));

        try {
            await fetch(`/api/v1/notifications/${item.id}/read`, { method: 'PATCH' });
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }

        setIsOpen(false);

        if (item.actionUrl) {
            router.visit(item.actionUrl);
        }
    };

    const markAllAsRead = async () => {
        setNotifications([]);
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
                return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'low':    return 'bg-neutral-800 text-neutral-400 border border-neutral-700';
            case 'high':   return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
            case 'critical': return 'bg-red-500/10 text-red-500 border border-red-500/20';
            default:       return 'bg-primary/10 text-primary border border-primary/20';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
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

            {/* Dropdown panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 tracking-wide uppercase">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-black bg-primary text-primary-foreground">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
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

                        {/* Notification list — unread only */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        You're all caught up!
                                    </p>
                                </div>
                            ) : (
                                notifications.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNotificationClick(item)}
                                        className="w-full text-left flex items-start gap-3 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors duration-150 group"
                                    >
                                        {/* Category icon */}
                                        <div className="mt-0.5 flex-shrink-0">
                                            {getCategoryIcon(item.category)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                    {item.title}
                                                </span>
                                                <span className={`flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${getPriorityBadgeClass(item.priority)}`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                                {item.message}
                                            </p>
                                            {item.createdAt && (
                                                <span className="flex items-center gap-1 mt-1 text-[10px] text-neutral-400 dark:text-neutral-600">
                                                    <Clock className="w-3 h-3" />
                                                    {item.createdAt}
                                                </span>
                                            )}
                                        </div>

                                        {/* Unread dot */}
                                        <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
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
