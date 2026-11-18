import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Bell,
    ShieldAlert,
    FileText,
    AlertTriangle,
    CheckCheck,
    Clock,
    ShoppingBag,
    UserPlus,
    ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'sonner';
import { type SharedData } from '@/types';

interface NotificationItem {
    id: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    actionUrl?: string;
    order_no?: string | null;
    final_total?: number | null;
    customer_name?: string | null;
    read: boolean;
    createdAt?: string;
}

export function NotificationBell() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [totalUnread, setTotalUnread] = useState<number>(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const initialLoadDoneRef = useRef<boolean>(false);

    const unreadCount = Math.max(totalUnread, notifications.filter(n => !n.read).length);

    const fetchUnreadNotifications = useCallback(async (isBackgroundPoll = false) => {
        if (!user) return;
        try {
            const res = await axios.get('/api/v1/notifications?unread=true');
            if (res.data && Array.isArray(res.data.data)) {
                const incoming: NotificationItem[] = res.data.data;
                setNotifications(incoming);
                setTotalUnread(typeof res.data.unreadCount === 'number' ? res.data.unreadCount : incoming.length);

                if (initialLoadDoneRef.current && isBackgroundPoll) {
                    // Check for any newly arrived notifications not yet toasted
                    const newlyArrived = incoming.filter(item => !knownIdsRef.current.has(item.id));
                    newlyArrived.slice(0, 2).forEach(item => {
                        toast.info(item.title, {
                            description: item.message,
                            action: item.actionUrl
                                ? {
                                      label: 'View',
                                      onClick: () => router.visit(item.actionUrl!),
                                  }
                                : undefined,
                        });
                    });
                }

                incoming.forEach(item => knownIdsRef.current.add(item.id));
                initialLoadDoneRef.current = true;
            }
        } catch (error) {
            console.error('Failed fetching unread notifications', error);
        }
    }, [user]);

    // Initial load + 30s background poll fallback when tab is visible
    useEffect(() => {
        if (!user) return;
        fetchUnreadNotifications(false);

        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                fetchUnreadNotifications(true);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user, fetchUnreadNotifications]);

    // Setup Echo real-time listener
    useEffect(() => {
        if (!user || !(window as any).Echo) return;

        const echo = (window as any).Echo;
        const channel = echo
            .private(`App.Models.User.${user.id}`)
            .listen('.realtime.notification', (notification: any) => {
                const newItem: NotificationItem = {
                    id: notification.id,
                    category: (notification.category || 'general').toLowerCase().replace(/\s+/g, '_'),
                    priority: notification.priority || 'high',
                    title: notification.title || (notification.order_no ? `New Wholesale Order #${notification.order_no}` : 'New Notification'),
                    message: notification.message || '',
                    actionUrl: notification.actionUrl || notification.action_url || notification.url,
                    order_no: notification.order_no || null,
                    final_total: notification.final_total ?? null,
                    customer_name: notification.customer_name || null,
                    read: false,
                    createdAt: notification.createdAt || 'Just now',
                };

                if (!knownIdsRef.current.has(newItem.id)) {
                    knownIdsRef.current.add(newItem.id);
                    setNotifications(prev => [newItem, ...prev.filter(n => n.id !== newItem.id)]);
                    setTotalUnread(prev => prev + 1);

                    toast.info(newItem.title, {
                        description: newItem.message,
                        action: newItem.actionUrl
                            ? {
                                  label: 'Review',
                                  onClick: () => router.visit(newItem.actionUrl!),
                              }
                            : undefined,
                    });
                }
            });

        return () => {
            echo.leave(`App.Models.User.${user.id}`);
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
        setNotifications(prev => prev.filter(n => n.id !== item.id));
        setTotalUnread(prev => Math.max(0, prev - 1));

        try {
            await axios.patch(`/api/v1/notifications/${item.id}/read`);
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
        setTotalUnread(0);
        try {
            await axios.post('/api/v1/notifications/read-all');
        } catch (error) {
            console.error('Failed syncing read state', error);
        }
    };

    const getCategoryMeta = (category: string) => {
        const cat = (category || '').toLowerCase();
        if (cat === 'online_orders' || cat === 'online orders') {
            return {
                label: 'Online Order',
                icon: <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                wrapperClass: 'bg-emerald-500/10 border border-emerald-500/20',
                pillClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
            };
        }
        if (cat === 'customers' || cat === 'customer') {
            return {
                label: 'Customer Portal',
                icon: <UserPlus className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                wrapperClass: 'bg-sky-500/10 border border-sky-500/20',
                pillClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
            };
        }
        if (cat === 'security') {
            return {
                label: 'Security',
                icon: <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
                wrapperClass: 'bg-rose-500/10 border border-rose-500/20',
                pillClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
            };
        }
        if (cat === 'workflow') {
            return {
                label: 'Workflow',
                icon: <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />,
                wrapperClass: 'bg-orange-500/10 border border-orange-500/20',
                pillClass: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
            };
        }
        return {
            label: 'System',
            icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
            wrapperClass: 'bg-amber-500/10 border border-amber-500/20',
            pillClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        };
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700';
            case 'high':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
            case 'critical':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
            default:
                return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                type="button"
                onClick={() => {
                    const next = !isOpen;
                    setIsOpen(next);
                    if (next) {
                        fetchUnreadNotifications(false);
                    }
                }}
                className="relative p-2 rounded-xl bg-neutral-100/80 hover:bg-neutral-200/80 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all duration-200 focus:outline-none cursor-pointer"
                aria-label="Notifications"
            >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 sm:h-5 min-w-[18px] sm:min-w-[20px] items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] sm:text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-neutral-950">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ duration: 0.16 }}
                        className="absolute right-0 mt-2.5 w-[calc(100vw-1.5rem)] max-w-md sm:w-[400px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/50">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-xs text-neutral-900 dark:text-neutral-100 tracking-wider uppercase">
                                    System Notifications
                                </span>
                                {unreadCount > 0 && (
                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline uppercase tracking-wider cursor-pointer"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification list — unread only */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/80">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center space-y-2">
                                    <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mx-auto">
                                        <Bell className="w-5 h-5 text-neutral-400 dark:text-neutral-600" />
                                    </div>
                                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                        All Caught Up!
                                    </p>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-500">
                                        No unread online order or system alerts right now.
                                    </p>
                                </div>
                            ) : (
                                notifications.map(item => {
                                    const meta = getCategoryMeta(item.category);
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleNotificationClick(item)}
                                            className="w-full text-left flex items-start gap-3.5 p-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-900/70 transition-colors duration-150 group cursor-pointer"
                                        >
                                            {/* Category icon */}
                                            <div className={`mt-0.5 p-2.5 rounded-xl flex-shrink-0 ${meta.wrapperClass}`}>
                                                {meta.icon}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.pillClass}`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className={`flex-shrink-0 text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${getPriorityBadgeClass(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                                                    {item.title}
                                                </p>

                                                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                                    {item.message}
                                                </p>

                                                {(item.order_no || (item.final_total !== null && item.final_total !== undefined)) && (
                                                    <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                                                        {item.order_no && (
                                                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                                                                #{item.order_no}
                                                            </span>
                                                        )}
                                                        {item.final_total !== null && item.final_total !== undefined && (
                                                            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                                                Rs. {Number(item.final_total).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-0.5">
                                                    {item.createdAt ? (
                                                        <span className="flex items-center gap-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                                                            <Clock className="w-3 h-3" />
                                                            {item.createdAt}
                                                        </span>
                                                    ) : <span />}
                                                    {item.actionUrl && (
                                                        <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Open <ArrowUpRight className="w-3 h-3" />
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Unread dot */}
                                            <div className="mt-2 flex-shrink-0 w-2 h-2 rounded-full bg-orange-500 shadow-xs shadow-orange-500/50" />
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/40 text-center">
                            <Link
                                href="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1.5 text-[11px] font-black text-orange-600 dark:text-orange-400 hover:underline uppercase tracking-wider"
                            >
                                Open Notification Center
                                <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
