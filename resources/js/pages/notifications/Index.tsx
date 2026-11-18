import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    Bell,
    Search,
    CheckCheck,
    ShieldAlert,
    FileText,
    AlertTriangle,
    ArrowRight,
    Loader2,
    ShoppingBag,
    UserPlus,
    Clock,
    CheckCircle2,
    Sparkles,
    RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { type SharedData } from '@/types';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    read: boolean;
    actionUrl?: string;
    order_no?: string | null;
    final_total?: number | null;
    customer_name?: string | null;
    createdAt: string;
}

interface NotificationSummary {
    total: number;
    unread: number;
    online_orders: number;
    customers: number;
    high_priority_unread: number;
}

const PRIORITY_BADGES: Record<string, string> = {
    low: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700',
    medium: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
    high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    critical: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
};

const CATEGORY_TABS = [
    { key: 'all', label: 'All Categories' },
    { key: 'online_orders', label: 'Online Orders' },
    { key: 'customers', label: 'Customer Approvals' },
    { key: 'workflow', label: 'Workflow' },
    { key: 'security', label: 'Security' },
];

export default function NotificationCenter() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [summary, setSummary] = useState<NotificationSummary>({
        total: 0,
        unread: 0,
        online_orders: 0,
        customers: 0,
        high_priority_unread: 0,
    });
    const [search, setSearch] = useState('');
    const [onlyUnread, setOnlyUnread] = useState(false);
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
            unread: onlyUnread ? 'true' : 'false',
        });

        try {
            const res = await axios.get(`/api/v1/notifications?${params}`);
            const json = res.data;
            if (json && Array.isArray(json.data)) {
                if (isNewFilter) {
                    setNotifications(json.data);
                } else {
                    setNotifications(prev => [...prev, ...json.data]);
                }
                setNextPage(json.nextPage);
                if (json.summary) {
                    setSummary(json.summary);
                } else if (typeof json.unreadCount === 'number') {
                    setSummary(prev => ({ ...prev, unread: json.unreadCount }));
                }
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, filterCategory, filterPriority, onlyUnread]);

    // Reset list and reload on search/filter changes
    useEffect(() => {
        setPage(1);
        fetchNotifications(1, true);
    }, [search, filterCategory, filterPriority, onlyUnread, fetchNotifications]);

    // Setup Echo real-time listener for live updates
    useEffect(() => {
        if (!user || !(window as any).Echo) return;

        const echo = (window as any).Echo;
        const channel = echo
            .private(`App.Models.User.${user.id}`)
            .listen('.realtime.notification', (notification: any) => {
                const normalizedCat = (notification.category || 'general').toLowerCase().replace(/\s+/g, '_');
                const matchesCategory = filterCategory === 'all' || normalizedCat === filterCategory;
                const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority;

                const titleText = notification.title || (notification.order_no ? `New Wholesale Order #${notification.order_no}` : 'Notification');
                const msgText = notification.message || '';
                const searchLower = search.toLowerCase();
                const matchesSearch =
                    !search ||
                    titleText.toLowerCase().includes(searchLower) ||
                    msgText.toLowerCase().includes(searchLower);

                setSummary(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    unread: prev.unread + 1,
                    online_orders: normalizedCat === 'online_orders' ? prev.online_orders + 1 : prev.online_orders,
                    customers: normalizedCat === 'customers' ? prev.customers + 1 : prev.customers,
                }));

                if (matchesCategory && matchesPriority && matchesSearch) {
                    setNotifications(prev => [
                        {
                            id: notification.id,
                            title: titleText,
                            message: msgText,
                            category: normalizedCat,
                            priority: notification.priority || 'high',
                            read: false,
                            actionUrl: notification.actionUrl || notification.action_url,
                            order_no: notification.order_no || null,
                            final_total: notification.final_total ?? null,
                            customer_name: notification.customer_name || null,
                            createdAt: 'Just now',
                        },
                        ...prev.filter(n => n.id !== notification.id),
                    ]);
                }
            });

        return () => {
            echo.leave(`App.Models.User.${user.id}`);
        };
    }, [user, filterCategory, filterPriority, search]);

    const handleLoadMore = () => {
        if (nextPage && !loadingMore) {
            setPage(nextPage);
            fetchNotifications(nextPage);
        }
    };

    const markAllRead = async () => {
        setNotifications(prev => (onlyUnread ? [] : prev.map(n => ({ ...n, read: true }))));
        setSummary(prev => ({ ...prev, unread: 0, high_priority_unread: 0 }));
        try {
            await axios.post('/api/v1/notifications/read-all');
        } catch (error) {
            console.error('Failed syncing read states', error);
        }
    };

    const handleMarkSingleRead = async (id: string) => {
        setNotifications(prev =>
            onlyUnread ? prev.filter(n => n.id !== id) : prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        setSummary(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
        try {
            await axios.patch(`/api/v1/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed marking notification read', error);
        }
    };

    const handleActionNavigate = async (item: NotificationItem) => {
        if (!item.read) {
            await handleMarkSingleRead(item.id);
        }
        if (item.actionUrl) {
            router.visit(item.actionUrl);
        }
    };

    const getCategoryMeta = (category: string) => {
        const cat = (category || '').toLowerCase();
        if (cat === 'online_orders' || cat === 'online orders') {
            return {
                label: 'Online Order',
                actionLabel: 'Review Order',
                icon: <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
                wrapperClass: 'bg-emerald-500/10 border border-emerald-500/20',
                badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
            };
        }
        if (cat === 'customers' || cat === 'customer') {
            return {
                label: 'Customer Portal',
                actionLabel: 'Review Customer',
                icon: <UserPlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
                wrapperClass: 'bg-sky-500/10 border border-sky-500/20',
                badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
            };
        }
        if (cat === 'security') {
            return {
                label: 'Security Alert',
                actionLabel: 'Inspect Security',
                icon: <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
                wrapperClass: 'bg-rose-500/10 border border-rose-500/20',
                badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
            };
        }
        if (cat === 'workflow') {
            return {
                label: 'Workflow',
                actionLabel: 'View Request',
                icon: <FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
                wrapperClass: 'bg-orange-500/10 border border-orange-500/20',
                badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20',
            };
        }
        return {
            label: 'System Alert',
            actionLabel: 'View Details',
            icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
            wrapperClass: 'bg-amber-500/10 border border-amber-500/20',
            badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
        };
    };

    const resetFilters = () => {
        setSearch('');
        setFilterCategory('all');
        setFilterPriority('all');
        setOnlyUnread(false);
    };

    const breadcrumbs = [{ title: 'Notification Center', href: '/notifications' }];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notification Center" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                            <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-black text-lg sm:text-xl text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                                    ERP Notification Center
                                </h1>
                                {summary.unread > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-600 text-white">
                                        {summary.unread} Unread
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Real-time wholesale order submissions, customer portal registrations, and system workflow alerts.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                            type="button"
                            onClick={() => fetchNotifications(1, true)}
                            className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                            title="Refresh notifications"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={markAllRead}
                            disabled={summary.unread === 0}
                            className="flex items-center gap-1.5 px-4 h-9 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                        >
                            <CheckCheck className="w-4 h-4" />
                            Mark All Read
                        </button>
                    </div>
                </div>

                {/* KPI Summary Matrix */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                                Unread Alerts
                            </span>
                            <span className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-0.5 block">
                                {summary.unread}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                                Online Orders
                            </span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                {summary.online_orders}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                                Customer Portal
                            </span>
                            <span className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5 block">
                                {summary.customers}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                            <UserPlus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block">
                                Total Logged
                            </span>
                            <span className="text-2xl font-black text-neutral-900 dark:text-neutral-100 mt-0.5 block">
                                {summary.total}
                            </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                            <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3.5">
                    {/* Top Row: Category Pills + All/Unread Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {CATEGORY_TABS.map(tab => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setFilterCategory(tab.key)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                                        filterCategory === tab.key
                                            ? 'bg-orange-600 text-white shadow-xs'
                                            : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setOnlyUnread(false)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    !onlyUnread
                                        ? 'bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white shadow-2xs'
                                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                                }`}
                            >
                                All Alerts
                            </button>
                            <button
                                type="button"
                                onClick={() => setOnlyUnread(true)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    onlyUnread
                                        ? 'bg-orange-600 text-white shadow-2xs'
                                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                                }`}
                            >
                                Unread Only ({summary.unread})
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Search + Priority Select */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[220px]">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by order no (ORD-...), customer name, or message..."
                                className="w-full h-10 pl-10 pr-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 text-xs text-neutral-950 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-orange-500 outline-none transition-all"
                            />
                        </div>

                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 text-xs font-bold text-neutral-950 dark:text-neutral-50 outline-none focus:border-orange-500 transition-all"
                        >
                            <option value="all">All Priorities</option>
                            <option value="high">High Priority</option>
                            <option value="critical">Critical Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>

                        {(search || filterCategory !== 'all' || filterPriority !== 'all' || onlyUnread) && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="h-10 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-bold text-neutral-600 dark:text-neutral-400 transition-all cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-2 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                            <p className="text-xs font-semibold text-neutral-500">Retrieving notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-950 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mb-3">
                                <Bell className="w-6 h-6 text-neutral-400 dark:text-neutral-600" />
                            </div>
                            <p className="text-sm font-black uppercase text-neutral-900 dark:text-neutral-100">
                                No Matching Notifications
                            </p>
                            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                                There are no notifications matching your active filters right now.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {notifications.map((item, index) => {
                                const meta = getCategoryMeta(item.category);
                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.02, 0.2) }}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                                            item.read
                                                ? 'bg-white dark:bg-neutral-950 border-neutral-200/80 dark:border-neutral-800/80 opacity-85'
                                                : 'bg-white dark:bg-neutral-950 border-orange-500/35 shadow-sm ring-1 ring-orange-500/10'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                            {/* Category Icon Wrapper */}
                                            <div className={`mt-0.5 p-3 rounded-xl shrink-0 ${meta.wrapperClass}`}>
                                                {meta.icon}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${meta.badgeClass}`}>
                                                        {meta.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.medium}`}>
                                                        {item.priority}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {item.createdAt}
                                                    </span>
                                                    {!item.read && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 dark:text-orange-400">
                                                            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                            NEW
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
                                                    {item.title}
                                                </p>

                                                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                                    {item.message}
                                                </p>

                                                {(item.order_no || (item.final_total !== null && item.final_total !== undefined) || item.customer_name) && (
                                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                                        {item.order_no && (
                                                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800">
                                                                Order #{item.order_no}
                                                            </span>
                                                        )}
                                                        {item.customer_name && (
                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800">
                                                                Customer: {item.customer_name}
                                                            </span>
                                                        )}
                                                        {item.final_total !== null && item.final_total !== undefined && (
                                                            <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                                                Rs. {Number(item.final_total).toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            {!item.read && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkSingleRead(item.id)}
                                                    className="px-3 h-8 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-[11px] font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    Mark Read
                                                </button>
                                            )}

                                            {item.actionUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleActionNavigate(item)}
                                                    className="px-3.5 h-8 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                                >
                                                    {meta.actionLabel}
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}

                    {/* Pagination Load More */}
                    {nextPage && (
                        <div className="pt-4 flex justify-center">
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loadingMore}
                                className="px-6 h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loadingMore ? 'Loading More...' : 'Load More Notifications'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
