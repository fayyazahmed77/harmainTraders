import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Bell, Search, CheckCheck, ShieldAlert, FileText, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, Head, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    read: boolean;
    actionUrl?: string;
    createdAt: string;
}

const PRIORITY_BADGES: Record<string, string> = {
    low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700',
    medium: 'bg-primary/10 text-primary border border-primary/20',
    high: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    critical: 'bg-red-500/10 text-red-500 border border-red-500/20',
};

export default function NotificationCenter() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [page, setPage] = useState(1);
    const [nextPage, setNextPage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchNotifications = useCallback(async (pageNum: number, isNewFilter = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams({
            page: String(pageNum),
            search,
            category: filterCategory,
            priority: filterPriority,
        });

        try {
            const res = await fetch(`/api/v1/notifications?${params}`);
            const json = await res.json();
            if (json && json.data) {
                if (isNewFilter) {
                    setNotifications(json.data);
                } else {
                    setNotifications(prev => [...prev, ...json.data]);
                }
                setNextPage(json.nextPage);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, filterCategory, filterPriority]);

    // Reset list and reload on search/filter changes
    useEffect(() => {
        setPage(1);
        fetchNotifications(1, true);
    }, [search, filterCategory, filterPriority, fetchNotifications]);

    // Setup Echo real-time listener for live updates
    useEffect(() => {
        if (!user || !window.Echo) return;

        const channel = window.Echo.private(`App.Models.User.${user.id}`)
            .listen('.realtime.notification', (notification: any) => {
                const matchesCategory = filterCategory === 'all' || notification.category === filterCategory;
                const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;
                
                const searchLower = search.toLowerCase();
                const matchesSearch = !search || 
                    notification.title.toLowerCase().includes(searchLower) || 
                    notification.message.toLowerCase().includes(searchLower);

                if (matchesCategory && matchesPriority && matchesSearch) {
                    setNotifications(prev => [
                        {
                            id: notification.id,
                            title: notification.title,
                            message: notification.message,
                            category: notification.category,
                            priority: notification.priority,
                            read: false,
                            actionUrl: notification.actionUrl,
                            createdAt: 'Just now',
                        },
                        ...prev
                    ]);
                }
            });

        return () => {
            window.Echo.leave(`App.Models.User.${user.id}`);
        };
    }, [user, filterCategory, filterPriority, search]);

    const handleLoadMore = () => {
        if (nextPage && !loadingMore) {
            setPage(nextPage);
            fetchNotifications(nextPage);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            await fetch('/api/v1/notifications/read-all', { method: 'POST' });
        } catch (error) {
            console.error('Failed syncing read states', error);
        }
    };

    const handleMarkSingleRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' });
        } catch (error) {
            console.error('Failed marking notification read', error);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'security': 
                return <ShieldAlert className="w-5 h-5 text-destructive" />;
            case 'workflow': 
                return <FileText className="w-5 h-5 text-primary" />;
            default: 
                return <AlertTriangle className="w-5 h-5 text-amber" />;
        }
    };

    const breadcrumbs = [{ title: 'Notification Center', href: '/notifications' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Center" />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                            <Bell className="w-5 h-5 text-primary animate-bounce" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-xl text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">
                                Notification Center
                            </h1>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Monitor logs, security checks, and pending system workflow requests.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        <CheckCheck className="w-4 h-4" />
                        Mark All Read
                    </button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search notifications..."
                            className="w-full h-10 pl-9 pr-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-950 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary transition-all"
                    >
                        <option value="all">All Categories</option>
                        <option value="workflow">Workflow</option>
                        <option value="security">Security</option>
                        <option value="general">General</option>
                    </select>
                    <select
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-xs text-neutral-950 dark:text-neutral-50 outline-none focus:border-primary transition-all"
                    >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                {/* Notification List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-2">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-xs text-neutral-500">Retrieving system alerts...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/10">
                            <Bell className="w-10 h-10 text-neutral-400 dark:text-neutral-600 mb-3" />
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No Notifications</p>
                            <p className="text-xs text-neutral-500">You don't have any notifications at the moment.</p>
                        </div>
                    ) : (
                        notifications.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className={`flex items-start gap-4 p-5 rounded-xl border transition-all ${
                                    item.read
                                        ? 'bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850'
                                        : 'bg-white dark:bg-neutral-950 border-primary/20 shadow-sm shadow-primary/5'
                                }`}
                            >
                                {/* Category Icon Wrapper */}
                                <div className="mt-0.5 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-900 shrink-0">
                                    {getCategoryIcon(item.category)}
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-xs font-black text-neutral-900 dark:text-neutral-50 uppercase tracking-tight leading-tight">
                                            {item.title}
                                        </p>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${PRIORITY_BADGES[item.priority]}`}>
                                            {item.priority}
                                        </span>
                                    </div>
                                    
                                    <p className="text-xs text-neutral-650 dark:text-neutral-400 leading-relaxed">
                                        {item.message}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 pt-1.5">
                                        {item.actionUrl && (
                                            <Link
                                                href={item.actionUrl}
                                                className="flex items-center gap-1 text-[10px] font-black text-primary hover:underline uppercase tracking-wider"
                                            >
                                                Take Action
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                        {!item.read && (
                                            <button
                                                onClick={() => handleMarkSingleRead(item.id)}
                                                className="text-[10px] font-black text-neutral-400 hover:text-neutral-500 uppercase tracking-wider"
                                            >
                                                Mark Read
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className="shrink-0 text-[10px] text-neutral-450 dark:text-neutral-500 font-medium">
                                    {item.createdAt}
                                </span>
                            </motion.div>
                        ))
                    )}

                    {/* Load More Button */}
                    {nextPage && (
                        <div className="flex justify-center pt-6">
                            <button
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="flex items-center justify-center gap-1.5 px-6 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Loading alerts...
                                    </>
                                ) : (
                                    'Load More Alerts'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
